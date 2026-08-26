# Runbook — Dependency Graph Data Correction & Removal

## Objective
Correct or decommission a dependency edge without breaking cryptographic history.

## Invariant Reminder
Never attempt to mutate or delete existing Arkiv entities. Semantic changes publish a newer version (`version: N+1`). Removals publish a version with `state: removed`.

## Procedure
1. **Prepare Updated Declaration**:
   - In `config/dependencies/base-aave-v3.yaml`, update the edge definition with incremented version number (e.g. `version: 2`).
2. **Publish Edge Update via CLI**:
   ```bash
   pnpm --filter @blastradius/publisher-cli build
   node apps/publisher-cli/dist/index.js publish config/dependencies/base-aave-v3.yaml
   ```
3. **Verify Edge Resolution**:
   - Query `GET /api/v1/dependencies/:id` to confirm the graph engine resolves the newest version and ignores older superseded versions.
