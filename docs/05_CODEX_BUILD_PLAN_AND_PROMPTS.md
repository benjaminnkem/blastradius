# BlastRadius — Ordered Codex Build Plan and Prompts

This file is designed to be used directly with Codex or another strong coding agent.

## How to use it

1. Put this documentation bundle at the repository root.
2. Preserve the supplied `design.md` at the repository root as `design.md` if it is not already there.
3. Start a fresh Codex task/session in the repository.
4. Send **Prompt 0** first.
5. Let Codex finish, inspect its report, and resolve any genuine blocker.
6. Send **Prompt 1** as a follow-up in the same session.
7. Continue in numerical order.
8. **Do not send every prompt at once.** The phases are intentionally gated so architecture mistakes are caught before later work compounds them.

`AGENTS.md` is binding throughout. Each prompt below intentionally repeats only the phase-specific goals.

---

# Phase map

| Phase | Goal | Primary gate |
|---:|---|---|
| 0 | Repository understanding, docs verification, architecture scaffold | No implementation assumptions remain stale |
| 1 | Canonical schemas and validated configuration | Domain/config contracts compile and are tested |
| 2 | Real Arkiv adapter and compatibility verification | Real Arkiv read/write/expiry/query behavior verified |
| 3 | Trust, edge resolution, graph traversal, scoring | Pure domain engine correct under adversarial tests |
| 4 | Redis/BullMQ/observability worker foundation | Reliable/idempotent worker platform |
| 5 | Real sequencer monitor | Real chain observations → real Arkiv assertions |
| 6 | Real oracle + RPC monitors | Real multi-source monitoring behavior |
| 7 | Evidence-backed dependency publishing + CLI | Real verified graph data written safely |
| 8 | Public API | Typed, bounded, observable API |
| 9 | UI design system, landing page, generated assets | Design/UX foundation and truthful landing page |
| 10 | Full product UI | End-to-end public investigation experience |
| 11 | Security, reliability, performance hardening | Threat/load/failure gates passed |
| 12 | E2E, deployment, operational readiness | Clean reproducible staging flow |
| 13 | Final audit and handoff | No mocks/placeholders/critical gaps; complete operator guide |

---

# Prompt 0 — Understand the project, verify current docs, scaffold architecture only

Send this first:

```text
You are the principal engineer responsible for building BlastRadius as a real production product.

Before touching implementation code, read AGENTS.md and every documentation file in the BlastRadius engineering bundle in the exact order specified by 00_README.md. Also read the original design.md. Treat AGENTS.md as binding repository policy.

Your engineering standard should be that of a very experienced staff/principal engineer in TypeScript, distributed systems, DeFi infrastructure, blockchain RPCs, security, observability, and high-quality frontend architecture. This is not a hackathon fake/demo implementation. No production path may use mocked Arkiv, fake incidents, fake dashboard numbers, fabricated protocol dependencies, canned APIs, or silently invented data.

PHASE 0 ONLY. Do not start the feature implementation yet.

Tasks:
1. Inspect the existing repository completely: package manager, apps/packages, tsconfig, linting, tests, styles, components, environment files, Docker/config, CI, and any code already present.
2. Compare the repository with the canonical architecture in 02_TECHNICAL_SPEC.md. Do not delete useful existing code blindly; identify what can be retained/refactored.
3. Verify the latest official Arkiv documentation, current @arkiv-network/sdk API/version, viem compatibility, active network status, querying/pagination/expiry/creator semantics, historical-query API, and any supported local/test integration approach. Do not trust old Braga examples or stale network constants. Record the exact sources and date checked.
4. Connect/use the official Arkiv Ideathon MCP and the official arkiv-best-practices skill if available in this environment, following 09_ARKIV_MCP_SKILLS_AND_REFERENCES.md. Use them to check our data model and implementation assumptions. Do not let MCP output override newer official SDK/docs without reconciling the contradiction.
5. Verify current versions/compatibility of Next.js, NestJS, pnpm/Turborepo, Tailwind/shadcn, React Flow, TanStack Query, Zod, Pino, BullMQ, Redis client, OpenTelemetry, Vitest, Playwright, and viem before pinning them.
6. Create or normalize the monorepo scaffold described in the technical spec, but do not implement Arkiv entities, monitors, graph algorithms, product APIs, or product pages yet.
7. Establish strict TypeScript, formatting, linting, workspace scripts, base testing setup, shared tsconfig, dependency boundaries, and environment-validation skeleton.
8. Add docs/arkiv-compatibility.md with the verified date, SDK version, network availability, and clearly marked items still requiring real-environment verification.
9. Add/update README developer navigation if helpful, but do not duplicate the canonical product docs unnecessarily.
10. Run install, format/lint/typecheck/build/test for the scaffold.

Critical rules:
- If there is currently no public Arkiv network, DO NOT invent an endpoint and DO NOT implement an in-memory Arkiv replacement. Keep network configuration runtime-driven.
- If a real network/local-node path requires credentials/access, record it as a Phase 2 integration gate; it does not block the pure scaffold work in this phase.
- Ask me only if you encounter a true blocking decision that the docs/repo/official sources cannot resolve. Otherwise make the safest production-grade decision and document it.

At the end, report:
- current repo assessment;
- exact architecture/scaffold changes;
- versions selected and why;
- Arkiv docs/network facts verified with source links;
- commands/tests run and outcomes;
- any Phase 2 credentials/access I will need;
- every environment variable introduced so far;
- unresolved risks/contradictions;
- exact next-step readiness for Phase 1.

Stop after Phase 0. Do not implement later phases.
```

### Phase 0 acceptance gate

Proceed only if:

- Codex has read the docs;
- current Arkiv network status was verified rather than assumed;
- repo boundaries exist;
- strict TypeScript/lint/test/build work;
- no feature layer has been prematurely faked.

---

# Prompt 1 — Canonical domain schemas and configuration

```text
Continue from the completed Phase 0. Read AGENTS.md again and inspect the Phase 0 changes before coding.

PHASE 1 ONLY: implement the canonical BlastRadius domain schemas and validated configuration system. Do not implement real Arkiv calls, monitors, graph traversal, public product APIs, or UI pages yet.

Implement packages/schemas and packages/config based on 01_PRD.md, 02_TECHNICAL_SPEC.md, and 03_ARCHITECTURE_AND_DATA_MODEL.md.

Required domain contracts include, at minimum:
- DependencyType
- HealthState
- publisher/source roles
- DependencyEdge attributes + payload
- HealthAssertion attributes + payload
- MonitorMethod attributes + payload
- ProtocolResponse attributes + payload
- Arkiv normalized entity metadata
- TrustPolicy / publisher scope
- HealthObservation
- HealthConsensus result
- graph node/edge/path/result types
- completeness/truncation metadata
- typed API error codes/envelope
- evidence reference types
- monitor target config schemas
- ArkivRuntimeConfig

Requirements:
1. Zod is the runtime source of validation truth; infer TypeScript types from schemas where practical.
2. Enforce integer-only numeric attributes, severity 0..100, bps 0..10000, positive versions, semantic ID constraints, Unix-second timestamp sanity, EVM address validation, and bounded payload/evidence arrays.
3. Define the canonical project namespace in config, not scattered string literals.
4. Add environment schemas for Arkiv, Redis, API, graph limits, frontend public config, and worker behavior. No secret default keys.
5. Add YAML/config-file schemas for trust, monitor targets, and dependency declaration files.
6. Make errors actionable and typed.
7. Add comprehensive unit/property-style boundary tests: min/max values, invalid bps, invalid addresses, unexpected enums, future timestamps, malformed IDs, missing evidence, wrong project, wrong entity kind, and unknown fields according to deliberate strictness policy.
8. Document any intentional schema tolerance for forward compatibility.

Do not create fake sample production declarations merely to populate data. Test fixtures must live under test-only paths and be clearly named fixtures.

Run format, lint, typecheck, unit tests, and build for affected workspaces. Report files changed, important invariants encoded, tests and outcomes, env keys introduced, and readiness for Phase 2.

Stop after Phase 1.
```

---

# Prompt 2 — Real Arkiv adapter and compatibility verification

```text
Continue from Phase 1. Read AGENTS.md and docs/arkiv-compatibility.md, then verify the current official Arkiv SDK docs again before implementation.

PHASE 2 ONLY: implement the real Arkiv integration boundary in packages/arkiv and prove it against a REAL supported Arkiv environment.

Required work:
1. Implement PublicClient/WalletClient construction from validated ArkivRuntimeConfig. Do not hard-code Braga or any retired network endpoint.
2. Implement normalized readers for DependencyEdge, HealthAssertion, MonitorMethod, ProtocolResponse, and entity-by-key.
3. Every query must include the BlastRadius project namespace and use current SDK query primitives.
4. Implement safe cursor pagination with max pages/records, deadline/abort support, cursor-loop detection, and completeness metadata.
5. Implement writers for all four entity kinds using the current official SDK. Keep private keys server/CLI-side only.
6. Implement extendEntity only for entity classes explicitly allowed by our lifecycle policy. Put a hard domain guard that refuses to extend HealthAssertion.
7. Normalize immutable creator/current owner/block/expiry metadata.
8. Implement typed error mapping, request timeouts, retry-safe read behavior, and careful handling for an Arkiv write whose broadcast result becomes unknown.
9. Do not rely on deprecated server-side ordering. Resolve current/newest semantics deterministically in application code using available immutable metadata.
10. Feature-gate historical validAtBlock/atBlock behavior until the real environment test confirms it.
11. If subscriptions are available/currently supported, test them but do not make them mandatory yet.
12. Update docs/arkiv-compatibility.md with exact SDK/network behavior actually verified.

REAL INTEGRATION GATE:
- Use an authorized Arkiv devnet OR an officially supported local Arkiv node/testcontainer path documented by Arkiv.
- If this machine has neither, finish all safe adapter code/tests that do not falsely claim integration, then STOP the real-integration subtask and ask me for the exact access required. DO NOT replace Arkiv with an in-memory database/mock and claim Phase 2 passed.

Integration tests must prove on the real test environment:
- create a namespaced entity;
- query it by project/kind;
- immutable creator metadata is returned;
- numeric filters work;
- pagination works where test setup can create sufficient entities;
- an eligible entity can be extended;
- a HealthAssertion writer path cannot extend;
- expiration behavior can be observed using a deliberately short valid TTL compatible with Arkiv rules;
- current network errors are surfaced honestly;
- historical query behavior is either verified or explicitly documented as not yet passed.

Use isolated test wallet(s) and a test project namespace suffix if needed so tests do not contaminate production data.

Run all checks and provide the exact integration evidence/results. Phase 2 is NOT complete if the real Arkiv integration gate did not run successfully; label it blocked rather than pretending.

Stop after Phase 2.
```

---

# Prompt 3 — Trust engine, edge version resolution, graph traversal, exposure scoring

```text
Continue after the Phase 2 code is in place. PHASE 3 ONLY.

Build the pure domain engine in packages/trust and packages/graph. Keep it independent of NestJS and React.

Implement:
1. TrustPolicy loading/validation/checksum/versioning.
2. Address normalization and fail-closed creator classification by role and scope.
3. HealthAssertion resolution: validate -> trusted filter -> group by immutable creator -> newest valid assertion per creator -> agreement/state distribution -> aggregate state/severity according to documented policy.
4. Explicit insufficient/unknown/unavailable semantics. Never default insufficient coverage to healthy.
5. DependencyEdge current-version resolution, including active/removed versions, malformed duplicate versions, publisher provenance, and scope ownership.
6. Reverse adjacency-index construction from resolved current edges.
7. Cycle-safe reverse BFS/DFS blast-radius traversal with max depth/nodes/edges/paths/deadline.
8. Integer/basis-point exposure propagation.
9. Multiple-path handling: max score as primary, path count, top-N explainable paths, no blind summation.
10. Completeness/truncation propagation.
11. Deterministic graph fingerprint suitable for reconstructable cache keys.

Write exhaustive tests before calling this phase complete:
- one creator posts 100 assertions -> one quorum observer;
- three creators 2 degraded/1 healthy -> majority + disagreement visible;
- tied states;
- insufficient coverage;
- disabled/untrusted creator;
- wrong scope;
- expired/not-current record input;
- edge removal supersedes older active version;
- duplicate same version;
- conflicting publishers;
- simple chain;
- branching graph;
- diamond graph;
- cycle;
- self-loop/malformed edge;
- multiple paths to one operation;
- path/depth/node/edge limit truncation;
- 0/10000 bps boundaries;
- deterministic fingerprint.

No Arkiv network calls inside the core graph/trust algorithms; adapters feed them validated records.

Run all checks and report behavior/tests. Stop after Phase 3.
```

---

# Prompt 4 — Redis, BullMQ, idempotency, worker and observability foundation

```text
Continue from Phase 3. PHASE 4 ONLY: build the production worker/platform foundation required by the monitors, without implementing the actual sequencer/oracle/RPC observation logic yet.

Implement:
1. Redis connection/config with TLS options, startup validation, graceful reconnect policy, readiness integration, and no assumption Redis is authoritative.
2. BullMQ queues/schedulers/workers with stable names/prefix, bounded concurrency, retry/backoff+jitter, cleanup/retention policy, graceful shutdown, and failed-job visibility.
3. Deterministic job IDs and distributed-lock primitives for duplicate-sensitive publication sections.
4. Generic monitor pipeline interfaces: schedule -> observe -> normalize -> decide publication -> publish -> record metrics.
5. Publication policy state needed for cadence/state-change decisions, stored only as reconstructable/transient coordination state.
6. Reconciliation path for unknown Arkiv write result using deterministic observation ID before retry.
7. Pino structured logging with redaction.
8. OpenTelemetry setup and Prometheus-compatible metrics defined in the technical spec. Avoid high-cardinality labels.
9. liveness/readiness for worker service.
10. process signal handling and graceful shutdown.
11. Docker/local Redis setup if not present.

Integration tests must use a real Redis service/container, not an in-memory Redis fake. Test duplicate job IDs, retry behavior, worker restart, lock expiry/safety, Redis interruption, graceful shutdown, and job failure visibility.

Do not implement dependency-specific monitoring yet. Stop after Phase 4 with test/operations report.
```

---

# Prompt 5 — Real sequencer/chain monitor

```text
Continue from Phase 4. PHASE 5 ONLY: implement the first real production monitor for a supported sequencer/chain progression target.

Before coding:
- choose the first configured chain from our verified product scope/config;
- verify that chain's official RPC semantics (including safe/finalized/latest tags if used);
- do not assume OP Stack semantics for arbitrary EVM chains;
- verify current authoritative documentation for the chosen chain.

Implement:
1. SequencerMonitor using real viem/RPC reads through at least two independently configured providers where possible.
2. Explicit per-request timeouts.
3. Measurements appropriate to the chosen chain: head progression, safe/finalized progression where supported, elapsed advancement, lag, block timestamp sanity, provider agreement.
4. Method-specific severity calculation documented in a repository methodology file.
5. Confidence/coverage behavior when one provider fails or providers disagree.
6. Evidence canonicalization/hash without secrets.
7. Publication cadence: frequent observation, less frequent healthy writes, faster degraded writes, immediate material state-change writes.
8. Deterministic observation_id and real signed HealthAssertion publication via packages/arkiv.
9. MonitorMethod publication/verification for the exact method version.
10. Metrics/logs/alerts for observation failures and Arkiv publication lag.

Do not present illustrative thresholds as protocol truth. Document exactly what they mean.

Integration test against REAL RPC endpoints and REAL Arkiv test environment. Prove that a real observation becomes a real Arkiv entity and can be read back with the expected creator/method/expiry.

If the chosen chain does not expose a needed semantic, adapt the method based on official docs rather than faking the field.

Stop after Phase 5 and give me exact config/env requirements and how to inspect one real published assertion.
```

---

# Prompt 6 — Real oracle and RPC monitors

```text
Continue from Phase 5. PHASE 6 ONLY: implement OracleMonitor and RPCMonitor with real data.

ORACLE:
1. Onboard only oracle feeds whose addresses, interface, heartbeat/freshness expectations, and chain deployment can be verified from authoritative sources.
2. Implement real contract reads with viem.
3. Observe update timestamp/staleness, round progression/validity, and configured feed-specific expectations.
4. Optional secondary-source deviation may be added only when the source is real, reliable, and clearly labeled as monitoring context rather than price truth.
5. Never invent heartbeat/deviation thresholds.
6. Publish a versioned MonitorMethod and real HealthAssertions.

RPC:
1. Support multiple configured real providers.
2. Observe eth_blockNumber/eth_getBlockByNumber (or viem equivalents), latency, timeout/error rate, head lag, and block-hash agreement where comparable.
3. One provider failure must not automatically mean chain failure.
4. Explicitly represent insufficient provider coverage and correlated-provider limitations.
5. Publish a versioned MonitorMethod and real HealthAssertions.

For both:
- use bounded I/O, retries only where safe, evidence hashes, deterministic IDs, metrics, and the Phase 4 publication pipeline;
- add comprehensive unit + real integration tests;
- prove real assertions can be read from the Arkiv test environment;
- do not mock upstream dependencies in integration/E2E tests.

Stop after Phase 6 with supported-target matrix, methods, env/config, test results, and known limitations.
```

---

# Prompt 7 — Evidence-backed dependency graph bootstrap and publisher CLI

```text
Continue from Phase 6. PHASE 7 ONLY: build the real dependency-declaration ingestion/publishing workflow and populate only verified graph data.

Implement apps/publisher-cli and config/dependencies.

CLI commands should include, as appropriate:
- validate declaration files;
- diff against currently resolved Arkiv versions;
- publish new DependencyEdge version;
- publish removal version;
- renew/extend an unchanged eligible edge where lifecycle policy allows;
- publish/update MonitorMethod when authorized;
- publish ProtocolResponse when using an authorized protocol wallet;
- inspect entity/proof.

Requirements:
1. All dependency declarations come from reviewed YAML/JSON config validated by packages/schemas.
2. Every trusted edge has evidence from official protocol docs/contracts/repositories/governance or another explicitly accepted source type.
3. Verify every chain ID, contract address, protocol operation, and oracle relationship. Do not guess.
4. If an edge cannot be proven sufficiently, leave it unmodeled and report the gap; ask me only if a product-owner decision is truly needed.
5. SourceKind and creator provenance remain visible.
6. Diff/version logic prevents meaningless duplicate versions.
7. Removal publishes state=removed; never destroys history.
8. CLI prints network, creator, entity key, operation result, and how to verify it.
9. No fake success/dry-run that looks like a write. A validation-only mode must be labeled validation-only.
10. Build an initial verified Release 1 graph based on available authoritative evidence. Do not chase target counts by fabricating relationships.

Use the real Arkiv test environment to publish and query the initial verified edges.

Add tests for schema rejection, unauthorized publisher, duplicate/no-op diff, version increment, removal, evidence requirements, malformed address, wrong scope, Arkiv failure, and unknown write outcome.

Stop after Phase 7 with an evidence/source inventory and the exact real graph entities published.
```

---

# Prompt 8 — Public API

```text
Continue from Phase 7. PHASE 8 ONLY: implement apps/api as the production public read API.

Use NestJS and the existing packages; do not duplicate graph/trust/Arkiv logic in controllers.

Implement:
- GET /api/v1/incidents
- GET /api/v1/dependencies/:dependencyId
- GET /api/v1/blast-radius/:dependencyId
- GET /api/v1/protocols/:protocolId/exposure
- GET /api/v1/proof/:entityKey
- GET /api/v1/methods/:methodId
- GET /health/live
- GET /health/ready

Requirements:
1. DTO/response validation and OpenAPI.
2. Consistent typed error envelope/request ID.
3. Query limits, cursor pagination, input validation, body/URL limits.
4. Rate limiting appropriate to a public API.
5. Short-lived reconstructable Redis caching using graph fingerprint + trust policy version.
6. Never turn Arkiv failure into healthy/zero exposure.
7. Explicit complete/partial/stale metadata.
8. Last-updated timestamps and provenance.
9. Cache bypass/failure behavior per technical spec.
10. Security headers where relevant and no stack/secret leakage.
11. Metrics/tracing/logs.
12. Graceful shutdown.

Integration tests must run against real Redis and real Arkiv test data created through the actual publisher paths. Do not intercept Arkiv with fake repositories for the integration suite.

Add load tests for launch-scale graph and bounded-failure tests for max pages/graph limits.

Stop after Phase 8 with OpenAPI location, curl examples, performance numbers, failure-case verification, and env variables.
```

---

# Prompt 9 — Design system, landing page, and real generated image assets

```text
Continue from Phase 8. Read design.md and 04_UI_UX_DESIGN_SPEC.md again before coding.

PHASE 9 ONLY: establish the web design system and production landing page. Do not build every application route yet.

First inspect the existing frontend patterns/components/styles. Then:
1. Centralize the exact BlastRadius design tokens.
2. Implement global monospace typography, square geometry, subtle scanlines, reduced-motion behavior, responsive grid, accessible focus/inversion states, and restrained glow.
3. Build reusable primitives: TerminalShell, Pane, StatusTag, BracketButton, MetricBar, ProofRow, CommandSearch, FreshnessIndicator, ClaimRow, DependencyPath.
4. Normalize shadcn defaults so rounded corners/shadows/generic SaaS styling do not leak in.
5. Implement the landing page sequence from the UI spec: hero, real live status strip, conceptual image, Observe/Attest/Traverse, example dependency path, Why Arkiv, CTA.
6. Live strip MUST use the Phase 8 API. If API/Arkiv is unavailable, show an explicit data-unavailable state. No invented counters.
7. Generate the landing-page images described in 10_LANDING_ASSET_GENERATION.md using the available image-generation capability. Save optimized source outputs under apps/web/public/images and generate appropriate WebP/AVIF responsive derivatives where the framework pipeline does not handle it automatically.
8. Generated images are conceptual art only: no fake product screenshots, fake metrics, third-party logos, coins, hooded hackers, or Matrix rain.
9. If this coding environment has NO actual image-generation tool, do not substitute random stock images or fake placeholders. Finish the layout with a clearly documented asset slot and ask me to provide the generated files, referencing the exact prompts in 10_LANDING_ASSET_GENERATION.md.
10. Meet WCAG 2.2 AA target and performance budgets.

Use Playwright/browser inspection for responsive and accessibility smoke checks. Do not over-animate.

Run production build, lint/typecheck/tests, Lighthouse/Web Vitals checks where available, and visual/manual QA across desktop/mobile widths.

Stop after Phase 9 and report the component system, generated asset files, accessibility/performance results, and any visual decisions.
```

---

# Prompt 10 — Full application UI

```text
Continue from Phase 9. PHASE 10 ONLY: implement the complete public BlastRadius experience using the real Phase 8 API.

Implement routes:
- /system
- /incidents/[dependency]
- /dependencies/[id]
- /protocols/[id]
- /proof/[entityKey]
- /methods/[methodId]
- /about

Requirements:
1. TanStack Query for server state with deliberate retry/stale/refetch behavior.
2. Search/filter with accessible keyboard navigation and shareable query state where sensible.
3. Incident first screen answers: what is wrong, who reports it/how much agreement, and what is exposed.
4. Claims and ProtocolResponse are visibly separate.
5. React Flow graph uses API-computed authoritative graph/path data. Do not duplicate authoritative blast scoring in the browser.
6. Large graphs start focused/collapsed and expand on demand.
7. Mobile defaults to accessible DependencyPath/path-list views rather than forcing dense canvas interaction.
8. Proof view exposes actual Arkiv entity metadata and current trust classification separately.
9. Method page makes score thresholds/limitations understandable.
10. Handle loading, zero, unknown, unavailable, stale, partial/truncated, untrusted/invalid entity cases distinctly.
11. Never render a green/healthy fallback when requests fail.
12. Long hashes/addresses are safe on mobile and copy controls are accessible.
13. Preserve design system; no one-off visual drift.

Write Playwright tests for critical journeys using the REAL running API/test infrastructure, including:
- open dashboard;
- inspect a real monitored dependency;
- see creator-disagreement state when the test environment can produce it;
- inspect blast path;
- inspect proof;
- unavailable-state test by deliberately making a controlled real dependency unavailable in the test stack, not by hard-coding frontend fake data.

Run accessibility/responsive/performance checks. Stop after Phase 10 with screenshots/test evidence only if generated from the real running application state.
```

---

# Prompt 11 — Security, reliability, observability and load hardening

```text
Continue from Phase 10. PHASE 11 ONLY: adversarially harden the completed product using 07_TESTING_QA_EDGE_CASES.md and 08_SECURITY_THREAT_MODEL.md.

Do not add speculative product features. Focus on production safety.

Tasks:
1. Review every trust boundary and threat in the threat model; implement missing mitigations.
2. Confirm Arkiv payloads are treated as untrusted data and cannot trigger XSS/code execution.
3. Confirm evidence URLs cannot cause SSRF; no arbitrary server fetch from public input.
4. Audit secrets/redaction/CSP/security headers/rate limits/request limits.
5. Audit wallet-key separation and ensure frontend bundles contain no secrets.
6. Test compromised/untrusted creator behavior, spam, duplicate assertions, graph poisoning, malformed entities, clock skew, pagination bombs, cycles, path explosion, queue replay, Redis outage, Arkiv outage, RPC disagreement/timeouts, oracle misconfiguration, and unknown write result.
7. Run load tests at 1k, 10k, and 50k synthetic TEST-ONLY graph edges through the pure/index computation path and realistic launch-scale API tests. Fixtures are allowed only for deterministic load/unit datasets; do not present them as live product data.
8. Tune graph/cache/query limits based on measurements.
9. Add alerts/runbook thresholds for publication lag, active monitor coverage, Arkiv read/write failure, queue age, API error rate, and graph truncation.
10. Run dependency/security/secret scans and fix material findings.
11. Verify graceful degradation and recovery from dependency outages.

Produce a threat-model closure report: mitigated / accepted with reason / blocked. Stop after Phase 11.
```

---

# Prompt 12 — End-to-end production readiness, deployment, runbooks

```text
Continue from Phase 11. PHASE 12 ONLY: make the system reproducibly deployable and prove the complete real flow.

Tasks:
1. Finalize local Docker/Compose infrastructure that is appropriate for components we own (at least Redis); never fake Arkiv inside a production-like stack.
2. Finalize containerfiles/builds for web, API, monitor, publisher CLI as appropriate.
3. Create staging/prod environment templates with no secrets.
4. Add CI stages from the technical spec.
5. Configure health probes, graceful shutdown, resource limits guidance, and rolling-deploy safety.
6. Document secret-manager expectations and publisher-key rotation.
7. Finalize runbooks for Arkiv read outage, Arkiv write outage, monitor/RPC outage, Redis/queue failure, compromised publisher key, graph-data correction, rollback.
8. Build real E2E setup/teardown scripts that provision only test-safe infrastructure/data and clean up where appropriate.
9. Prove the full flow in the real test/staging environment:
   a. real monitor observation;
   b. real signed HealthAssertion write to Arkiv;
   c. API reads creator/claim;
   d. trusted creator quorum resolves;
   e. real verified DependencyEdges resolve;
   f. graph produces downstream operations;
   g. web displays incident/path/proof;
   h. stop one real test monitor publisher;
   i. wait/advance through real Arkiv expiration semantics;
   j. prove its old assertion ceases contributing without cleanup mutation.
10. Verify edge version/removal and a ProtocolResponse flow with authorized test identities.
11. Produce deployment smoke-test and rollback procedure.

Nothing in this proof may be replaced by hardcoded/fake product data. If target Arkiv environment capability prevents a step, mark the exact gate blocked and explain what real access/network feature is required.

Stop after Phase 12 with test evidence, deployment commands, runbook locations, and unresolved blockers.
```

---

# Prompt 13 — Final repository audit and complete handoff

```text
This is the final audit after all prior phases. Do not add new scope unless required to correct a release blocker.

PHASE 13: behave as the principal engineer signing off BlastRadius for production readiness.

1. Re-read AGENTS.md, PRD, technical spec, threat model, test spec, env/operations guide, and definition of done.
2. Audit the entire repository for requirement drift.
3. Search every tracked source/config/doc file for at least:
   TODO
   FIXME
   mock
   fake
   placeholder
   sample
   hardcoded
   Braga / retired Arkiv endpoint references
   disabled/skipped tests
   unhandled promises
   unsafe `any`
   committed secrets/private keys/tokens
   hardcoded live metrics/incidents/protocol relationships
4. Review every occurrence. Test fixtures/documentation examples are fine only when clearly non-production; eliminate production shortcuts.
5. Verify every Arkiv read/write path uses the project namespace and validated schemas.
6. Verify creator-based quorum: multiple claims from one creator cannot inflate observer count.
7. Verify HealthAssertion cannot be extended anywhere.
8. Verify DependencyEdge history/version/removal behavior.
9. Verify Redis is never authoritative.
10. Verify no UI request failure becomes healthy/zero-exposure silently.
11. Verify all monitors use real upstream reads and all onboarded dependency edges have authoritative evidence.
12. Verify API bounds, graph limits, rate limits, security headers, redaction, metrics, graceful shutdown, liveness/readiness.
13. Run the COMPLETE quality suite from a clean install/build: format check, lint, typecheck, unit, real integration, build, E2E, security scan, load smoke, container smoke.
14. Re-run the full real incident/expiry flow from Phase 12 if possible after clean deployment.
15. Use the official Arkiv Ideathon MCP `review_my_idea` against the final data model/product framing as a final Arkiv-fit sanity check; record actionable feedback but do not blindly change production architecture without reconciling it with current docs and requirements.

Then write/update a final HANDOFF.md containing, in enough detail for a new engineer with zero prior context:
- what BlastRadius is and is not;
- architecture diagram and service/package responsibilities;
- exact local prerequisites;
- every environment variable in a table: name, service, required, secret, example format, source/how to obtain it;
- how to get Arkiv network/devnet access and configure current network values;
- how to create/fund/configure monitor/curator/protocol publisher identities safely;
- how to configure RPC/oracle targets;
- how to install/start Redis and all services;
- exact dev commands;
- exact production build commands;
- how to validate/publish dependency edges/methods;
- how a monitor observation becomes a HealthAssertion;
- how trust/quorum works;
- how blast radius/scoring works;
- how to verify an Arkiv proof;
- every test suite and exact commands;
- full real end-to-end test flow;
- deployment steps;
- smoke test;
- rollback;
- alerts/dashboard signals;
- key rotation;
- incident runbooks;
- known limitations and any gates not passed;
- scale assumptions and measured limits.

Also give me, in your final response:
A. a concise explanation of everything you built;
B. all env/secrets I personally need to set and exactly where to obtain them;
C. exact setup commands from a clean machine;
D. exact commands to run each service;
E. exact commands to run all tests;
F. a manual checklist to exercise the complete real flow;
G. any unresolved risk or assumption, with no sugar-coating;
H. whether every global definition-of-done item passed.

If any release gate is not genuinely passed, say NOT READY and identify the blocker. Do not call the system production-ready merely because compilation succeeds.
```

---

# What Codex is allowed to ask during the process

The documentation is intentionally complete enough to minimize interruptions. Codex should ask only for real blockers such as:

- current Arkiv devnet credentials/access;
- production-grade RPC provider credentials;
- the exact wallet identities to designate as monitor/curator/protocol publishers;
- the initial protocol/chain scope if several equally valid choices remain and the choice changes real implementation work;
- a hosting provider when deployment-specific code is required;
- an official dependency relationship that cannot be verified but is materially required by product scope.

It should **not** ask what stack to use, whether to use MongoDB, what the visual design is, whether health claims should expire, whether to dedupe by creator, or other decisions already specified.

---

# Recommended checkpoint discipline

After each phase, do not merely ask “did it work?”. Confirm:

```text
[ ] phase-specific tests passed
[ ] no later phase was prematurely implemented
[ ] no mock/fake production fallback was introduced
[ ] new environment requirements were reported
[ ] docs were updated where runtime facts changed
[ ] current Arkiv assumptions were verified when relevant
[ ] true blocker is explicit if gate could not pass
```

This phased approach is designed to prevent the common agent failure mode where a visually complete application is created before the data model, provenance, monitoring semantics, and failure behavior are actually correct.
