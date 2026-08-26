# Runbook — Redis & BullMQ Queue Recovery

## Severity
**P2** (Transient coordinator failure; zero product truth loss)

## Invariant Reminder
Redis is strictly a transient execution coordinator for BullMQ jobs, locks, and cache acceleration. It is **never** a source of product truth.

## Immediate Action Steps
1. **Restart Redis Container / Instance**:
   ```bash
   docker compose restart redis
   ```
2. **Verify Process Reconnection**:
   - `apps/monitor` and `apps/api` will automatically reconnect using exponential backoff.
3. **Queue State Reconstruction**:
   - Monitor schedules are defined declaratively in `MonitorRunner`. When Redis restarts, repeatable jobs are re-registered automatically.
4. **Zero Data Loss Confirmation**:
   - Query Arkiv to confirm on-chain entity history is completely intact.
