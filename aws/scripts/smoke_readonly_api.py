#!/usr/bin/env python3
"""Read-only Wish Garden API deployment smoke, with no registration data.

Checks actual HTTP API from GitHub Actions after deployment. POST uses an
empty body and must be rejected. Never sends names, email or private wishes.
"""
import json
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ORIGIN = "https://d3vvpfv5t9ws76.cloudfront.net"

def request(url, method, payload=None, opener=urlopen):
    req = Request(
        url, data=payload, method=method,
        headers={"Origin": ORIGIN, "Accept": "application/json",
                 "Content-Type": "application/json"},
    )
    try:
        with opener(req, timeout=12) as response:
            return response.status, dict(response.headers), response.read(65537)
    except HTTPError as exc:
        return exc.code, dict(exc.headers), exc.read(65537)

def smoke(base_url, opener=urlopen):
    if not base_url.startswith("https://") or "?" in base_url or "#" in base_url:
        raise ValueError("Expected HTTPS API base URL")
    base = base_url.rstrip("/")
    status, headers, body = request(base + "/api/v1/summary", "GET", opener=opener)
    if status != 200:
        raise AssertionError(f"GET /summary status {status}; expected 200")
    if len(body)>65536:
        raise AssertionError("Oversized API summary")
    data = json.loads(body)
    if data.get("status") != "PLANNING_NOT_TRANSMITTED":
        raise AssertionError("API claimed unexpected transmission status")
    if data.get("submissions") is not None or data.get("topics") is not None:
        raise AssertionError("Unverified registration totals must be null")
    if data.get("privacyThresholdReached") is not False:
        raise AssertionError("Privacy threshold must not be claimed")
    if not data.get("batchId") or not data.get("plannedUtc"):
        raise AssertionError("Missing proposed plan")
    status, _, body = request(
        base + "/api/v1/participation", "POST", payload=b"{}", opener=opener)
    if status != 503:
        raise AssertionError(f"Registration endpoint returned {status}; expected 503")
    reject = json.loads(body)
    if reject.get("error") != "REGISTRATION_NOT_ENABLED":
        raise AssertionError("Registration endpoint not fail-closed")
    print("PASS: read-only summary honest, no verified totals, empty registration POST rejected")
    return True

if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Usage: smoke_readonly_api.py <https-api-base-url>")
    try:
        smoke(sys.argv[1])
    except (ValueError, AssertionError, URLError, json.JSONDecodeError) as exc:
        sys.exit(f"FAIL: {exc}")
