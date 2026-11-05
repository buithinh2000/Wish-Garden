import json
import os
import unittest
from datetime import datetime, timezone
from unittest.mock import patch
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'lambda'))
from handler import next_batch, handler

class ApiTests(unittest.TestCase):
    def req(self, method='GET', path='/api/v1/summary', origin='https://d3vvpfv5t9ws76.cloudfront.net'):
        return {'headers': {'origin': origin}, 'rawPath': path,
                'requestContext': {'http': {'method': method}}}

    def setUp(self):
        self.config = patch.dict(os.environ, {
            'ALLOWED_ORIGIN': 'https://d3vvpfv5t9ws76.cloudfront.net',
            'REGISTRATION_ENABLED': 'false',
        })
        self.config.start()
        self.addCleanup(self.config.stop)

    def test_next_quarter_and_cutoff(self):
        result = next_batch(datetime(2026, 11, 5, tzinfo=timezone.utc))
        self.assertEqual(result['batchId'], '2026-12-30')
        self.assertEqual(result['cutoffUtc'], '2026-12-29T12:00:00.000Z')
        self.assertEqual(next_batch(datetime(2026, 12, 30, 12, tzinfo=timezone.utc))['batchId'], '2027-03-30')

    def test_readonly_stack_has_no_database_or_write_policy(self):
        template=(Path(__file__).resolve().parents[1]/'cloudformation'/'api.yaml').read_text()
        self.assertNotIn('AWS::DynamoDB::Table', template)
        self.assertNotIn('TABLE_NAME:', template)
        self.assertNotIn('dynamodb:', template.lower())
        self.assertNotIn('TableName:', template)
        self.assertNotIn('RegistrationEnabled:\\n    Value: \'true\'',template)

    def test_no_fabricated_participants_or_transmissions(self):
        resp = handler(self.req(), None)
        self.assertEqual(resp['statusCode'], 200)
        body = json.loads(resp['body'])
        self.assertIsNone(body['submissions'])
        self.assertIsNone(body['topics'])
        self.assertEqual(body['status'], 'PLANNING_NOT_TRANSMITTED')

    def test_writes_fail_closed(self):
        for method in ('POST', 'DELETE', 'PUT'):
            resp = handler(self.req(method=method, path='/api/v1/participation'), None)
            self.assertEqual(resp['statusCode'], 503)
            self.assertEqual(json.loads(resp['body'])['error'], 'REGISTRATION_NOT_ENABLED')

    def test_untrusted_origins_are_rejected(self):
        self.assertEqual(handler(self.req(origin='https://evil.invalid'), None)['statusCode'], 403)
        self.assertEqual(handler(self.req(origin=''), None)['statusCode'], 403)

    def test_readonly_api_matches_verified_aws_frontend_origin(self):
        from pathlib import Path
        template = (Path(__file__).resolve().parents[1] / 'cloudformation' / 'api.yaml').read_text()
        self.assertIn('Default: https://d3vvpfv5t9ws76.cloudfront.net', template)
        self.assertNotIn('Default: https://buithinh2000.github.io', template)
        response = handler(self.req(), None)
        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(response['headers']['Access-Control-Allow-Origin'], 'https://d3vvpfv5t9ws76.cloudfront.net')
        self.assertEqual(response['headers']['Cache-Control'], 'no-store')

    def test_no_write_even_if_flag_accidentally_enabled(self):
        with patch.dict(os.environ, {'REGISTRATION_ENABLED': 'true'}):
            for method in ('POST', 'PATCH', 'DELETE', 'PUT'):
                response = handler(self.req(method=method, path='/api/v1/participation'), None)
                self.assertEqual(response['statusCode'], 503)
                self.assertEqual(json.loads(response['body'])['error'], 'REGISTRATION_NOT_ENABLED')

    def test_no_cross_origin_cors_or_private_data_on_reject(self):
        response = handler(self.req(origin='https://attacker.invalid'), None)
        self.assertEqual(response['statusCode'], 403)
        self.assertNotIn('Access-Control-Allow-Origin', response['headers'])
        self.assertNotIn('TABLE_NAME', response['body'])

    def test_missing_aws_config_fails_closed(self):
        with patch.dict(os.environ, {'ALLOWED_ORIGIN': ''}):
            self.assertEqual(handler(self.req(), None)['statusCode'], 503)

if __name__ == '__main__':
    unittest.main()
