"""Run real API/permission/CDC telemetry tests in a disposable Docker project.

Usage: python3 backend/tests/telemetry_workflows.py [--without-cdc]
SQLx compilation uses the normal development database; runtime uses fresh fixtures.
Working reports and captured logs live in the ignored .local/telemetry directory.
"""

import argparse
import base64
import json
import os
from pathlib import Path
import secrets
import select
import signal
import socket
import subprocess
import time
import threading
import uuid


class SpiceDbProxy:
    """Fixture-only TCP proxy that can disconnect SpiceDB without losing its in-memory data."""

    def __init__(self, target_port):
        """Bind loopback on an ephemeral port; forward only to the owned fixture container."""
        self.target = ('127.0.0.1', target_port)
        self.listener = socket.socket()
        self.listener.bind(('127.0.0.1', 0))
        self.listener.listen()
        self.listener.settimeout(0.2)
        self.port = self.listener.getsockname()[1]
        self.stopped = threading.Event()
        self.blocked = threading.Event()
        self.workers = []
        self.thread = threading.Thread(target=self.accept, daemon=True)
        self.thread.start()

    def accept(self):
        """Accept bounded local connections, never inspecting or storing RPC payloads."""
        while not self.stopped.is_set():
            try:
                connection, _ = self.listener.accept()
            except socket.timeout:
                continue
            except OSError:
                break
            worker = threading.Thread(target=self.forward, args=(connection,), daemon=True)
            self.workers.append(worker)
            worker.start()

    def forward(self, connection):
        """Copy bytes until completion, forced outage, or fixture shutdown."""
        target = None
        try:
            if self.blocked.is_set():
                return
            target = socket.create_connection(self.target, timeout=1)
            connection.settimeout(1)
            while not self.blocked.is_set() and not self.stopped.is_set():
                readable, _, _ = select.select([connection, target], [], [], 0.1)
                for source in readable:
                    data = source.recv(65536)
                    if not data:
                        return
                    (target if source is connection else connection).sendall(data)
        except OSError:
            pass
        finally:
            connection.close()
            if target:
                target.close()

    def close(self):
        """Stop all proxy connections and release the test port."""
        self.stopped.set()
        self.listener.close()
        self.thread.join(timeout=3)
        for worker in self.workers:
            worker.join(timeout=3)
        if self.thread.is_alive() or any(worker.is_alive() for worker in self.workers):
            raise RuntimeError('Fixture proxy failed to stop')


def stop_process_group(child):
    """Stop descendants even if the session leader has already exited, then reap it."""
    try:
        os.killpg(child.pid, signal.SIGKILL)
    except ProcessLookupError:
        pass
    child.wait(timeout=5)


def main():
    """Build once, provision isolated services, run the test binary, and always clean up."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--without-cdc', action='store_true', help='Run API/webhook/reconciliation checks; record real CDC as untested.')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    work = root / '.local' / 'telemetry' / ('run-' + uuid.uuid4().hex)
    work.mkdir(parents=True)
    project = 'chaos-telemetry-' + uuid.uuid4().hex[:12]
    env = os.environ.copy()
    with socket.socket() as reservation:
        reservation.bind(('127.0.0.1', 0))
        sequin_port = reservation.getsockname()[1]
    env.update({
        'CHAOS_PHASE5_KEY': secrets.token_hex(32),
        'CHAOS_PHASE5_SESSION_KEY': secrets.token_urlsafe(64),
        'CHAOS_PHASE5_VAULT_KEY': base64.b64encode(secrets.token_bytes(32)).decode(),
        'CHAOS_PHASE5_WEBHOOK_URL': 'http://host.docker.internal:1/api/v1/sequin/spicedb',
        'CHAOS_PHASE5_SEQUIN_PORT': str(sequin_port),
    })
    compose = ['docker', 'compose', '-p', project, '-f', str(root / 'backend/tests/telemetry-compose.yaml'), '--profile', 'cdc']

    def docker(*arguments, check=True):
        """Capture fixture orchestration without printing connection/authentication settings."""
        result = subprocess.run(compose + list(arguments), env=env, capture_output=True, text=True, timeout=180)
        if check and result.returncode:
            (work / 'docker-error.log').write_text(result.stderr)
            raise RuntimeError('Docker prerequisite failed; see ignored docker-error.log')
        return result

    def port(service, number):
        """Resolve a fixture's random loopback port."""
        return int(docker('port', service, str(number)).stdout.strip().rsplit(':', 1)[1])

    child = None
    proxy = None
    report = {'project': project, 'real_cdc_requested': not args.without_cdc, 'status': 'running'}
    try:
        with (work / 'build.log').open('w') as errors:
            built = subprocess.run(['cargo', 'test', '--locked', '--offline', '--lib', '--no-run', '--message-format=json'],
                                   cwd=root / 'backend/server', stdout=subprocess.PIPE, stderr=errors, text=True, timeout=240)
        if built.returncode:
            raise RuntimeError('Build prerequisite failed; see ignored build.log')
        executable = next((item['executable'] for line in built.stdout.splitlines()
                           if (item := json.loads(line)).get('reason') == 'compiler-artifact' and item.get('executable')), None)
        if not executable:
            raise RuntimeError('Build produced no workflow test executable')
        docker('up', '-d', '--wait', 'db', 'spicedb')
        proxy = SpiceDbProxy(port('spicedb', 50051))
        runtime_env = env.copy()
        runtime_env.update({
            'CHAOS_PHASE5_ISOLATED': project,
            'CHAOS_PHASE5_READY_FILE': str(work / 'ready.json'),
            'CHAOS_PHASE5_RESULT_FILE': str(work / 'result.json'),
            'CHAOS_PHASE5_CDC_FILE': str(work / 'cdc.json'),
            'CHAOS_PHASE5_FAULT_FILE': str(work / 'fault.json'),
            'CHAOS_PHASE5_FAULT_ACK_FILE': str(work / 'fault-ack.json'),
            'CHAOS_PHASE5_CDC': '0' if args.without_cdc else '1',
            'DATABASE_URL': f'postgres://telemetry_fixture:telemetry_fixture@127.0.0.1:{port("db", 5432)}/telemetry_fixture',
            'SPICEDB_GRPC_ENDPOINT': f'http://127.0.0.1:{proxy.port}',
            'SPICEDB_KEY': env['CHAOS_PHASE5_KEY'], 'SEQUIN_WEBHOOK_SECRET': env['CHAOS_PHASE5_KEY'],
            'SEQUIN_URL': f'http://127.0.0.1:{sequin_port}', 'SEQUIN_API_TOKEN': env['CHAOS_PHASE5_KEY'],
            'JWT_SECRET': secrets.token_hex(32), 'GOOGLE_CLIENT_ID': 'fixture', 'GOOGLE_CLIENT_SECRET': 'fixture',
            'GOOGLE_REDIRECT_URI': 'http://127.0.0.1:1/callback', 'FRONTEND_URL': 'http://localhost:3000',
            'COOKIE_DOMAIN': 'localhost', 'ALLOWED_ORIGINS': 'http://localhost:3000', 'DEV_ENV': 'dev',
            'S3_BUCKET_NAME': 'fixture', 'S3_ACCESS_KEY': 'fixture', 'S3_SECRET_KEY': 'fixture',
            'S3_ENDPOINT': 'http://127.0.0.1:1', 'S3_REGION_NAME': 'fixture',
            'SMTP_USERNAME': 'fixture@example.invalid', 'SMTP_PASSWORD': 'fixture', 'SMTP_HOST': '127.0.0.1', 'SMTP_PORT': '1',
            'ROLE_NAME_MAX_CHARS': '100', 'ROLE_DESCRIPTION_MAX_CHARS': '1000', 'ROLE_POSITIONS_AVAILABLE_MAX': '100',
            'CAMPAIGN_NAME_MAX_CHARS': '100', 'CAMPAIGN_DESCRIPTION_MAX_CHARS': '1000', 'RECONCILE_DELETE': 'true',
        })
        with (work / 'test.log').open('w') as output:
            child = subprocess.Popen([executable, '--exact', 'telemetry::receiver_tests::workflows::routed_workflows_reach_receiver', '--ignored', '--nocapture'],
                                     cwd=root / 'backend/server', env=runtime_env, stdout=output, stderr=subprocess.STDOUT, start_new_session=True)
            deadline = time.monotonic() + 300
            cdc_started = False
            while child.poll() is None:
                if time.monotonic() > deadline:
                    raise RuntimeError('Workflow fixture exceeded five-minute deadline')
                fault_file = work / 'fault.json'
                if fault_file.exists():
                    try:
                        fault = json.loads(fault_file.read_text())
                    except json.JSONDecodeError:
                        time.sleep(0.1)
                        continue
                    (proxy.blocked.clear if fault['available'] else proxy.blocked.set)()
                    (work / 'fault-ack.json').write_text(json.dumps(fault))
                ready_file = work / 'ready.json'
                if not args.without_cdc and not cdc_started and ready_file.exists():
                    try:
                        ready = json.loads(ready_file.read_text())
                    except json.JSONDecodeError:
                        time.sleep(0.1)
                        continue
                    env['CHAOS_PHASE5_WEBHOOK_URL'] = ready['webhook_url']
                    docker('up', '-d', 'sequin')
                    (work / 'cdc.json').write_text(json.dumps({'url': f'http://127.0.0.1:{port("sequin", 7376)}'}))
                    cdc_started = True
                time.sleep(0.1)
        if child.returncode:
            raise RuntimeError('Workflow assertions failed; see ignored test.log')
        report.update(json.loads((work / 'result.json').read_text()))
        report['status'] = 'passed'
    except (RuntimeError, subprocess.TimeoutExpired, OSError) as error:
        report.update(status='failed', error=str(error))
    finally:
        if child:
            try:
                stop_process_group(child)
                report['process_cleanup_passed'] = True
            except (OSError, subprocess.TimeoutExpired):
                report['process_cleanup_passed'] = False
        if proxy:
            try:
                proxy.close()
                report['proxy_cleanup_passed'] = True
            except RuntimeError:
                report['proxy_cleanup_passed'] = False
        try:
            cleanup = docker('down', '--volumes', '--remove-orphans', check=False)
            report['cleanup_passed'] = cleanup.returncode == 0
        except (OSError, subprocess.TimeoutExpired):
            report['cleanup_passed'] = False
        (work / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'status': report['status'], 'cleanup_passed': report['cleanup_passed'], 'report': str(work / 'report.json')}))
    return 0 if report['status'] == 'passed' and report['cleanup_passed'] and report.get('proxy_cleanup_passed', True) and report.get('process_cleanup_passed', True) else 1


if __name__ == '__main__':
    raise SystemExit(main())
