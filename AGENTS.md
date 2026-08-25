# AGENTS.md — BlastRadius Coding-Agent Contract

This file is binding guidance for any coding agent working in this repository. Treat it as repository policy, not optional advice.

## 1. Role and engineering standard

Act as a **staff/principal-level engineer** experienced in TypeScript, distributed systems, DeFi infrastructure, blockchain RPC behavior, data provenance, observability, security, and production web applications.

Write code intended to run as a real product. Prefer boring, explicit, maintainable engineering over hackathon shortcuts. Every significant architectural decision must be explainable from product requirements, operational safety, or scaling needs.

Do not implement the whole product in one pass. Follow `05_CODEX_BUILD_PLAN_AND_PROMPTS.md` phase-by-phase.

## 2. Required reading before code changes

Before writing implementation code, read these files in order:

1. `00_README.md`
2. `01_PRD.md`
3. `02_TECHNICAL_SPEC.md`
4. `03_ARCHITECTURE_AND_DATA_MODEL.md`
5. `04_UI_UX_DESIGN_SPEC.md`
6. `06_ENV_SETUP_OPERATIONS.md`
7. `07_TESTING_QA_EDGE_CASES.md`
8. `08_SECURITY_THREAT_MODEL.md`
9. `09_ARKIV_MCP_SKILLS_AND_REFERENCES.md`
10. `10_LANDING_ASSET_GENERATION.md`
11. `11_DECISIONS_GATES_AND_DEFINITION_OF_DONE.md`
12. `12_DESIGN_SOURCE_NOTE.md`
13. `13_CURRENT_REFERENCES.md`
14. `design.md`

Then inspect the current repository, package manager, existing code, lint/test configuration, component conventions, and environment files before proposing changes.

When Arkiv behavior is material, verify the current official Arkiv documentation and SDK rather than relying on memory. Network details are explicitly runtime-configured because Arkiv network availability can change.

## 3. Non-negotiable truthfulness rules

Never ship any of the following as product behavior:

- fake incidents;
- mocked Arkiv storage behind a production code path;
- hard-coded health states or dashboard metrics presented as live;
- fabricated protocol dependency declarations;
- invented oracle feed addresses, heartbeats, contract addresses, chain IDs, or RPC semantics;
- canned API responses standing in for real backend computation;
- placeholder “success” when upstream data is unavailable;
- synthetic wallets presented as trusted protocol identities;
- silent fallback from Arkiv to a local database.

Unit tests may use deterministic fixtures and test doubles when the tested unit needs isolation. Integration tests must exercise real infrastructure under test. End-to-end tests must exercise the running application and real test infrastructure, not intercepted fake API payloads for core BlastRadius behavior.

If a live dependency cannot be observed, display/return `unknown`, `unavailable`, or a typed failure. **Never convert missing data into healthy data.**

## 4. Product invariants

These invariants must remain true throughout implementation:

1. **Claim != truth.** Arkiv creator provenance says who published a claim, not whether the claim is objectively correct.
2. **Quorum is creator-based.** One creator may publish many entities but counts as one active observer after deduplication.
3. **HealthAssertion entities are never extended.** Each observation cycle publishes a fresh short-lived entity when publication policy says to write.
4. **Dependency graph history must remain reconstructable.** Semantic changes publish new edge versions; removals publish a newer `state=removed` version rather than deleting history.
5. **Protocol-authored and curator-authored dependency information remain distinguishable.** Do not collapse them into one unverifiable authority.
6. **Execution is off the hot path.** BlastRadius does not automatically pause, liquidate, rebalance, bridge, or transfer user/protocol funds.
7. **Redis is not a source of truth.** It is permitted for BullMQ, locks, throttling, and reconstructable caches only.
8. **Arkiv numeric query attributes are integers.** Percentages/decimals use scaled integers such as basis points.
9. **Every BlastRadius Arkiv entity and every Arkiv query includes the project namespace** (`project=blastradius-v1` unless intentionally versioned later).
10. **Arkiv queries paginate safely.** Never assume a single page is complete.
11. **Do not rely on deprecated server-side ordering behavior.** Fetch adequate pages and perform deterministic application-side resolution/sorting where required.
12. **Trust is fail-closed.** An unknown creator is not silently treated as trusted.

## 5. Implementation quality rules

Use strict TypeScript. Avoid `any` except at a narrow external boundary where unavoidable, and convert immediately into a validated internal type.

At every external boundary:

- validate with Zod or an equivalent schema;
- use typed domain errors;
- set explicit network timeouts;
- use bounded retries with exponential backoff + jitter only where retrying is safe;
- use circuit-breaker/backpressure behavior where a failing dependency can cause amplification;
- propagate request/job correlation IDs;
- never log secrets/private keys/auth headers;
- expose structured metrics for failures and latency.

For jobs and writes:

- make execution idempotent;
- use deterministic job IDs/observation IDs where possible;
- use distributed locks only around critical duplicate-sensitive sections;
- handle worker crash/restart safely;
- implement graceful shutdown so in-flight work is acknowledged or safely retried.

For configuration:

- validate required environment variables on startup;
- do not provide insecure production defaults;
- separate public frontend configuration from secret server configuration;
- never commit private keys or provider credentials.

For APIs:

- version routes;
- use OpenAPI;
- return typed, consistent error envelopes;
- apply request size limits and rate limiting;
- expose `/health/live` and `/health/ready`.

For UI:

- follow `04_UI_UX_DESIGN_SPEC.md` and the supplied design source;
- preserve semantic HTML, keyboard navigation, reduced-motion behavior, visible focus, and sufficient contrast;
- never sacrifice comprehension for terminal aesthetics;
- do not render invented “live” values during loading/error states.

## 6. Source-of-truth policy

### Arkiv owns shared public product facts

Use Arkiv for:

- `DependencyEdge`
- `HealthAssertion`
- `MonitorMethod`
- `ProtocolResponse`
- provenance-bearing compact public metadata required to understand those records.

### Redis owns only reconstructable/transient state

Use Redis for:

- BullMQ queues;
- distributed locks;
- rate-limit counters;
- short-lived graph/query caches;
- deduplication windows that can be reconstructed;
- transient worker coordination.

Do not add MongoDB/Postgres merely for convenience. If a future feature genuinely requires private durable application state, document the new requirement and ask before introducing a primary database.

## 7. When to ask the user

Do **not** ask questions that can be answered by inspecting the repository or official documentation.

Ask only when continuing would require a real external decision or secret that cannot be inferred safely, such as:

- actual Arkiv devnet/network credentials or endpoint access;
- paid/production RPC provider credentials;
- which wallets are designated monitor/protocol/curator identities;
- an official protocol dependency that cannot be verified from authoritative documentation/contracts;
- a destructive migration or irreversible publishing action;
- hosting/provider selection when deployment implementation depends materially on the provider;
- a genuinely material product decision not covered by these documents.

When blocked, finish every safe subtask first, then ask one focused question describing exactly what is missing and why it blocks the next step. Never invent the missing value.

## 8. Required phase workflow

For every phase:

1. Inspect the relevant existing code and docs.
2. Briefly summarize current state and any contradictions you found.
3. State the bounded implementation for **this phase only**.
4. Make changes without opportunistically building later phases.
5. Add/update tests for the phase.
6. Run formatting, linting, typecheck, unit tests, and relevant integration tests.
7. Report:
   - files changed;
   - architecture/behavior implemented;
   - commands/tests run and results;
   - environment values newly required;
   - assumptions verified against official sources;
   - remaining blockers/risks;
   - exact manual verification steps.

If a required real integration environment is unavailable, clearly mark that phase gate as not passed. Do not replace it with a mock and claim success.

## 9. Final-handoff requirements

At the final phase, produce a complete operator/developer handoff explaining:

- repository architecture and service responsibilities;
- every environment variable and whether it is public/secret/required/optional;
- how to obtain or create every required credential;
- how to run local infrastructure;
- how to run web/API/worker/CLI;
- how to bootstrap verified dependency and methodology entities;
- how monitoring observations become Arkiv health assertions;
- how trust/quorum works;
- how a blast radius is computed;
- how to inspect an Arkiv entity/proof;
- how to run every test suite;
- how to reproduce the complete incident flow using a **real test environment**;
- known limitations and intentionally unsupported behavior;
- scaling controls and capacity assumptions;
- deployment, rollback, alerts, and incident runbooks.

Before declaring the product complete, search the entire repository for at least:

`TODO`, `FIXME`, `mock`, `fake`, `placeholder`, `sample`, `hardcoded`, retired Arkiv network names/endpoints, unhandled promises, unsafe `any`, committed secrets, and disabled tests.

Review every occurrence. Test fixtures are allowed when clearly test-only; production shortcuts are not.
