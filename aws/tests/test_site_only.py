import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
class SiteOnlyPermissions(unittest.TestCase):
 def test_no_backend_permissions_in_first_phase(self):
  policy=json.loads((ROOT/'aws/iam/site-only-staging.policy.json').read_text())
  actions={a for s in policy['Statement'] for a in (s['Action'] if isinstance(s['Action'],list) else [s['Action']])}
  for prefix in ('iam:','lambda:','dynamodb:','apigateway:','secretsmanager:','ecs:','ec2:'):
   self.assertFalse(any(a.startswith(prefix) for a in actions),prefix)
  self.assertFalse(any(s['Action']== '*' or s['Resource']=='arn:aws:s3:::*' for s in policy['Statement']))
 def test_site_mode_skips_api_and_lambda(self):
  workflow=(ROOT/'.github/workflows/aws-staging.yml').read_text()
  self.assertIn('options: [validate, upload, site, api, deploy]',workflow)
  self.assertIn("if: github.event.inputs.mode == 'api' || github.event.inputs.mode == 'deploy'\n        run: |\n          aws cloudformation deploy --stack-name wish-garden-staging-api",workflow)
  self.assertIn("if: github.event.inputs.mode == 'api' || github.event.inputs.mode == 'deploy'\n        run: |\n          mkdir -p /tmp/wish-garden-lambda",workflow)

 def test_upload_does_not_touch_existing_stacks(self):
  workflow=(ROOT/'.github/workflows/aws-staging.yml').read_text()
  self.assertIn("if: github.event.inputs.mode == 'site' || github.event.inputs.mode == 'deploy'\n        run: |\n          if aws cloudformation deploy --stack-name wish-garden-staging-site",workflow)
  self.assertIn("test \"$(aws cloudformation describe-stacks --stack-name wish-garden-staging-site --query \"Stacks[0].StackStatus\" --output text)\" = \"CREATE_COMPLETE\"",workflow)

 def test_api_only_skips_site_build_and_s3_upload(self):
  workflow=(ROOT/'.github/workflows/aws-staging.yml').read_text()
  self.assertIn("if: github.event.inputs.mode == 'site' || github.event.inputs.mode == 'deploy'\n        run: |\n          if aws cloudformation deploy --stack-name wish-garden-staging-site",workflow)
  self.assertIn("if: github.event.inputs.mode != 'api'\n        run: |\n          mkdir -p assets dist",workflow)
  self.assertIn("if: github.event.inputs.mode != 'api'\n        run: |\n          BUCKET=",workflow)
