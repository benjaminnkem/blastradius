# Runbook — Arkiv Read Outage Handling

## Severity
**P1** (API read queries return `UNAVAILABLE` or timeout)

## Symptoms
- `GET /api/v1/incidents` or `/api/v1/dependencies/:id` returns 503 or `UNKNOWN` health consensus.
- Structured metric `arkiv_query_failures_total` increases.
- Frontend status tags show `[UNAVAILABLE]`.

## Immediate Action Steps
1. **Verify Arkiv RPC Connectivity**:
   ```bash
   curl -X POST https://rpc.kaolin.arkiv.network \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```
2. **Fail-Closed Verification**:
   - Confirm the API fails closed to `UNKNOWN` or `UNAVAILABLE` rather than serving stale data as healthy.
3. **Switch Secondary Arkiv RPC**:
   - Update `ARKIV_RPC_URL` in container environment or Helm values to secondary cluster endpoint.
   - Trigger zero-downtime rolling restart of `apps/api`.
4. **Post-Recovery Verification**:
   - Query `GET /api/v1/incidents` to confirm healthy response envelopes and sub-second query latency.
