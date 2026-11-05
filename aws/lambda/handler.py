"""Wish Garden AWS-only participation API (Python 3.12, Lambda HTTP API v2).
Initial release is read-only with no database. Opt-ins remain CLOSED until a separate AWS-native
abuse-control and consent gate is reviewed and independently tested.
No private wishes, names, or emails are accepted or persisted.
"""
import json
import os
from datetime import datetime, timezone
from decimal import Decimal

TOPICS = ("peace", "family", "health", "future", "remembrance", "gratitude")
MILESTONES = (3, 6, 9, 12)

def next_batch(now=None):
    now = now or datetime.now(timezone.utc)
    for year in range(now.year, now.year + 3):
        for month in MILESTONES:
            candidate = datetime(year, month, 30, 12, tzinfo=timezone.utc)
            if candidate > now:
                cutoff = candidate.timestamp() - 86400
                return {
                    "batchId": candidate.date().isoformat(),
                    "plannedUtc": candidate.isoformat(timespec="milliseconds").replace("+00:00", "Z"),
                    "cutoffUtc": datetime.fromtimestamp(cutoff, timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
                }
    raise ValueError("No future batch")

def response(status, data, origin=None, allowed=None):
    headers = {"Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store"}
    if allowed and origin == allowed:
        headers.update({"Access-Control-Allow-Origin": origin,
                        "Access-Control-Allow-Methods": "GET,OPTIONS",
                        "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin"})
    return {"statusCode": status, "headers": headers, "body": json.dumps(data, separators=(",", ":"))}

def handler(event, context):
    """Configured read-only, no DynamoDB writes and no network egress needed."""
    origin = (event.get("headers") or {}).get("origin", "")
    allowed = os.environ.get("ALLOWED_ORIGIN", "")
    method = (event.get("requestContext") or {}).get("http", {}).get("method", "")
    path = event.get("rawPath", "")
    if not allowed:
        return response(503, {"error": "NOT_CONFIGURED"})
    if origin != allowed:
        return response(403, {"error": "ORIGIN_DENIED"})
    if path not in ("/api/v1/summary", "/api/v1/participation"):
        return response(404, {"error": "NOT_FOUND"}, origin, allowed)
    if method == "OPTIONS":
        return response(204, {}, origin, allowed)
    if method != "GET" or path != "/api/v1/summary":
        return response(503, {"error": "REGISTRATION_NOT_ENABLED"}, origin, allowed)

    plan = next_batch()
    # No fabricated community counts; opted-in database is not yet live.
    return response(200, {**plan, "status": "PLANNING_NOT_TRANSMITTED",
                          "aggregation": "not collected",
                          "submissions": None, "topics": None,
                          "privacyThresholdReached": False}, origin, allowed)
