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
    def req(self, method='GET', path='/api/v1/summary', origin='https://buithinh2000.github.io'):
        return {'headers': {'origin': origin}, 'rawPath': path,
                'requestContext': {'http': {'method': method}}}

    def setUp(self):
        self.config = patch.dict(os.environ, {
            'ALLOWED_ORIGIN': 'https://buithinh2000.github.io',
            'TABLE_NAME': 'wish-garden-staging-participation-916004827349',
            'REGISTRATION_ENABLED': 'false',
        })
        self.config.start()
        self.addCleanup(self.config.stop)

    def test_next_quarter_and_cutoff(self):
        result = next_batch(datetime(2026, 11, 5, tzinfo=timezone.utc))
        self.assertEqual(result['batchId'], '2026-12-30')
        self.assertEqual(result['cutoffUtc'], '2026-12-29T12:00:00.000Z')
        self.assertEqual(next_batch(datetime(2026, 12, 30, 12, tzinfo=timezone.utc))['batchId'], '2027-03-30')

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

    def test_missing_aws_config_fails_closed(self):
        with patch.dict(os.environ, {'ALLOWED_ORIGIN': ''}):
            self.assertEqual(handler(self.req(), None)['statusCode'], 503)

if __name__ == '__main__':
    unittest.main()
