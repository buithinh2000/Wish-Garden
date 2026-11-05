import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

class SiteOnlyPermissions(unittest.TestCase):
    def test_no_backend_permissions_in_site_policy(self):
        policy = json.loads((ROOT / 'aws/iam/site-only-staging.policy.json').read_text())
        actions = {a for stmt in policy['Statement'] for a in (stmt['Action'] if isinstance(stmt['Action'], list) else [stmt['Action']])}
        for prefix in ('iam:', 'lambda:', 'dynamodb:', 'apigateway:', 'secretsmanager:', 'ecs:', 'ec2:'):
            self.assertFalse(any(a.startswith(prefix) for a in actions), prefix)

    def test_explicit_deployment_modes_are_isolated(self):
        workflow = (ROOT / '.github/workflows/aws-staging.yml').read_text()
        self.assertIn('options: [validate, upload, site, api, deploy]', workflow)
        self.assertIn("if: github.event.inputs.mode == 'site' || github.event.inputs.mode == 'deploy'", workflow)
        self.assertIn("if: github.event.inputs.mode == 'api' || github.event.inputs.mode == 'deploy'", workflow)
        self.assertIn("if: github.event.inputs.mode != 'api'", workflow)
        self.assertIn("if aws cloudformation deploy --stack-name wish-garden-staging-site", workflow)
        self.assertIn("aws cloudformation deploy --stack-name wish-garden-staging-api", workflow)

    def test_api_only_has_no_site_upload(self):
        workflow = (ROOT / '.github/workflows/aws-staging.yml').read_text()
        self.assertIn("      - name: Build self-hosted 3D web assets\n        if: github.event.inputs.mode != 'api'", workflow)
        self.assertIn("      - name: Upload only site assets to dedicated private S3 bucket\n        if: github.event.inputs.mode != 'api'", workflow)
