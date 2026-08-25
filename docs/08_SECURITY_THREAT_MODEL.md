# BlastRadius — Security, Trust, and Threat Model

BlastRadius aggregates public claims about DeFi infrastructure and computes downstream exposure. It does **not** custody funds or execute protocol actions in v1, but a false or misleading risk signal can still cause financial harm. Security therefore includes not only traditional application security but also provenance, data poisoning, stale-state handling, and operational integrity.

## 1. Security objectives

1. Never attribute an Arkiv claim to the wrong creator.
2. Never let one wallet inflate multi-observer consensus.
3. Never show stale/missing observation as healthy.
4. Never let an untrusted publisher silently become trusted data.
5. Preserve contradictory claims rather than erasing evidence.
6. Prevent duplicate/ambiguous writes from causing false consensus.
7. Keep all signing keys and provider credentials server-side and least-privileged.
8. Bound all graph/query/network work against resource-exhaustion attacks.
9. Make every user-visible risk result explainable back to source claims/edges.
10. Keep DeFi execution out of BlastRadius v1.

## 2. Trust boundaries

```text
Untrusted public users
    |
    v
Web -> API -----------------------------+
                                         |
Arkiv public records --> reader -------->+--> trust resolver --> graph engine
                                         |
Monitor RPC/oracle endpoints -> workers -+--> Arkiv writer

Publisher CLI -> validated declarations -> Arkiv writer

Redis = internal transient coordination only
```

Boundary classes:

- **Public web/API inputs**: untrusted.
- **Arkiv records**: cryptographically attributable but content may be malicious/incorrect.
- **RPC/oracle providers**: authenticated where applicable but not inherently truthful.
- **Trust policy**: security-sensitive configuration.
- **Publisher private keys**: high-value secrets.
- **Redis**: operationally trusted but never authoritative product truth.

## 3. Arkiv provenance model

Arkiv gives BlastRadius strong creator provenance. The system must use immutable creator metadata for attribution. Current ownership is not equivalent to original publisher identity and must not be used to infer who authored a claim.

BlastRadius does not say “Arkiv proves this sequencer is down.” It says “creator X published claim Y at time/block Z, valid until expiry, and X is/is not trusted for this scope under policy version P.”

## 4. Threats and mitigations

### T1 — Sybil monitor spam

**Attack:** attacker creates many wallets and publishes degraded assertions.

**Mitigation:** only configured trusted monitor creators count toward trusted consensus; trust is scoped. Raw untrusted claims may be inspectable separately but cannot affect trusted aggregate.

### T2 — One trusted creator spams many assertions

**Attack:** compromised/buggy monitor writes 1,000 records to look like 1,000 observers.

**Mitigation:** group by immutable creator and take only the newest valid assertion per creator/dependency/method policy. Quorum count is unique trusted creators.

### T3 — Stale monitor silently disappears

**Attack/failure:** monitor stops publishing but its old “healthy” state remains indefinitely.

**Mitigation:** HealthAssertions are intentionally short-lived and never extended. Expiry removes their influence automatically.

### T4 — Compromised monitor key

**Attack:** attacker publishes validly signed false claims from trusted creator.

**Mitigation:** independent observers, disagreement display, policy disable/rotation, short assertion TTL, alerting for abnormal publisher behavior, least-privileged dedicated keys.

### T5 — Compromised curator/protocol publisher

**Attack:** malicious dependency edge or false response is published.

**Mitigation:** role/scope trust, evidence validation, versioned corrections/removal, optional multi-publisher views, audit logs, key rotation. Historical bad data remains attributable rather than being rewritten.

### T6 — Fake dependency relationship

**Attack:** attacker claims Protocol A depends on dependency X, inflating blast radius.

**Mitigation:** trusted publisher scope, evidence references, contract/docs verification, curator review, current-version resolution by accepted creators only.

### T7 — Publisher hides a past edge/incident

**Attack:** tries to delete history or rewrite author identity.

**Mitigation:** append/version semantics; publish `removed`/corrected version rather than pretending history never existed. Use Arkiv historical query when current network supports it.

### T8 — Conflicting publisher views

**Risk:** two trusted publishers disagree on edge or health.

**Mitigation:** preserve provenance and expose disagreement. Do not silently choose based solely on write order unless the trust policy explicitly gives canonical authority for that scope.

### T9 — RPC provider compromise/outage

**Attack/failure:** one provider lies, lags, or returns errors.

**Mitigation:** independent providers, block hash/head agreement checks, provider-specific metrics, quorum/coverage policy, explicit `INSUFFICIENT/UNKNOWN` state.

### T10 — Cross-network RPC misconfiguration

**Risk:** endpoint points to wrong chain.

**Mitigation:** validate `eth_chainId` against target config before observations; disable target/readiness if mismatched.

### T11 — Oracle misinterpretation

**Risk:** feed heartbeat/decimals/interface assumption is wrong and monitor cries failure.

**Mitigation:** evidence-backed target configuration, contract interface verification, explicit methodology version, chain/feed-specific thresholds, tests against real contracts.

### T12 — Arkiv network unavailable

**Risk:** product serves stale cache as live truth.

**Mitigation:** explicit source availability and observation timestamps; strict cache safety TTL; no stale-to-healthy fallback; UI/API mark unavailable/partial.

### T13 — Unknown Arkiv write result

**Risk:** network times out after accepting write; blind retry creates duplicates.

**Mitigation:** deterministic observation identifiers where possible, reconciliation query by identity before retry, idempotent publication policy.

### T14 — Redis loss

**Risk:** queue/locks/caches disappear.

**Mitigation:** Redis never contains unique authoritative product facts. After recovery, state is reconstructed from config + Arkiv. Deterministic jobs prevent uncontrolled duplication.

### T15 — Graph resource exhaustion

**Attack:** malicious/huge graph causes CPU/memory blowup.

**Mitigation:** trusted edge filtering, max pages, max records, max depth/nodes/edges/paths, traversal deadline, cycle detection, request rate limits, cache.

### T16 — Arkiv query amplification

**Attack:** user crafts API query causing many Arkiv pages/recursive fetches.

**Mitigation:** fixed server-side endpoint semantics, no arbitrary user-supplied Arkiv predicate passthrough, hard pagination and graph bounds.

### T17 — SSRF through evidence URLs

**Attack:** malicious record points to internal metadata endpoint and backend fetches it.

**Mitigation:** do not server-fetch arbitrary evidence URLs at request time. If an ingestion verifier fetches URLs, use strict HTTPS allow/deny policy, DNS/IP checks, redirect limits, response size/time limits, and block private/link-local ranges.

### T18 — XSS via Arkiv payload

**Attack:** malicious payload contains script/HTML.

**Mitigation:** render as text, never `dangerouslySetInnerHTML` from Arkiv content; encode URLs; CSP; React escaping; schema limits.

### T19 — Secret leakage

**Attack/failure:** private key/API token ends up in logs/browser bundle/error reports.

**Mitigation:** server-only config boundary, log redaction, secret scanning, no `NEXT_PUBLIC` secret names, sanitized errors, CI bundle inspection where practical.

### T20 — Dependency supply-chain compromise

**Risk:** compromised npm package/build image.

**Mitigation:** lockfile, frozen installs in CI, dependency scanning, minimal dependency set, pinned critical versions, image scanning/SBOM if available, review updates.

### T21 — UI dark pattern / false certainty

**Risk:** strong red/green visuals imply certainty not supported by data.

**Mitigation:** state labels, observer count, disagreement indicator, freshness/expiry, completeness metadata, methodology/proof access. Color never stands alone.

### T22 — Automated execution misuse

**Risk:** downstream user treats BlastRadius output as automatic transaction authorization.

**Mitigation:** v1 exposes information only. No private key transaction executor, pauser, liquidation bot, or “auto protect funds” action. API docs state outputs are risk signals/claims, not execution guarantees.

## 5. Authentication and authorization

### Public reads

Core investigation endpoints are public/read-only by default and protected by rate limiting, input bounds, and caching.

### Write operations

There should be no general public HTTP endpoint that accepts an arbitrary record and signs it with BlastRadius publisher keys.

Writes occur through:

- monitor workers using a dedicated monitor key;
- operator publisher CLI using designated curator key;
- protocol integrations using protocol-controlled identity when implemented.

If an administrative web/API surface is added later, it must use strong authentication, explicit RBAC, audit logs, CSRF protection where relevant, and preferably hardware-backed/SSO controls. It is not in v1 by default.

## 6. Key separation

Do not reuse one private key for all roles.

Minimum separation:

- monitor publisher identity;
- curator/dependency publisher identity;
- protocol identity per partner where appropriate.

Production secrets should live in a managed secret system. Developer machines use low-value isolated devnet wallets.

## 7. Trust-policy controls

Trust policy must be version-controlled, schema-validated, and reviewable. Recommended fields:

- creator address;
- role;
- allowed dependency/protocol/chain scopes;
- enabled/disabled;
- activation metadata;
- optional human-readable label;
- policy version/hash.

Fail closed: if creator/scope cannot be proven accepted, do not include it in trusted consensus/current graph.

## 8. Data minimization

Do not put these on Arkiv:

- private keys;
- API tokens;
- raw authenticated RPC URLs;
- private incident conversations;
- sensitive user information;
- full high-volume telemetry;
- user transaction calldata unrelated to public evidence;
- secrets embedded in evidence links.

Arkiv receives compact public statements and evidence references/hashes.

## 9. Logging policy

Structured logs may include:

- service/version;
- target semantic ID;
- public creator address;
- Arkiv entity key;
- request/correlation ID;
- high-level error code;
- duration/retry count.

Redact:

- private keys;
- Authorization headers;
- provider API tokens;
- Redis passwords;
- OTEL/Sentry auth headers;
- full URLs when tokens can occur in query/path.

Avoid logging unbounded payload content.

## 10. HTTP/web security baseline

- strict CSP compatible with Next.js assets;
- HSTS in HTTPS production;
- `X-Content-Type-Options: nosniff`;
- appropriate `Referrer-Policy`;
- frame-ancestor protection;
- explicit CORS;
- request body limits;
- rate limits;
- validation on every external input;
- no verbose production stack traces;
- secure dependency/image hosting.

## 11. Denial-of-service controls

Resource limits exist at every layer:

- HTTP rate limits;
- Arkiv page/max-record limits;
- graph node/edge/depth/path/deadline bounds;
- Redis/BullMQ concurrency;
- RPC provider concurrency/timeouts;
- evidence URL size/time limits if fetching is used;
- frontend rendering virtualization/collapse for large graphs.

## 12. Security release gate

Before release:

```text
[ ] trust policy peer-reviewed
[ ] publisher keys separated
[ ] no secret in git/history/current build artifacts
[ ] public web bundle contains no server credentials
[ ] real Arkiv creator provenance verified
[ ] creator dedup quorum tests pass
[ ] HealthAssertion extension impossible
[ ] stale/missing data cannot become healthy
[ ] graph limits and cycle safety tested
[ ] CORS/CSP/rate limiting/body limits enabled
[ ] dependency/secret scans pass or documented exceptions accepted
[ ] write-unknown reconciliation tested
[ ] Redis loss does not lose authoritative state
[ ] no arbitrary public signing endpoint
[ ] no automated DeFi execution path
[ ] incident/key rotation runbooks validated
```

## 13. Residual risks

Even with all controls:

- a majority of trusted observers can be wrong or compromised;
- authoritative protocol docs can be outdated;
- dependency graphs are inherently incomplete and evolve;
- blockchain/RPC telemetry does not perfectly represent application-level usability;
- Arkiv network availability/capabilities can change pre-mainnet;
- users may over-trust a risk score.

The UI and API must communicate provenance, freshness, coverage, and completeness so these residual risks are visible rather than hidden.

