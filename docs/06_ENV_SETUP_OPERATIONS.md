# BlastRadius — Environment Setup, Operations, Deployment, and Runbooks

This document is the canonical operational guide for BlastRadius. It is intentionally explicit so a new engineer or coding agent with no prior context can configure, run, deploy, and diagnose the system without inventing missing infrastructure.

> **Important August 2026 Arkiv status:** the Braga public testnet was retired on 12 August 2026. There is currently no public Arkiv RPC/explorer/faucet. A limited devnet is available by request, and a new public testnet is expected in September 2026. Never hard-code retired Braga values. Treat all Arkiv network values as environment-driven and re-check the official docs immediately before implementation/deployment.

## 1. Runtime services

BlastRadius is a pnpm/Turborepo TypeScript monorepo with these runtime surfaces:

- `apps/web` — Next.js public application.
- `apps/api` — NestJS HTTP API and optional realtime gateway.
- `apps/monitor` — NestJS/BullMQ workers that observe real infrastructure and publish short-lived health assertions.
- `apps/publisher-cli` — operator CLI for validating and publishing evidence-backed dependency edges, monitor methods, and protocol responses.
- Redis — BullMQ, rate limiting, distributed coordination, and reconstructable caches only.
- Arkiv — authoritative shared public state for product entities.

No MongoDB/Postgres is part of the v1 source-of-truth architecture.

## 2. Prerequisites

Use versions pinned by the repository after Phase 0. Until then, the expected toolchain is:

- Node.js current LTS supported by the selected Next.js/NestJS versions.
- Corepack enabled.
- pnpm pinned in root `packageManager`.
- Docker + Docker Compose for Redis and test infrastructure.
- Git.
- A browser for Playwright.
- A real EVM RPC provider for each monitored chain.
- Real Arkiv devnet access or another officially supported Arkiv environment.

Recommended host minimum for local full-stack development:

- 4 CPU cores.
- 8 GB RAM minimum; 16 GB preferred when Playwright + workers + Docker run together.
- 10 GB free disk.

## 3. Environment-file policy

Use service-scoped env files. Do not expose server secrets via `NEXT_PUBLIC_*`.

Recommended layout:

```text
.env.example
apps/web/.env.local
apps/api/.env
apps/monitor/.env
apps/publisher-cli/.env
```

The root `.env.example` must contain variable names and safe placeholder formats only. Never include a real private key, API token, devnet credential, or production endpoint with embedded auth.

All services must validate environment variables at startup using the central configuration package. Invalid/missing required values must terminate startup with an actionable error.

## 4. Canonical environment variable inventory

Codex must keep this table synchronized with the final implementation and `HANDOFF.md`.

### Shared identity/runtime

| Variable | Used by | Required | Secret | Purpose / format |
|---|---|---:|---:|---|
| `NODE_ENV` | all | yes | no | `development`, `test`, `production` |
| `LOG_LEVEL` | api/monitor/cli | no | no | `debug`, `info`, `warn`, `error`; default must be safe |
| `BLASTRADIUS_PROJECT` | api/monitor/cli | yes | no | Canonical namespace, e.g. `blastradius-v1`; tests use isolated suffixes |
| `APP_VERSION` | all | no | no | Build SHA/version surfaced in diagnostics |
| `OTEL_SERVICE_NAME` | api/monitor | no | no | Service identity for telemetry |

### Arkiv

| Variable | Used by | Required | Secret | Purpose / format |
|---|---|---:|---:|---|
| `ARKIV_RPC_URL` | api/monitor/cli | yes when Arkiv enabled | maybe | Current supported Arkiv JSON-RPC endpoint. Never default to retired Braga. |
| `ARKIV_CHAIN_ID` | api/monitor/cli | yes when Arkiv enabled | no | Current Arkiv chain/network ID as integer/string per SDK requirements |
| `ARKIV_NETWORK_NAME` | api/monitor/cli | recommended | no | Human-readable network label for diagnostics |
| `ARKIV_EXPLORER_URL` | web/api | optional | no | Current explorer base URL if one exists; UI must hide explorer CTA if absent |
| `ARKIV_MONITOR_PRIVATE_KEY` | monitor | yes for publishing | **yes** | Dedicated monitor publisher key; `0x` + 64 hex chars |
| `ARKIV_CURATOR_PRIVATE_KEY` | publisher-cli | yes for curated edge/method writes | **yes** | Dedicated curator key |
| `ARKIV_PROTOCOL_PRIVATE_KEY` | publisher-cli / protocol integration | conditional | **yes** | Protocol response/declaration signer if operated by BlastRadius or partner |
| `ARKIV_REQUEST_TIMEOUT_MS` | api/monitor/cli | yes | no | Bounded network deadline |
| `ARKIV_READ_MAX_RETRIES` | api/monitor/cli | yes | no | Bounded read retries; writes require reconciliation instead of blind retry |
| `ARKIV_QUERY_PAGE_SIZE` | api | yes | no | Must respect SDK/server max |
| `ARKIV_QUERY_MAX_PAGES` | api | yes | no | Hard safety bound |
| `ARKIV_HEALTH_ASSERTION_TTL_SEC` | monitor | yes | no | Short-lived assertion TTL; must satisfy current Arkiv TTL rules |

**Key handling:** production private keys should preferably be injected through a secret manager/KMS-capable deployment system. `.env` private keys are acceptable only for local/devnet development with isolated wallets.

### Redis / BullMQ

| Variable | Used by | Required | Secret | Purpose |
|---|---|---:|---:|---|
| `REDIS_URL` | api/monitor | yes | maybe | `redis://...` or `rediss://...` |
| `REDIS_TLS_REJECT_UNAUTHORIZED` | api/monitor | conditional | no | Explicit TLS behavior; never silently disable verification in production |
| `BULLMQ_PREFIX` | monitor | yes | no | Namespace such as `blastradius` |
| `MONITOR_WORKER_CONCURRENCY` | monitor | yes | no | Bounded worker concurrency |
| `MONITOR_JOB_ATTEMPTS` | monitor | yes | no | Bounded attempts |
| `MONITOR_JOB_BACKOFF_MS` | monitor | yes | no | Base retry backoff |
| `CACHE_DEFAULT_TTL_SEC` | api | yes | no | Reconstructable cache TTL only |

### API

| Variable | Used by | Required | Secret | Purpose |
|---|---|---:|---:|---|
| `API_HOST` | api | no | no | Bind host, normally `0.0.0.0` in containers |
| `API_PORT` | api | yes | no | HTTP port |
| `API_PUBLIC_BASE_URL` | api/web | yes in deployed env | no | Canonical external API base |
| `CORS_ALLOWED_ORIGINS` | api | yes in production | no | Explicit comma-separated/JSON origin allowlist |
| `API_RATE_LIMIT_WINDOW_SEC` | api | yes | no | Rate-limit window |
| `API_RATE_LIMIT_MAX` | api | yes | no | Max requests per window per configured key |
| `API_REQUEST_BODY_LIMIT` | api | yes | no | Explicit request body size limit |
| `API_SHUTDOWN_GRACE_MS` | api | yes | no | Graceful shutdown window |

### Graph/trust limits

| Variable | Used by | Required | Secret | Purpose |
|---|---|---:|---:|---|
| `GRAPH_MAX_DEPTH` | api | yes | no | Traversal depth bound |
| `GRAPH_MAX_NODES` | api | yes | no | Node bound |
| `GRAPH_MAX_EDGES` | api | yes | no | Edge bound |
| `GRAPH_MAX_PATHS` | api | yes | no | Explainable path bound |
| `GRAPH_TOP_PATHS_PER_OPERATION` | api | yes | no | Top-N path explanations |
| `GRAPH_DEADLINE_MS` | api | yes | no | Traversal/query deadline |
| `TRUST_POLICY_PATH` | api/monitor/cli | yes | no | Version-controlled YAML/JSON trust config path |
| `DEPENDENCY_DECLARATIONS_PATH` | publisher-cli | conditional | no | Operator declaration directory |
| `MONITOR_TARGETS_PATH` | monitor | yes | no | Monitor target config |

### RPC providers and monitored chains

Provider credentials must not be hard-coded into dependency data. Use explicit environment variables or secret references in monitor target configuration.

Recommended convention:

```text
RPC_BASE_PRIMARY_URL=
RPC_BASE_SECONDARY_URL=
RPC_BASE_TERTIARY_URL=
RPC_ETHEREUM_PRIMARY_URL=
RPC_ETHEREUM_SECONDARY_URL=
...
```

Do not assume all providers implement identical methods. Monitor adapters must validate method support and fail to `UNKNOWN/UNAVAILABLE` rather than fabricate state.

### Oracle configuration

Oracle contract addresses, decimals, heartbeat assumptions, chain IDs, and method/version are public configuration, preferably in version-controlled target files with authoritative evidence URLs. Provider URLs/private API tokens stay in environment/secrets.

### Observability

| Variable | Used by | Required | Secret | Purpose |
|---|---|---:|---:|---|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | api/monitor | optional | maybe | OTLP endpoint |
| `OTEL_EXPORTER_OTLP_HEADERS` | api/monitor | optional | **yes** | Collector auth headers |
| `METRICS_ENABLED` | api/monitor | yes | no | Enable metrics endpoint/export |
| `METRICS_PORT` | api/monitor | conditional | no | If separate metrics listener is used |
| `SENTRY_DSN` | web/api/monitor | optional | semi-secret | Error reporting if selected |

### Web

Only publish non-secret values:

```text
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_APP_ENV=
NEXT_PUBLIC_ARKIV_EXPLORER_URL=
```

The browser must never receive publisher private keys, Redis credentials, private RPC tokens, or secret monitoring credentials.

## 5. How to obtain external values

### Arkiv network/devnet

1. Check the current official Arkiv docs/status page immediately before setup.
2. If no public network is available, request limited devnet access through the official Arkiv community channel.
3. Obtain the current RPC URL, chain/network ID, any faucet/funding process, and explorer URL if available.
4. Create isolated EVM wallets for monitor/curator/protocol roles.
5. Fund only the test/devnet wallets as required by the current network.
6. Record the wallet **addresses**, not private keys, in the trust policy where applicable.

Never copy network constants from old tutorials without validating them.

### EVM RPC providers

For production, use at least two independent providers for critical chain observations where feasible. Examples of provider classes include managed RPC vendors and self-hosted nodes. Codex must not pick a paid vendor without user approval when cost/contract materially changes deployment.

For each target chain, verify:

- chain ID;
- method support;
- rate limits;
- expected block cadence;
- archive requirement if historical reads are used;
- WebSocket availability if subscriptions are used;
- authentication and quota behavior.

## 6. Local startup sequence

After Codex has completed implementation, the expected clean flow is:

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
# create service-specific env files as documented

docker compose up -d redis
pnpm lint
pnpm typecheck
pnpm test
pnpm build

# terminal 1
pnpm --filter @blastradius/api dev

# terminal 2
pnpm --filter @blastradius/monitor dev

# terminal 3
pnpm --filter @blastradius/web dev
```

Exact package names may differ based on Phase 0 repository conventions; `HANDOFF.md` must contain the exact commands ultimately implemented.

## 7. Bootstrap sequence for a real environment

The system should never display fake production graph state. Real bootstrap should be:

1. Validate trust policy.
2. Validate monitor target definitions against current chain/oracle configuration.
3. Validate dependency declaration files locally.
4. Publish `MonitorMethod` entities with the curator/monitor identity allowed by policy.
5. Publish verified `DependencyEdge` entities only after evidence validation succeeds.
6. Start monitor workers.
7. Observe real infrastructure.
8. Publish real short-lived `HealthAssertion` entities.
9. Query API and verify provenance/expiry.
10. Start web UI.

The initial UI may legitimately show an empty graph or `NO VERIFIED DATA` until this bootstrap completes.

## 8. Containerization and deployment

Each runtime app should build a minimal production container using multi-stage builds. Requirements:

- non-root user;
- immutable application image;
- no source `.env` copied into image;
- production dependencies only;
- health endpoints;
- proper SIGTERM handling;
- pinned base image digest for controlled releases if organizational policy requires;
- SBOM/image scan in CI where available.

Recommended topology:

```text
Internet
   |
   v
[Web CDN/Next]
   |
   v
[API replicas] ------> [Redis]
   |                     ^
   |                     |
   +---- Arkiv <----- [Monitor workers]
                        |
                        +---- Real RPC/oracle endpoints

[Publisher CLI] -----> Arkiv
```

Do not allow the public API/web network identity to publish arbitrary Arkiv records.

## 9. Scaling policy

### API

Scale horizontally because graph/read endpoints are stateless except for reconstructable Redis cache. Cache key must include graph fingerprint/trust-policy version/network namespace so stale results cannot cross configurations.

### Monitor workers

Partition by deterministic target ID. Use BullMQ job IDs and/or distributed locks to avoid duplicate publication. Duplicate execution must remain safe even if two workers race.

### Arkiv reads

Always paginate and bound. For large graphs, fetch data in targeted batches and use application-side adjacency indexes. Never assume Arkiv provides joins.

### Provider quotas

Apply concurrency limits, per-provider timeout budgets, exponential backoff with jitter, and circuit-breaker style suppression if a provider repeatedly fails. Never let one provider outage overwhelm workers.

## 10. Health endpoints

`/health/live` answers whether the process/event loop is alive.

`/health/ready` should fail when critical dependencies required for the service’s current role are unavailable. Example API readiness can require Redis only if Redis is mandatory for configured rate limiting/cache; it should expose Arkiv degraded status separately if reads can still fail gracefully per request. Monitor readiness should reflect Redis/queue/config validity and current Arkiv publish capability.

Do not mark the product `HEALTHY` because the process is alive.

## 11. Operational alerts

At minimum alert on:

- monitor job failure rate;
- observation-to-publication latency;
- zero successful observations for an enabled target beyond an expected interval;
- Arkiv read/write error rate;
- unknown Arkiv write outcomes;
- Redis connection instability;
- queue depth/oldest job age;
- RPC timeout/error/disagreement spikes;
- graph query truncation rate;
- API 5xx and p95/p99 latency;
- readiness failures;
- publisher wallet balance threshold if the network requires gas/funds.

No metric label may use unbounded user-supplied strings or entity keys if that creates high cardinality.

## 12. Key rotation runbook

1. Generate a new role-specific wallet securely.
2. Fund it only as required.
3. Add its public address to the trust policy with a version bump and explicit activation time.
4. Deploy policy update.
5. Switch the corresponding secret/private key.
6. Verify new writes are created by the new immutable creator.
7. Disable/remove the old creator from accepted-current publisher policy while preserving historical provenance.
8. Revoke old secret access.
9. Document incident/rotation reason.

Old Arkiv entities remain historically attributable; rotation must never attempt to rewrite creator provenance.

## 13. Arkiv outage runbook

When Arkiv cannot be read or written:

- monitors continue real observation only if bounded local processing is safe, but must not pretend assertions were published;
- unknown write results trigger reconciliation before any retry;
- API returns explicit `ARKIV_QUERY_UNAVAILABLE`/partial-unavailable metadata;
- UI renders `DATA SOURCE UNAVAILABLE`, not `HEALTHY`;
- Redis cache may serve only if response is clearly marked with its observation timestamp/freshness and policy permits; it must never outlive configured safety TTL;
- once Arkiv recovers, reconcile pending unknown writes and resume normal publication.

## 14. RPC/provider outage runbook

- distinguish one-provider failure from chain-wide failure;
- use independent providers where configured;
- report insufficient observation coverage when quorum/coverage drops;
- do not infer chain failure solely from one vendor’s HTTP 500;
- back off unhealthy provider calls;
- retain disagreement evidence for the current observation without leaking credentials.

## 15. Redis outage runbook

Because Redis is not authoritative:

- API cache/rate-limit behavior should fail according to explicitly selected policy;
- monitor scheduling may halt if BullMQ is unavailable;
- do not publish duplicate assertions from uncontrolled ad-hoc fallback loops;
- expose readiness failure;
- after Redis recovery, deterministic job IDs prevent runaway replay.

## 16. Rollback

Application deployment rollback must be possible independently from Arkiv data. Never “rollback” by deleting historical Arkiv records. If an erroneous dependency declaration was published, publish a new higher version with `state=removed` or a corrected higher version according to entity lifecycle rules.

Before rolling back code, confirm schema/reader compatibility with entities already published by the newer version.

## 17. Production launch checklist

A launch cannot be called ready until:

- current Arkiv network compatibility is proven with real reads/writes;
- all publisher identities are role-separated and secured;
- trust policy has peer-reviewed addresses/scopes;
- monitor target config is evidence-backed;
- at least two providers are used for critical observations where feasible;
- security headers/CORS/rate limits are enabled;
- all service health probes work;
- alerts and logs are observable;
- backup/recovery of configuration and secrets is documented;
- load/smoke/E2E tests pass;
- no fake or placeholder production data path exists.

