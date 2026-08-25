# BlastRadius — Testing, QA, Reliability, and Edge-Case Matrix

BlastRadius is a risk-observation product. A wrong green state is more dangerous than an explicit `UNKNOWN`. Tests therefore prioritize truthfulness, provenance, expiry, bounded computation, and failure semantics over visual happy paths.

## 1. Test pyramid

Use several layers; do not rely on one giant E2E suite.

### Unit tests

Use Vitest for pure schemas, trust resolution, scoring, graph traversal, parsing, normalization, and UI utilities.

### Property/invariant tests

Where practical, generate randomized graphs/assertion sets to prove invariants:

- traversal terminates on cycles;
- results are deterministic for the same normalized input;
- scores stay within defined integer bounds;
- one creator cannot count twice in quorum;
- removed higher-version edge cannot reappear because an older active edge exists;
- graph truncation is explicit rather than silent.

### Integration tests

Exercise:

- real Redis container;
- real supported Arkiv environment;
- controlled local EVM RPC test node only where it accurately tests adapter mechanics;
- real public/devnet RPCs for monitor contract compatibility tests when safe and rate-limited.

Mocking HTTP at unit level is allowed for parser/error-path tests, but **the release gate requires real integration** for every external adapter used in production.

### Contract tests

API OpenAPI schema, shared Zod DTO contracts, configuration files, and Arkiv normalized entity representations must be tested for backwards compatibility where applicable.

### End-to-end tests

Use Playwright against the deployed/local full stack and real test infrastructure. No seeded fake “live incident” is allowed to prove production functionality. A deterministic test network may be manipulated only if it is itself a real execution environment.

### Load/failure tests

Run bounded load smoke tests for API and graph queries. Test upstream latency/failure, worker restarts, queue backlog, Redis interruption, and Arkiv unavailability.

## 2. Mandatory schema tests

For every entity/config schema test:

- missing required fields;
- unknown enum;
- malformed semantic ID;
- whitespace/case normalization policy;
- wrong `project`;
- wrong `kind`;
- malformed EVM address;
- severity below 0 / above 100;
- basis points below 0 / above 10000;
- non-integer Arkiv numeric attribute;
- zero/negative version;
- Unix timestamps far in past/future outside deliberate tolerance;
- empty evidence when evidence is required;
- oversized evidence arrays;
- oversized/unsafe URL strings;
- unexpected attributes according to forward-compat policy;
- malformed payload JSON;
- unknown dependency type/state/action.

## 3. Arkiv adapter release tests

The release gate must prove on the current supported environment:

- client creation from environment config;
- namespaced create;
- query by `project` + `kind` + semantic attributes;
- immutable creator metadata extraction;
- current owner extraction without confusing it with creator;
- numeric comparison filters;
- cursor pagination;
- cursor-loop safety;
- page and deadline bounds;
- eligible entity extension;
- hard refusal to extend `HealthAssertion`;
- short expiry behavior;
- entity disappearance from live query after expiry according to Arkiv semantics;
- historical query behavior if supported and enabled;
- malformed/unavailable network error mapping;
- read timeout;
- write rejection;
- unknown write result + reconciliation path;
- no duplicate write after reconciliation finds the original deterministic observation.

If the current Arkiv network does not exist or devnet access is not available, these tests are marked **BLOCKED**, never `PASS`.

## 4. Trust/quorum test matrix

| Case | Expected behavior |
|---|---|
| Trusted creators A/B/C = degraded/degraded/healthy | 2/3 degraded; disagreement visible |
| A writes 100 degraded records | counts as one current observer |
| A older healthy + newer degraded | newer valid record wins |
| untrusted wallet writes degraded | stored provenance may be inspectable but excluded from trusted consensus |
| disabled publisher writes | excluded |
| publisher trusted for wrong scope | excluded for this dependency |
| assertions all expired | `INSUFFICIENT/UNKNOWN`, never healthy |
| no assertions | unknown/no-current-observation |
| one of minimum three available | insufficient coverage |
| tie across states | explicit disagreement/ambiguous policy result |
| malformed claim | excluded with diagnostics, not coerced |
| duplicate entity record/key | deterministic newest/dedup rule |
| creator key rotated | new key accepted only after policy update; old history preserved |

## 5. Dependency-edge version tests

Test all combinations:

- v1 active only;
- v1 active + v2 active -> v2 current;
- v1 active + v2 removed -> no current active edge;
- v1 removed + v2 active -> v2 active;
- same version duplicated by same creator;
- same semantic `edge_id` published by different creators;
- untrusted creator higher version must not override trusted current edge;
- creator scope mismatch;
- evidence missing/invalid;
- dependent == dependency self-loop;
- chain mismatch;
- invalid fallback ID;
- edge expires without renewal;
- old version remains reconstructable historically where Arkiv supports historical queries.

The product must distinguish **publisher disagreement** from a single canonical edge when multiple accepted publishers intentionally declare competing views.

## 6. Graph traversal tests

Graphs:

1. Single root, no dependents.
2. Linear chain.
3. Wide fan-out.
4. Deep chain at exactly max depth.
5. One step beyond max depth.
6. Diamond graph.
7. Multiple diamonds.
8. Cycle A→B→C→A.
9. Self-loop.
10. Duplicate physical edges.
11. Multiple paths to one operation.
12. Multiple protocol leaves.
13. Root not found.
14. Malformed edge excluded.
15. Graph exceeds node limit.
16. Graph exceeds edge limit.
17. Graph exceeds path limit.
18. Deadline reached mid traversal.

Assertions:

- termination;
- no infinite recursion;
- no duplicate node inflation in counts;
- path count correct according to documented semantics;
- top-N explainable paths deterministic;
- truncation/completeness metadata explicit;
- blast score uses integer/bps arithmetic and cannot exceed bounds;
- multiple paths are not blindly summed.

## 7. Monitor common edge cases

Every monitor must test:

- success within timeout;
- one provider timeout;
- all providers timeout;
- one malformed JSON-RPC response;
- provider HTTP 429;
- provider 500;
- provider returns stale head;
- providers disagree;
- clock skew on worker host;
- observation takes longer than interval;
- duplicate scheduled job;
- worker crashes after observation but before publish;
- worker crashes after broadcast but before confirmation;
- Arkiv write result unknown;
- Arkiv rejects write;
- publish retry after reconciliation;
- monitor disabled while job queued;
- monitor config changed between retries;
- invalid target config;
- dependency not currently supported;
- upstream authentication revoked;
- quota exhausted.

## 8. Sequencer monitor edge cases

For OP-Stack-like monitoring where methods are supported:

- unsafe head advances, safe/finalized advance normally;
- unsafe advances but safe stalls;
- all heads stall because RPC provider is stale;
- one provider reports a different canonical block hash;
- chain reorg within expected tolerance;
- finalized head regression/malformed response;
- safe > unsafe impossible state;
- lag threshold boundary exactly at warning/critical cutoffs;
- recovery from degraded to healthy;
- transient single-sample spike;
- chain-specific cadence differs from default.

Thresholds must be methodology configuration, not hidden constants.

## 9. Oracle monitor edge cases

For price-feed style monitors:

- current answer and round update normal;
- `updatedAt=0`;
- stale beyond configured heartbeat;
- negative/zero answer where invalid for feed;
- decimals mismatch;
- latest round call reverts;
- round ID not progressing;
- answered-in-round inconsistency if interface exposes it;
- secondary source disagreement beyond threshold;
- secondary source unavailable;
- feed contract upgraded/changed;
- chain RPC stale;
- heartbeat configuration missing;
- feed intentionally updates less often during low volatility.

Never label price deviation alone as oracle failure without the configured methodology/evidence context.

## 10. RPC monitor edge cases

- latency below/above thresholds;
- intermittent errors;
- provider returns valid but lagging block number;
- provider returns same height but different block hash;
- method unsupported;
- rate limit;
- DNS/TLS failure;
- chain ID mismatch;
- endpoint accidentally points to a different network;
- provider serves cached response;
- WebSocket disconnected while HTTP still works;
- regional outage affects one provider class.

## 11. API tests

Every endpoint tests:

- valid response contract;
- invalid path/query params;
- URL/ID encoding attacks;
- too-large page size;
- graph bounds;
- rate limit;
- Arkiv unavailable;
- Redis unavailable;
- partial/truncated graph;
- unknown dependency;
- untrusted data excluded from trusted aggregate but optionally inspectable;
- CORS allowed/disallowed origin;
- no stack traces/secrets in errors;
- request correlation ID;
- OpenAPI schema consistency;
- cache hit/miss produces semantically identical result;
- cache never converts stale data to current.

## 12. UI/UX tests

Playwright should cover desktop and mobile widths.

### Landing

- hero comprehensible without animation;
- generated visual has useful alt strategy or is decorative with empty alt;
- no fake live counts;
- CTA reaches dashboard/product;
- reduced motion disables typing/glitch/blink where necessary;
- navigation keyboard accessible.

### Dashboard

- loading skeleton/terminal state does not display zeros as facts;
- Arkiv unavailable is explicit;
- empty verified-data state is explicit;
- health state labels include text/icons, not color alone;
- filter/search keyboard accessible;
- long IDs/addresses wrap/truncate with accessible copy action.

### Incident/graph

- graph usable with mouse and keyboard-supported alternative/list;
- selected node details readable;
- cycles/large graphs do not freeze browser;
- truncated graph warning visible;
- conflicting claims visible;
- proof drawer shows immutable creator and expiry;
- protocol response absence reads `NO RESPONSE FOUND`, not “safe”.

### Accessibility

- automated axe checks for major pages;
- visible focus;
- landmark structure;
- headings ordered;
- contrast;
- zoom 200%;
- prefers-reduced-motion;
- no flashing that violates accessibility guidance.

## 13. Security tests

At minimum:

- secret scanning;
- dependency vulnerability scan;
- CSP/security-header test;
- CORS test;
- rate-limit bypass attempts;
- SSRF protections on any server-side URL ingestion;
- malicious evidence URL handling;
- XSS via payload/attribute strings;
- log injection/control characters;
- oversized payload rejection;
- YAML parser safety;
- private key never serialized to logs/errors/client bundles;
- untrusted Arkiv records cannot become trusted consensus by UI/API bug;
- one publisher cannot forge another creator.

## 14. Performance targets and tests

Exact SLOs should be measured and tuned, but initial engineering targets:

- bounded API p95 for cached blast-radius query under expected graph size;
- bounded uncached traversal under documented node/edge limits;
- no O(N²) accidental behavior for routine adjacency construction;
- monitor observation deadline comfortably below assertion TTL;
- queue oldest-job age below one observation interval in normal operation;
- web LCP/CLS within reasonable modern web thresholds on production build.

Load test representative graph sizes:

- small: 100 edges;
- medium: 2,000 edges;
- large release-smoke: near configured graph bound.

Do not invent production capacity numbers until benchmarked. Record measured hardware/config in the final handoff.

## 15. Full real E2E acceptance flow

A release candidate should prove this sequence:

1. Start clean services and real supported Arkiv environment.
2. Publish real `MonitorMethod`.
3. Publish evidence-backed dependency edges.
4. Verify entities by Arkiv query and immutable creator.
5. Start real monitor against configured real/test infrastructure.
6. Observe healthy assertions and verify they expire if publication stops.
7. Produce a real degraded condition only through a legitimate test environment or use a naturally occurring degradation; never fabricate a production response.
8. Verify at least two independent trusted observers when the test setup supports it.
9. API resolves root → downstream dependencies → operations.
10. UI shows severity, consensus, paths, evidence, and proof metadata.
11. Publish a real test `ProtocolResponse` with designated test protocol wallet.
12. UI reflects response.
13. Stop one monitor and wait for its assertion to expire.
14. Verify trusted observer count changes automatically without cleanup/deletion.
15. Restart worker/API and verify state reconstructs from Arkiv + config rather than hidden durable Redis state.

If step 7 cannot be safely induced on a real controlled environment, the release report must say so and prove all surrounding mechanics without claiming a live outage simulation.

## 16. Regression gates per pull request

Required on every PR:

```text
format-check
lint
typecheck
unit tests
schema/contract tests
build
```

Add integration tests when touched components require Redis/Arkiv/RPC. Full Playwright, security, and load suites may run on protected branches/staging depending CI budget, but must run before release.

## 17. Test anti-patterns forbidden

- snapshotting huge JSON blobs instead of asserting semantics;
- marking flaky tests skipped without root-cause ticket/plan;
- mocking Arkiv and calling it integration;
- hard-coded “degraded” records in production code paths;
- tests that depend on exact current block number/time without tolerance;
- silently retrying tests until they pass;
- asserting only HTTP 200 without validating provenance/state semantics;
- making tests order-dependent.

