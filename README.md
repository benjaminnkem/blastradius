# BlastRadius

Arkiv-native DeFi dependency graph and ephemeral health-attestation layer.

> A dependency is failing right now. Which protocols and user operations are actually exposed, how badly, who observed the failure, and what are affected protocols doing about it?

This repository is a **pnpm + Turborepo** monorepo. Canonical product and engineering requirements live in [`docs/`](docs/00_README.md). [`AGENTS.md`](AGENTS.md) is binding implementation policy.

**Current implementation phase: 0 (scaffold only).** There is no product API, no monitor publication, and no live dashboard data. Missing upstream data is never shown as healthy.

## Apps

| Package                      | Role                | Phase 0                                 |
| ---------------------------- | ------------------- | --------------------------------------- |
| `@blastradius/web`           | Next.js public UI   | Honest scaffold page                    |
| `@blastradius/api`           | NestJS read API     | `/health/live` and `/health/ready` only |
| `@blastradius/monitor`       | Observation workers | Health process only; no observations    |
| `@blastradius/publisher-cli` | Operator CLI        | `status` command; writes disabled       |

## Packages

| Package                      | Role                              |
| ---------------------------- | --------------------------------- |
| `@blastradius/schemas`       | Domain contracts (Phase 1)        |
| `@blastradius/config`        | Validated environment/config      |
| `@blastradius/arkiv`         | Sole Arkiv SDK boundary (Phase 2) |
| `@blastradius/graph`         | Traversal and scoring (Phase 3)   |
| `@blastradius/trust`         | Publisher trust policy (Phase 3)  |
| `@blastradius/monitoring`    | Monitor domain types (Phase 5–6)  |
| `@blastradius/observability` | Logs/metrics                      |
| `@blastradius/shared`        | Cross-cutting types               |

`@repo/eslint-config` and `@repo/typescript-config` are shared tooling. `@repo/ui` is leftover Turborepo starter code and is **not** used by product apps.

## Develop

```bash
corepack enable
pnpm install
cp .env.example .env
docker compose up -d redis   # optional in Phase 0
pnpm lint
pnpm check-types
pnpm test
pnpm build
pnpm dev
```

Filter a workspace:

```bash
pnpm --filter @blastradius/web dev
pnpm --filter @blastradius/api dev
pnpm --filter @blastradius/monitor dev
pnpm --filter @blastradius/publisher-cli start status
```

## Docs

Read in the order listed in [`docs/00_README.md`](docs/00_README.md). Arkiv network facts verified for this phase: [`docs/arkiv-compatibility.md`](docs/arkiv-compatibility.md).

## Arkiv network

As of 25 August 2026 there is **no public Arkiv network**. Braga was retired on 12 August 2026. Do not hard-code retired endpoints. Phase 2 is blocked until authorized devnet or an official local node is available.
