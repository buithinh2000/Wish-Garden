import importlib.util
import io
import json
import unittest
from pathlib import Path
from urllib.error import HTTPError

SOURCE=Path(__file__).resolve().parents[1]/"scripts"/"smoke_readonly_api.py"
spec=importlib.util.spec_from_file_location("smoke_readonly_api",SOURCE)
smoke=importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)

class Response:
    def __init__(self,status,body):
        self.status=status
        self.headers={"Content-Type":"application/json"}
        self._body=json.dumps(body).encode()
    def read(self,n):
        return self._body[:n]
    def __enter__(self):
        return self
    def __exit__(self,*args):
        return False

class ApiSmokeTests(unittest.TestCase):
    def transport(self, request, timeout=12):
        if request.get_method()=="GET":
            self.assertEqual(request.get_header("Origin"),smoke.ORIGIN)
            return Response(200,{"status":"PLANNING_NOT_TRANSMITTED","submissions":None,"topics":None,
                                 "privacyThresholdReached":False,"batchId":"2026-12-30",
                                 "plannedUtc":"2026-12-30T12:00:00.000Z"})
        self.assertEqual(request.get_method(),"POST")
        self.assertEqual(request.data,b"{}")
        raise HTTPError(request.full_url,503,"Disabled",{},io.BytesIO(b'{"error":"REGISTRATION_NOT_ENABLED"}'))

    def test_honest_summary_and_closed_write(self):
        self.assertTrue(smoke.smoke("https://example.execute-api.ap-southeast-1.amazonaws.com",opener=self.transport))

    def test_reject_wrong_api_contract(self):
        def bad(req,timeout=12):
            return Response(200,{"status":"TRANSMITTED","submissions":42})
        with self.assertRaises(AssertionError):
            smoke.smoke("https://example.execute-api.ap-southeast-1.amazonaws.com",opener=bad)

    def test_requires_https(self):
        with self.assertRaises(ValueError):
            smoke.smoke("http://localhost:8000",opener=self.transport)
