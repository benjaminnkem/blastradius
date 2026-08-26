# Runbook — Deployment and Rollback

## Deployment Procedure
1. **Pre-flight Checks**:
   ```bash
   pnpm format:check && pnpm lint && pnpm check-types && pnpm test && pnpm build
   ```
2. **Build Docker Images**:
   ```bash
   docker compose build
   ```
3. **Deploy with Zero Downtime**:
   ```bash
   docker compose up -d --remove-orphans
   ```
4. **Health Smoke Checks**:
   - `GET http://localhost:4000/health/live` -> `200 OK`
   - `GET http://localhost:4000/health/ready` -> `200 OK`
   - `GET http://localhost:4000/api/v1/incidents` -> `200 OK`
   - `GET http://localhost:3000` -> `200 OK`

## Rollback Procedure
1. **Revert Git Commit / Image Tag**:
   ```bash
   git checkout <PREVIOUS_STABLE_COMMIT>
   ```
2. **Redeploy Previous Image**:
   ```bash
   docker compose up -d --build
   ```
3. **Verify Health Probes**:
   - Re-verify `/health/live` and `/health/ready`.
