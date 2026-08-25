# BlastRadius Engineering Handoff Bundle

This bundle is the canonical product and engineering handoff for **BlastRadius**, an Arkiv-native DeFi dependency graph and ephemeral health-attestation layer.

BlastRadius answers one operational question:

> **A dependency is failing right now. Which DeFi protocols and user operations are actually exposed, how badly, who observed the failure, and what are affected protocols doing about it?**

The project is designed as a real production product. The implementation must not depend on fake incidents, mocked Arkiv storage, hard-coded dashboard metrics, fake protocol declarations, or canned API responses. Unit tests may use deterministic fixtures, but integration and end-to-end paths must exercise real infrastructure under test.

## Read this bundle in order

1. `AGENTS.md` — binding implementation rules for Codex/other coding agents.
2. `01_PRD.md` — complete product requirements and product behavior.
3. `02_TECHNICAL_SPEC.md` — implementation architecture, runtime behavior, APIs, performance, and operations.
4. `03_ARCHITECTURE_AND_DATA_MODEL.md` — Arkiv entities, graph model, trust, queries, traversal, and scoring.
5. `04_UI_UX_DESIGN_SPEC.md` — production UI/UX specification derived from the provided `design.md`.
6. `05_CODEX_BUILD_PLAN_AND_PROMPTS.md` — exact build order and copy-paste prompts for Codex.
7. `06_ENV_SETUP_OPERATIONS.md` — environment variables, local setup, secrets, deployment, and runbooks.
8. `07_TESTING_QA_EDGE_CASES.md` — test strategy and extensive edge-case matrix.
9. `08_SECURITY_THREAT_MODEL.md` — security and trust model.
10. `09_ARKIV_MCP_SKILLS_AND_REFERENCES.md` — Arkiv MCP/skills plus optional agent tooling.
11. `10_LANDING_ASSET_GENERATION.md` — image-generation specifications for the landing page.
12. `11_DECISIONS_GATES_AND_DEFINITION_OF_DONE.md` — fixed decisions, implementation gates, and release criteria.
13. `12_DESIGN_SOURCE_NOTE.md` — source design brief and precedence rules.
14. `13_CURRENT_REFERENCES.md` — dated external-source index and re-verification policy.
15. `design.md` — the original design brief supplied by the product owner.
16. `14_BUNDLE_MANIFEST.md` — file-integrity manifest for this handoff.

## Product in one sentence

BlastRadius models DeFi infrastructure as a wallet-authored dependency graph and overlays it with short-lived, independently authored health assertions. When an oracle, sequencer, RPC endpoint, bridge, or automation dependency degrades, BlastRadius recursively resolves which protocols and user operations are exposed while keeping execution outside the DeFi hot path.

## Non-negotiable architecture principles

- **Arkiv is authoritative shared public state** for dependency declarations, health assertions, monitor methodologies, and protocol responses.
- **Redis is not authoritative.** It may be used for BullMQ, locks, rate limiting, and short-lived computed caches only.
- **Monitoring and graph computation are off-chain application work.** Arkiv stores compact, queryable, attributed facts/claims; it does not perform graph joins or execute protocol actions.
- **A claim is not truth.** Arkiv proves who created an entity; BlastRadius separately evaluates publisher trust and consensus.
- **Health assertions expire.** A monitor that disappears naturally loses influence when its last short-lived assertion expires.
- **No automated DeFi execution in v1.** BlastRadius informs operators, wallets, protocols, and users. It does not pause protocols or move funds.
- **No fake fallback mode.** If a real Arkiv environment or real monitored dependency is unavailable, the system must report that dependency as unavailable/unknown rather than fabricate healthy data.

## Current Arkiv network caveat — August 2026

At the time this handoff was prepared, Arkiv's prior Braga public testnet had been retired and the official documentation indicated that there was no current public testnet endpoint while the next public testnet was expected in September 2026. A limited devnet was available by request.

Therefore:

- never hard-code retired Braga network values;
- use environment-driven Arkiv network configuration;
- verify the latest Arkiv docs before implementation/deployment;
- use a real authorized Arkiv devnet or an official supported local Arkiv node/testcontainer for integration testing;
- if neither is available, fail the integration gate clearly instead of silently substituting a mock database.

See `09_ARKIV_MCP_SKILLS_AND_REFERENCES.md` for source links and current verification steps.

## Recommended implementation stack

- Monorepo: pnpm + Turborepo
- Web: Next.js App Router + TypeScript + Tailwind CSS + shadcn/ui + TanStack Query + React Flow
- API: NestJS + TypeScript + OpenAPI
- Workers: NestJS + BullMQ + Redis
- Web3/RPC: viem
- Arkiv: `@arkiv-network/sdk`
- Validation/contracts: Zod
- Logging: Pino
- Metrics/traces: OpenTelemetry + Prometheus-compatible metrics
- Tests: Vitest + Playwright Test
- Deployment: containerized services; hosting-provider-neutral

## What “production-grade” means for this project

Production-grade does not mean unnecessary complexity. It means:

- typed contracts and runtime validation at boundaries;
- explicit timeouts and bounded retries on network I/O;
- idempotent jobs and writes;
- distributed locks where duplicate work matters;
- graceful shutdown and health probes;
- structured logs, metrics, trace/context IDs;
- pagination and bounded graph traversals;
- fail-closed trust and publisher rules;
- visible data provenance;
- no hidden stale-data fallback;
- accessibility and responsive UX;
- CI checks and repeatable deployment;
- documented recovery and operational behavior.

## How to use with Codex

Copy the repository bundle into the project root before implementation. Start with **Phase 0** in `05_CODEX_BUILD_PLAN_AND_PROMPTS.md`. Do not send all prompts at once. After Codex finishes and reports tests for one phase, send the next prompt as a follow-up in the same coding session.

`AGENTS.md` is deliberately strict: it tells Codex what it may assume, when it must stop and ask for a real credential/decision, and which shortcuts are prohibited.

---

**Canonical project namespace:** `blastradius-v1`
