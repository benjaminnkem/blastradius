# BlastRadius — Fixed Decisions, Phase Gates, and Definition of Done

This document prevents a coding agent from reopening settled architecture/product decisions and defines what “complete” actually means.

## 1. Fixed product decisions

These are already decided unless a current official platform limitation makes one impossible.

| Decision | Canonical choice |
|---|---|
| Product | BlastRadius |
| Core function | DeFi dependency graph + ephemeral health attestation + reverse blast-radius analysis |
| Track framing | Arkiv DeFi; state/evidence off the execution hot path |
| Primary data source of truth | Arkiv for shared public product entities |
| Primary relational database | None in v1 |
| Redis | Transient coordination/cache only |
| Frontend | Next.js + TypeScript |
| Backend/API | NestJS + TypeScript |
| Workers | NestJS + BullMQ |
| Web3/RPC | viem |
| Arkiv | `@arkiv-network/sdk`, current supported network config |
| Validation | Zod |
| Graph rendering | React Flow or best current compatible equivalent consistent with spec |
| Testing | Vitest + Playwright + real integration gates |
| Public reads | Frictionless/no account required by default |
| Writes | Wallet/publisher identities; no arbitrary public signing API |
| v1 automated DeFi execution | **No** |
| Health assertion lifecycle | Short-lived, new entity per observation/publication; never extend |
| Quorum identity | Immutable Arkiv creator, deduped |
| Dependency history | Versioned append/correct/remove semantics |
| UX | Cyber-industrial terminal-inspired but simple, accessible, data-first |
| Fake/mock production data | **Forbidden** |
| AI/LLM runtime dependency | None required for core product |

## 2. Product non-goals for v1

Do not add without a demonstrated requirement:

- trading/execution bot;
- protocol pausing transactions;
- liquidation bot;
- wallet custody;
- token/reward system;
- DAO governance;
- generalized social reputation;
- AI-generated risk claims;
- chain indexer for every DeFi event;
- TVL analytics platform;
- portfolio tracker;
- generic protocol status dashboard;
- Mongo/Postgres just to simplify querying;
- arbitrary user-generated graph publishing through a BlastRadius signing key.

## 3. Minimum production data model

Release requires real implementation for:

- `DependencyEdge`
- `HealthAssertion`
- `MonitorMethod`
- `ProtocolResponse`
- trust-policy configuration
- normalized Arkiv metadata with immutable creator

No entity may be represented only by frontend JSON fixtures.

## 4. Minimum monitor scope

Core v1 must implement at least:

1. Sequencer monitor for a clearly supported chain architecture.
2. Oracle monitor for at least one real feed/interface.
3. RPC monitor with independent provider comparison.

Bridge/keeper/DA monitors are expansion, not required to call v1 coherent.

If an upstream ecosystem interface cannot be verified, do fewer target types correctly rather than fake breadth.

## 5. UX release surfaces

Required:

- landing page;
- global dependency/incident dashboard;
- dependency detail;
- blast-radius investigation graph/list;
- protocol exposure view;
- proof/provenance view/drawer;
- methodology/observer details;
- clear unavailable/empty/truncated/disagreement states;
- responsive mobile behavior.

A wallet/account flow is not required for public investigation.

## 6. Phase gates

### Gate 0 — Architecture/context

Pass when repository architecture, current docs, network status, and design constraints are understood and documented.

### Gate 1 — Domain contracts

Pass when schemas/config are strict, tested, and compile independently.

### Gate 2 — Real Arkiv compatibility

Pass only after actual supported Arkiv read/write/query/expiry behavior succeeds. If no access exists: **BLOCKED**.

### Gate 3 — Trust/graph correctness

Pass when adversarial and cyclic/multi-path tests succeed with deterministic bounded behavior.

### Gate 4 — Worker platform

Pass when real Redis/BullMQ reliability/idempotency tests succeed.

### Gate 5 — Sequencer monitoring

Pass when real observations produce real normalized assertions through the Arkiv integration.

### Gate 6 — Oracle/RPC monitoring

Pass when real adapters handle disagreement/staleness/failures truthfully.

### Gate 7 — Verified graph publishing

Pass when CLI validates evidence/config and real edges/methods can be published safely/versioned.

### Gate 8 — API

Pass when public endpoints are typed, bounded, observable, rate-limited, and honest under upstream failure.

### Gate 9 — Design/landing

Pass when design system is centralized, responsive/accessibility checks pass, and required real/generated brand assets are present without fake product screenshots.

### Gate 10 — Product UI

Pass when a user can investigate root → paths → operations → claims/provenance with no hidden technical knowledge required.

### Gate 11 — Hardening

Pass when security, load, reliability, failure tests and operational metrics meet documented thresholds.

### Gate 12 — E2E/deployment

Pass when a clean environment can be deployed and the real end-to-end flow is reproducible.

### Gate 13 — Final audit

Pass only when repository-wide shortcut/secret/mock audit is clean and final handoff is complete.

## 7. Global functional Definition of Done

```text
[ ] real Arkiv client/reader/writer implemented
[ ] real Arkiv environment gate passed or product explicitly marked blocked/not-ready
[ ] no retired Arkiv network hardcoding
[ ] all shared entities namespaced by project
[ ] creator provenance normalized and displayed
[ ] owner never used as creator substitute
[ ] HealthAssertion cannot be extended
[ ] stale assertions naturally stop contributing after expiry
[ ] one creator cannot inflate quorum
[ ] insufficient coverage is not healthy
[ ] conflicting claims are visible
[ ] dependency edges are versioned/correctable without rewriting history
[ ] reverse graph traversal is cycle-safe and bounded
[ ] multiple paths handled without blind score summation
[ ] graph completeness/truncation visible
[ ] protocol responses are provenance-bearing
[ ] Redis is reconstructable/transient only
[ ] monitors use real upstream reads
[ ] no production hard-coded incident/metric data
[ ] no automated DeFi execution
```

## 8. Global API Definition of Done

```text
[ ] `/api/v1` versioning
[ ] OpenAPI generated and validated
[ ] typed consistent error envelope
[ ] request validation
[ ] rate limiting
[ ] request size bounds
[ ] CORS explicit
[ ] timeouts/deadlines
[ ] Arkiv pagination bounds
[ ] graph bounds
[ ] request/correlation IDs
[ ] liveness/readiness
[ ] structured redacted logs
[ ] metrics/traces
[ ] no secrets in responses
```

## 9. Global UI/UX Definition of Done

```text
[ ] supplied design.md respected
[ ] design tokens centralized
[ ] monospace typography intentional/readable
[ ] no rounded generic SaaS look
[ ] shell metaphors do not require shell knowledge
[ ] landing proposition understood in ~10 seconds
[ ] loading != zero/healthy
[ ] unknown/unavailable states explicit
[ ] red/green never sole signal
[ ] creator, freshness, expiry, disagreement visible
[ ] keyboard navigation
[ ] focus states
[ ] WCAG-minded contrast
[ ] reduced motion
[ ] responsive 360px+ layouts
[ ] large graph has accessible list/details alternative
[ ] generated landing assets optimized and truthful
```

## 10. Reliability/operations Definition of Done

```text
[ ] bounded retry/backoff/jitter
[ ] no blind retry after unknown write result
[ ] deterministic job/observation identifiers where applicable
[ ] worker graceful shutdown
[ ] distributed duplicate-sensitive publication guard
[ ] provider concurrency limits
[ ] Redis outage behavior tested
[ ] Arkiv outage behavior tested
[ ] RPC disagreement behavior tested
[ ] queue depth/latency metrics
[ ] publication freshness metrics
[ ] key rotation documented
[ ] rollback documented
[ ] current environment variables fully documented
```

## 11. Security Definition of Done

```text
[ ] publisher role keys separated
[ ] production secrets outside repo
[ ] secret scan passes
[ ] dependency scan reviewed
[ ] CSP/security headers
[ ] SSRF strategy for any URL fetching
[ ] XSS-safe rendering of Arkiv payloads
[ ] trust policy fail-closed
[ ] untrusted records excluded from trusted consensus
[ ] graph/query DoS bounds
[ ] no arbitrary public sign-and-publish endpoint
[ ] private keys absent from browser bundles/logs/errors
```

## 12. Testing Definition of Done

```text
[ ] format check
[ ] lint
[ ] typecheck
[ ] unit tests
[ ] property/invariant tests where appropriate
[ ] Redis integration tests
[ ] Arkiv real integration tests
[ ] real RPC/oracle adapter integration checks
[ ] API contract tests
[ ] Playwright E2E
[ ] accessibility checks
[ ] security smoke/scan
[ ] load smoke
[ ] container/deployment smoke
[ ] full real incident/expiry flow documented and run to the extent safely possible
```

## 13. Data-quality Definition of Done

Each onboarded dependency edge must have:

- stable semantic ID;
- correct dependency/dependent types;
- chain/protocol scope;
- criticality rationale;
- evidence reference(s);
- publisher creator accepted by trust policy;
- version;
- current active/removed state;
- expiry/renewal policy.

Each monitor target must have:

- explicit method version;
- source endpoints/contracts;
- chain ID;
- thresholds/heartbeat assumptions with evidence;
- minimum source count/coverage;
- timeout;
- observation cadence;
- safe behavior when data is insufficient.

## 14. User acceptance scenario

A new user with no Arkiv or DeFi infrastructure expertise should be able to open BlastRadius and answer:

1. What is failing/degraded?
2. Who says so and how many independent trusted observers agree?
3. When was it observed and when does that evidence expire?
4. Which protocols/operations are downstream?
5. Why does the system think they are connected?
6. How severe is the exposure and through which path(s)?
7. Has the protocol published a response?
8. Can I inspect the underlying Arkiv proof/entity?

If the user must understand Arkiv query syntax or shell commands to answer these, UX is not done.

## 15. Final repository audit terms

Search all tracked files for:

```text
TODO
FIXME
mock
fake
placeholder
sample
hardcoded
Braga
retired Arkiv URLs
skip/only in tests
unsafe any
private keys/tokens
hard-coded live incident data
```

Every result must be reviewed. Test-only fixtures and documentation examples can remain when clearly scoped. Production shortcuts cannot.

## 16. Readiness labels

The final handoff must use exactly one:

### `READY`

All critical release gates passed on real required infrastructure.

### `READY WITH NON-BLOCKING LIMITATIONS`

Core release gates passed; listed limitations do not invalidate truthfulness/security/critical functionality.

### `NOT READY`

Any critical gate is blocked or failed, including lack of real Arkiv compatibility proof, fake data dependency, unhandled security issue, or inability to reproduce the core flow.

Compilation alone can never produce `READY`.

