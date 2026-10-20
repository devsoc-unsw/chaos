"""Verify campaign permissions against local SpiceDB using isolated fixtures.

Run from the repository root: python3 backend/spicedb/test_campaign_permissions.py
Requires the local Compose SpiceDB service. Fixtures are removed after testing.
"""

import json
from pathlib import Path
import subprocess
import unittest
import urllib.request
import uuid


class CampaignPermissionTests(unittest.TestCase):
    """Exercise the real permission engine with disposable relationships."""

    @classmethod
    def setUpClass(cls):
        """Load local connection settings and create an isolated permission graph."""
        root = Path(__file__).resolve().parents[2]
        config = json.loads(subprocess.check_output(
            ['docker', 'compose', '-f', str(root / 'docker-compose.local.yml'),
             'config', '--format', 'json'], text=True,
        ))
        cls.key = config['services']['spicedb']['environment']['SPICEDB_GRPC_PRESHARED_KEY']
        cls.prefix = 'permission-test-' + uuid.uuid4().hex
        cls.platform = cls.object('platform', 'platform')
        cls.org = cls.object('organisation', 'organisation')
        cls.campaign = cls.object('campaign', 'campaign')
        cls.users = {role: cls.object('user', role)
                     for role in ['superuser', 'admin', 'member', 'outsider']}
        cls.relationships = [
            cls.relationship(cls.platform, 'superuser', cls.users['superuser']),
            cls.relationship(cls.org, 'platform', cls.platform),
            cls.relationship(cls.org, 'admin', cls.users['admin']),
            cls.relationship(cls.org, 'member', cls.users['member']),
            cls.relationship(cls.campaign, 'organisation', cls.org),
        ]
        cls.addClassCleanup(cls.cleanup)
        cls.write('OPERATION_TOUCH')

    @classmethod
    def object(cls, kind, suffix):
        """Construct an object reference unique to this test run."""
        return {'objectType': 'chaos/' + kind, 'objectId': cls.prefix + '-' + suffix}

    @staticmethod
    def relationship(resource, relation, subject):
        """Construct one relationship without a subject relation or caveat."""
        return {'resource': resource, 'relation': relation, 'subject': {'object': subject}}

    @classmethod
    def api(cls, path, payload):
        """Call the local HTTP gateway without exposing its authentication key."""
        request = urllib.request.Request(
            'http://127.0.0.1:8443/v1/' + path,
            data=json.dumps(payload).encode(),
            headers={'Authorization': 'Bearer ' + cls.key, 'Content-Type': 'application/json'},
        )
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.load(response)

    @classmethod
    def write(cls, operation):
        """Apply an atomic fixture batch."""
        cls.api('relationships/write', {'updates': [
            {'operation': operation, 'relationship': relationship}
            for relationship in cls.relationships
        ]})

    @classmethod
    def cleanup(cls):
        """Remove only relationships created by this test run."""
        cls.write('OPERATION_DELETE')

    def assert_manage(self, role, allowed):
        """Assert the current permission result with a fully consistent read."""
        response = self.api('permissions/check', {
            'consistency': {'fullyConsistent': True},
            'resource': self.campaign, 'permission': 'manage',
            'subject': {'object': self.users[role]},
        })
        expected = 'PERMISSIONSHIP_HAS_PERMISSION' if allowed else 'PERMISSIONSHIP_NO_PERMISSION'
        self.assertEqual(response['permissionship'], expected)

    def test_superuser_can_manage_campaign(self):
        """Global superusers inherit campaign management through the platform."""
        self.assert_manage('superuser', True)

    def test_admin_can_manage_campaign(self):
        """Organisation admins retain campaign management permission."""
        self.assert_manage('admin', True)

    def test_member_cannot_manage_campaign(self):
        """Organisation membership alone does not grant management."""
        self.assert_manage('member', False)

    def test_outsider_cannot_manage_campaign(self):
        """Unrelated accounts do not gain management permission."""
        self.assert_manage('outsider', False)


if __name__ == '__main__':
    unittest.main()
