"""Regression checks for disposable workflow process cleanup."""

import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from telemetry_workflows import stop_process_group


class ProcessCleanupTests(unittest.TestCase):
    """Exercise session cleanup after the parent has already terminated."""

    def test_exited_parent_still_stops_descendant(self):
        """A descendant must release its listener after its parent exits."""
        with tempfile.TemporaryDirectory(prefix='chaos-cleanup-test-') as folder:
            socket_path = str(Path(folder) / 'worker.sock')
            worker = (
                'import socket,sys,time; s=socket.socket(socket.AF_UNIX); '
                's.bind(sys.argv[1]); s.listen(); time.sleep(60)'
            )
            parent_code = (
                'import subprocess,sys,time,os; '
                'subprocess.Popen([sys.executable,"-c",sys.argv[1],sys.argv[2]]); '
                '\nwhile not os.path.exists(sys.argv[2]): time.sleep(0.01)'
            )
            parent = subprocess.Popen(
                [sys.executable, '-c', parent_code, worker, socket_path],
                start_new_session=True,
            )
            try:
                parent.wait(timeout=5)
                stop_process_group(parent)
                import socket
                import time
                deadline = time.monotonic() + 3
                while True:
                    with socket.socket(socket.AF_UNIX) as probe:
                        try:
                            probe.connect(socket_path)
                        except (ConnectionRefusedError, FileNotFoundError):
                            break
                    if time.monotonic() >= deadline:
                        self.fail('descendant listener survived process group cleanup')
                    time.sleep(0.01)
            finally:
                try:
                    os.killpg(parent.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
                parent.wait(timeout=5)

    def test_group_disappearing_during_cleanup_is_harmless(self):
        """A process exit race still reaps the direct child."""
        from unittest.mock import Mock
        child = Mock(pid=123)
        with patch('telemetry_workflows.os.killpg', side_effect=ProcessLookupError):
            stop_process_group(child)
        child.wait.assert_called_once_with(timeout=5)


if __name__ == '__main__':
    unittest.main()
