# ADR 0001 — Phase 0 monorepo scaffold

## Status

Accepted for Phase 0.

## Decision

Use a pnpm/Turborepo TypeScript monorepo with `@blastradius/*` product packages and retained `@repo/*` tooling packages from the starter.

Internal packages export TypeScript source (`exports: { ".": "./src/index.ts" }`). `build`/`check-types` run `tsc --noEmit` except `@blastradius/web`, which uses `next build`. NestJS apps and the CLI run via `tsx`.

## Package boundaries

- `@blastradius/schemas` has no product-package dependencies.
- `@blastradius/config` may use Zod only in Phase 0 (schemas land in Phase 1).
- `@blastradius/arkiv` is the only package allowed to depend on `@arkiv-network/sdk`. It does not import chain constants in Phase 0.
- `@blastradius/graph` and `@blastradius/trust` stay framework-free.
- Apps may depend on packages; packages must not depend on apps.
- `@blastradius/web` must not import `@arkiv-network/sdk` or publisher keys.

ESLint `no-restricted-imports` encodes the above.

## Why source exports

Phase 0 needs a compiling, testable scaffold without a premature dual-package emit matrix. Production container builds (Phase 12) can add `dist` emit if required.

## Redis

`docker compose` provides Redis 7 for later BullMQ work. Redis is not started as a Phase 0 requirement and is never a source of truth.
