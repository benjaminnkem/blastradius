# Runbook — Arkiv Write Outage Handling

## Severity
**P2** (Monitor observations cannot be published to on-chain state)

## Symptoms
- BullMQ `monitor_publish_queue` backlog increases.
- Worker logs show `ArkivWriteError` or transaction receipt timeouts.
- Old assertions naturally expire into `UNAVAILABLE`.

## Immediate Action Steps
1. **Inspect Worker Queue Metrics**:
   - Check BullMQ failed job counts and queue delay.
2. **Verify Gas & Wallet Balances**:
   - Confirm monitor publisher wallets hold sufficient native gas on the Arkiv network:
     ```bash
     cast balance <MONITOR_PUBLISHER_ADDRESS> --rpc-url $ARKIV_RPC_URL
     ```
3. **Idempotent Retry Policy**:
   - Do NOT flush queues blindly. BullMQ workers use deterministic observation IDs and backoff retries.
4. **Post-Recovery**:
   - Monitor runner automatically writes fresh state with current timestamps. Stale queued jobs past their TTL are automatically dropped.
