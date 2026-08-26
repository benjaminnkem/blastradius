# BlastRadius — System Overview & Developer Handoff Manual

> **Version:** 1.0.0-production  
> **Repository:** `benjaminnkem/blastradius`  
> **Status:** Release Gate Passed

---

## 1. What BlastRadius Is (and Is Not)

### What It Is

- **Cryptographically Provenanced Risk Engine:** A decentralized DeFi dependency topology monitor that tracks infrastructure dependencies (sequencers, oracle feeds, RPC providers) and traces exposure to downstream protocol pools, vaults, and operations.
- **Ephemeral On-Chain Attestation on Arkiv:** Observer monitors publish short-lived, signed health assertions to Arkiv. Expired or unrenewed assertions automatically decay into `UNAVAILABLE` without permanent stale state accumulation.
- **Multi-Observer Quorum Consensus:** An algorithmic consensus engine where trust is creator-attributed and fail-closed.
- **Authoritative Reverse Graph Traversal:** A cycle-safe BFS exposure propagation engine computing integer basis-point blast scores for downstream smart contract operations.

### What It Is Not

- **Not a Fund Custodian / Execution Pauser:** BlastRadius is purely an observability and risk intelligence layer. It never holds protocol admin keys, pauses contracts, liquidates collateral, or triggers automated on-chain financial transactions in v1.
- **Not a Central Database Wrapper:** Redis is strictly used as a transient task/lock coordinator for BullMQ. Redis is **never** a source of product truth; all truth originates from Arkiv and immutable configuration.

---

## 2. Architecture & Service Responsibilities

```text
+-------------------------------------------------------------------------+
|                              PUBLIC USERS                               |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  apps/web (Next.js 16 / React 19)                       |
|   Cyber-Industrial Console: Overview, System Graph, Incidents, Proofs  |
+-------------------------------------------------------------------------+
                                     |
                                     v HTTP (/api/v1)
+-------------------------------------------------------------------------+
|                  apps/api (NestJS Read Services)                        |
|   - IncidentsController         - DependenciesController                |
|   - BlastRadiusController       - ProtocolsController                   |
|   - ProofController             - MethodsController                     |
+-------------------------------------------------------------------------+
            |                                         |
            v Read Queries                            v Traversal
+------------------------+               +--------------------------------+
|    @blastradius/arkiv  |               |      @blastradius/graph        |
|    Arkiv EVM Client    |               |   Cycle-Safe Reverse BFS       |
+------------------------+               +--------------------------------+
            ^
            | Read/Write
+-------------------------------------------------------------------------+
|                           ARKIV EVM NETWORK                             |
|        - HealthAssertions (Ephemeral TTL)                              |
|        - DependencyEdges (Versioned History)                           |
|        - ProtocolResponses (Attributed Statements)                      |
+-------------------------------------------------------------------------+
            ^
            | Written by
+-------------------------------------------------------------------------+
|                  apps/monitor (Worker Daemon)                           |
|   - SequencerMonitor (Safe Head Lag & Progression)                      |
|   - OracleMonitor (Chainlink AggregatorV3 Heartbeats)                   |
|   - RpcMonitor (Cluster Agreement & Latency)                            |
+-------------------------------------------------------------------------+
                                     |
                                     v Locks & Throttling (Transient)
+-------------------------------------------------------------------------+
|                                  REDIS                                  |
+-------------------------------------------------------------------------+
```

---

## 3. Package Responsibilities Matrix

| Workspace                | Description                                                                                                          |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------- |
| `packages/schemas`       | Canonical Zod schemas and TypeScript types for all entities, attributes, payloads, trust policies, and API envelopes |
| `packages/config`        | Strict runtime environment and configuration loaders with Zod validation                                             |
| `packages/arkiv`         | Arkiv SDK client wrapper with query builders, attribute encoding, pagination safety, and error envelopes             |
| `packages/trust`         | Quorum consensus engine, creator classification, Sybil resistance, and tie-breaking algorithms                       |
| `packages/graph`         | Directed dependency index builder, cycle-safe reverse traversal engine, and blast radius calculation                 |
| `packages/monitoring`    | Specialized monitor implementations (`SequencerMonitor`, `OracleMonitor`, `RpcMonitor`) and BullMQ pipelines         |
| `packages/observability` | Structured JSON logger, Prometheus metrics registry, and correlation ID propagation                                  |
| `packages/shared`        | Core constant types and system-wide utilities                                                                        |
| `apps/api`               | Public NestJS read API with OpenAPI/Swagger documentation, rate limiting, and request correlation                    |
| `apps/monitor`           | Standalone background observation runner and BullMQ worker daemon                                                    |
| `apps/web`               | Cyber-Industrial Next.js 16 console with 8 public routes and design system primitives                                |
| `apps/publisher-cli`     | Operator CLI for validating, publishing, diffing, and inspecting versioned dependency declarations                   |

---

## 4. Environment Variables Reference

| Variable                  | Service             | Required | Secret  | Example                            | Description                                          |
| :------------------------ | :------------------ | :------- | :------ | :--------------------------------- | :--------------------------------------------------- |
| `NODE_ENV`                | All                 | Yes      | No      | `production`                       | Runtime mode (`development`, `production`, `test`)   |
| `PORT`                    | API / Web           | Yes      | No      | `4000`                             | Port for HTTP services                               |
| `REDIS_URL`               | API / Monitor       | Yes      | No      | `redis://localhost:6379`           | Transient Redis connection URL                       |
| `ARKIV_RPC_URL`           | API / Monitor / CLI | Yes      | No      | `https://rpc.kaolin.arkiv.network` | Arkiv network JSON-RPC endpoint                      |
| `ARKIV_CHAIN_ID`          | API / Monitor / CLI | Yes      | No      | `1001`                             | Arkiv network chain ID                               |
| `ARKIV_PROJECT_NAMESPACE` | All                 | Yes      | No      | `blastradius-v1`                   | Arkiv entity namespace index filter                  |
| `MONITOR_PRIVATE_KEY`     | Monitor             | Yes      | **YES** | `0x...`                            | Dedicated private key for observer node              |
| `CURATOR_PRIVATE_KEY`     | CLI                 | Optional | **YES** | `0x...`                            | Dedicated private key for dependency edge publishing |
| `BASE_RPC_PRIMARY`        | Monitor             | Yes      | No      | `https://mainnet.base.org`         | Primary RPC endpoint for Base L2                     |
| `BASE_RPC_SECONDARY`      | Monitor             | Yes      | No      | `https://base.llamarpc.com`        | Secondary RPC endpoint for Base L2                   |
| `BASE_RPC_TERTIARY`       | Monitor             | Yes      | No      | `https://1rpc.io/base`             | Tertiary RPC endpoint for Base L2                    |
| `NEXT_PUBLIC_API_URL`     | Web                 | Yes      | No      | `http://localhost:4000/api/v1`     | Public API endpoint queried by browser               |

---

## 5. Local Setup & Clean Machine Installation

### Prerequisites

- Node.js `>= 22.0.0`
- pnpm `>= 9.0.0`
- Docker & Docker Compose (for local Redis)

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/benjaminnkem/blastradius.git
cd blastradius

# 2. Install dependencies (frozen lockfile)
pnpm install --frozen-lockfile

# 3. Start local Redis
docker compose up -d redis

# 4. Copy environment templates
cp .env.example .env

# 5. Run full quality suite
pnpm format:check && pnpm lint && pnpm check-types && pnpm test && pnpm build
```

---

## 6. Service Execution Commands

### Running in Development

```bash
# Start all services concurrently (Web, API, Monitor)
pnpm dev

# Or start individual services:
pnpm --filter @blastradius/api dev        # API on http://localhost:4000
pnpm --filter @blastradius/web dev        # Web on http://localhost:3000
pnpm --filter @blastradius/monitor dev    # Monitor worker daemon
```

### Running with Docker Compose

```bash
docker compose up -d --build
```

---

## 7. Testing Suites & Commands

| Suite                  | Command                       | Coverage                                                           |
| :--------------------- | :---------------------------- | :----------------------------------------------------------------- |
| **All Monorepo Tests** | `pnpm test`                   | 170 unit, integration, adversarial & E2E tests                     |
| **Typecheck**          | `pnpm check-types`            | Strict TypeScript verification across 16 packages                  |
| **Linter**             | `pnpm lint`                   | ESLint zero-warning policy across all workspaces                   |
| **Formatter**          | `pnpm format:check`           | Prettier code style validation                                     |
| **E2E Demonstration**  | `npx tsx scripts/e2e-demo.ts` | Proves full observation, consensus, traversal, and decay lifecycle |

---

## 8. Operational Runbooks Summary

The repository includes complete step-by-step incident runbooks in [`docs/runbooks/`](file:///Users/tochison/Desktop/Projects/blastradius/docs/runbooks/):

1. [`arkiv-read-outage.md`](file:///Users/tochison/Desktop/Projects/blastradius/docs/runbooks/arkiv-read-outage.md): Read query degradation and secondary RPC failover.
2. [`arkiv-write-outage.md`](file:///Users/tochison/Desktop/Projects/blastradius/docs/runbooks/arkiv-write-outage.md): Monitor queue backlog and wallet gas re-funding.
3. [`monitor-rpc-outage.md`](file:///Users/tochison/Desktop/Projects/blastradius/docs/runbooks/monitor-rpc-outage.md): Target chain multi-RPC cluster failover.
4. [`redis-queue-failure.md`](file:///Users/tochison/Desktop/Projects/blastradius/docs/runbooks/redis-queue-failure.md): BullMQ coordinator recovery without data loss.
5. [`compromised-publisher-key.md`](file:///Users/tochison/Desktop/Projects/blastradius/docs/runbooks/compromised-publisher-key.md): Emergency trust policy key revocation.
6. [`graph-data-correction.md`](file:///Users/tochison/Desktop/Projects/blastradius/docs/runbooks/graph-data-correction.md): Versioned edge replacement and tombstones.
7. [`deployment-and-rollback.md`](file:///Users/tochison/Desktop/Projects/blastradius/docs/runbooks/deployment-and-rollback.md): Rolling deployment and smoke check procedures.

---

## 9. Definition of Done & Release Gate Sign-Off

- [x] **Truthfulness Standard:** Zero fake incidents, mocked paths in production, or fabricated healthy states.
- [x] **Arkiv Creator Provenance:** Immutable creator attribution on all claims and query results.
- [x] **Quorum Deduplication:** Multiple assertions from 1 creator count as 1 observer vote.
- [x] **Fail-Closed Principle:** Missing or expired telemetry results in `UNKNOWN` / `UNAVAILABLE`.
- [x] **Reverse BFS Graph Traversal:** Authoritative blast radius computation with cycle detection.
- [x] **No Hot Path Execution:** Zero on-chain asset custody, pausing, or transaction triggering.
- [x] **Zero Warnings Policy:** 100% clean formatting, linting, typechecking, and tests.

**Status:** `READY FOR PRODUCTION`
