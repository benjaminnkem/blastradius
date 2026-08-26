# Runbook — Monitored Chain RPC Outage Handling

## Severity
**P2** (Monitors cannot query target chain state such as Base or Ethereum)

## Symptoms
- `RpcMonitor` or `SequencerMonitor` reports degraded provider agreement.
- Target chain observations report `RPC_TIMEOUT` or block height disagreement.

## Immediate Action Steps
1. **Identify Failing Provider**:
   - Inspect monitor logs for specific RPC endpoints failing HTTP/latency probes.
2. **Provider Failover**:
   - The multi-RPC runner automatically excludes failing endpoints and requires a majority of remaining healthy endpoints.
3. **Endpoint Rotation**:
   - If a public endpoint (e.g. `1rpc.io`) is rate-limiting, replace it with an authenticated RPC endpoint in `.env` / secret manager.
4. **Post-Recovery Verification**:
   - Verify that all 3 registered providers return identical latest block heights.
