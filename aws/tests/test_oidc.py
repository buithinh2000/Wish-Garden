import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

class OIDCPolicyTests(unittest.TestCase):
    def test_trust_has_exact_audience_and_wish_garden_environment(self):
        doc = json.loads((ROOT / 'aws/iam/oidc-trust.json').read_text())
        statements = doc['Statement']
        self.assertEqual(len(statements), 1)
        rule = statements[0]
        self.assertEqual(rule['Action'], 'sts:AssumeRoleWithWebIdentity')
        self.assertEqual(rule['Principal']['Federated'],
                         'arn:aws:iam::916004827349:oidc-provider/token.actions.githubusercontent.com')
        claims = rule['Condition']['StringEquals']
        self.assertEqual(claims['token.actions.githubusercontent.com:aud'], 'sts.amazonaws.com')
        subjects = claims['token.actions.githubusercontent.com:sub']
        self.assertEqual(len(subjects), 2)
        for sub in subjects:
            self.assertNotIn('*', sub)
            self.assertTrue(sub.endswith(':environment:wish-garden-aws-staging'))
            self.assertIn('Wish-Garden', sub)

    def test_deploy_checks_exact_role_not_buitai_core(self):
        workflow = (ROOT / '.github/workflows/aws-staging.yml').read_text()
        self.assertIn('arn:aws:iam::916004827349:role/WishGardenGitHubStagingDeployRole', workflow)
        self.assertIn("github.ref == 'refs/heads/main'", workflow)
        self.assertNotIn('BuiTaiGitHubDeployRole', workflow)

    def test_preflight_has_no_mutating_aws_calls(self):
        workflow = (ROOT / '.github/workflows/aws-oidc-preflight.yml').read_text()
        self.assertIn('aws sts get-caller-identity', workflow)
        for operation in ('cloudformation deploy', 's3 sync', 'lambda update-function-code', 'dynamodb put-item'):
            self.assertNotIn(operation, workflow.lower())
        self.assertIn('wish-garden-aws-staging', workflow)

if __name__ == '__main__':
    unittest.main()
