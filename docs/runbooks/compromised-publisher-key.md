# Runbook — Compromised Publisher Key Revocation

## Severity
**P0** (Security Emergency)

## Symptoms
- Malicious or anomalous claims published by a recognized creator address.

## Immediate Action Steps
1. **Emergency Trust Policy Update**:
   - Open `config/trust/trust-policy.yaml`.
   - Set `enabled: false` for the compromised address.
   - Or increment policy version and remove the address from the `publishers` list.
2. **Deploy Policy Update**:
   - Redeploy or trigger policy reload in `apps/api` and `apps/monitor`.
3. **Quorum Re-evaluation**:
   - The consensus engine immediately excludes all historical and incoming assertions from the revoked creator address during query-time evaluation.
4. **Key Rotation**:
   - Generate a fresh keypair, fund it on Arkiv, and add the new public address to the trust policy.
