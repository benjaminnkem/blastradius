# Product Requirements Document — BlastRadius

**Document status:** Canonical product specification  
**Product:** BlastRadius  
**Project namespace:** `blastradius-v1`  
**Audience:** Product, design, engineering, security, operations, coding agents, reviewers  
**Primary implementation target:** Production-quality web application and monitoring/data infrastructure

---

## 1. Executive summary

BlastRadius is a public DeFi infrastructure risk-intelligence product built around an Arkiv-native dependency graph and short-lived, wallet-attributed health attestations.

The product answers a question that is surprisingly difficult during infrastructure incidents:

> **If a shared dependency is degraded right now, which protocols and user actions are actually exposed to it, through what dependency path, who observed the degradation, how strong is the evidence, and what have affected protocols said or done?**

Today, an incident affecting a sequencer, oracle, RPC provider, bridge, data-availability layer, or automation system is usually fragmented across status pages, Discord/X posts, dashboards, RPC telemetry, contract documentation, and protocol-specific incident messages. A user may know that “the Base sequencer is having trouble” or “a price feed is stale,” yet still not know whether depositing, borrowing, liquidating, withdrawing, or bridging through a particular protocol is exposed.

BlastRadius turns those relationships into an explicit, queryable dependency graph. Independent monitor wallets publish compact, expiring `HealthAssertion` entities. Protocols or verified curators publish versioned `DependencyEdge` entities. Protocols can publish `ProtocolResponse` entities during incidents. `MonitorMethod` entities explain how each monitor derives its observation.

Arkiv is used specifically because the product benefits from:

- public queryability across mutually distrusting actors;
- immutable creator provenance;
- time-scoped entities whose expiry is semantically meaningful;
- tamper-evident, reconstructable public state;
- an Ethereum-aligned shared data layer without putting protocol execution on the hot path.

BlastRadius does **not** automatically execute DeFi actions. It is a risk context and provenance layer.

---

## 2. Product thesis

DeFi risk is not only protocol-local. Protocols inherit operational risk from shared infrastructure and from dependencies that may themselves depend on other infrastructure.

The missing primitive is a **live, attributed dependency graph** where:

1. dependency relationships are explicit and evidence-backed;
2. current health claims are short-lived and expire rather than lingering indefinitely;
3. claims retain immutable publisher provenance;
4. conflicting observations are visible rather than silently collapsed;
5. downstream exposure can be calculated across multiple hops; and
6. historical graph state can be reconstructed for post-incident analysis.

BlastRadius should become the place a risk engineer, wallet, protocol operator, researcher, or sophisticated user checks when the question is not merely “is dependency X down?” but “what does X being down mean for the things I am about to do?”

---

## 3. Problem statement

### 3.1 The operational problem

DeFi protocols compose external infrastructure. A typical user action may depend on several layers:

```text
User action
  -> Protocol market/vault
    -> Oracle adapter
      -> Price feed / update path
    -> Chain execution environment
      -> Sequencer
    -> RPC access path
```

Other flows may include bridges, keepers, relayers, cross-chain messaging, stablecoin issuers, DA layers, or proof systems.

When one underlying dependency becomes unhealthy, the true impact is difficult to answer quickly because the dependency information and incident evidence live in different places and are controlled by different actors.

### 3.2 Existing approaches are insufficient

Common current approaches include:

- protocol status pages that only describe the protocol itself;
- infrastructure status pages with no downstream DeFi graph;
- social posts that are hard to query and easy to miss;
- monitoring dashboards owned by one organization;
- static dependency documents that become stale;
- centralized databases where one operator controls edits/deletion;
- on-chain execution contracts that are too expensive or inappropriate for high-frequency operational evidence.

BlastRadius is not intended to replace all of those sources. It connects and attributes the operational facts necessary to compute downstream exposure.

---

## 4. Goals

### G1 — Explain downstream exposure quickly

For a degraded dependency, show affected protocols, affected operations, dependency paths, exposure severity, and the evidence behind the incident.

### G2 — Make provenance first-class

Every displayed claim must make it possible to determine who created it and whether that creator is trusted under the active BlastRadius policy.

### G3 — Make freshness a data property

Transient health claims must expire at the data layer. A monitor that stops publishing must stop affecting live consensus without a central cleanup job pretending its old observation is current.

### G4 — Preserve disagreement

If trusted monitors disagree, the UI/API must show the disagreement rather than inventing a single unanimous truth.

### G5 — Preserve dependency history

A changed or removed dependency must remain historically reconstructable. Current-state resolution should choose the latest valid version; historical investigation should be possible at a prior Arkiv block once compatibility is verified.

### G6 — Be useful without authentication

Reading the dashboard, searching, inspecting incidents, graph paths, methods, and proof/provenance must not require a user account or wallet.

### G7 — Be production-operable

The system must have bounded queries/traversals, observable workers, idempotent publishing, explicit failures, secure key management, tests, health probes, and deployment/runbook documentation.

---

## 5. Non-goals for Release 1

BlastRadius Release 1 will not:

- execute trades, pauses, withdrawals, bridges, liquidations, rebalances, or emergency transactions;
- claim that an “affected” operation is guaranteed to fail or cause loss;
- provide personalized financial advice;
- infer every protocol dependency automatically from bytecode;
- ingest every blockchain/protocol in existence;
- use TVL estimates as a core blast-radius metric unless a reliable, clearly sourced feed is deliberately added later;
- store raw high-frequency RPC logs on Arkiv;
- introduce a token, DAO, governance system, or incentive economy;
- require AI/LLMs to determine health or exposure;
- use Arkiv as a hot-path execution coordinator;
- use Redis, MongoDB, or Postgres as a hidden replacement for Arkiv’s authoritative public records.

---

## 6. Target users and jobs-to-be-done

### 6.1 Protocol risk/security engineer

**Job:** During an infrastructure incident, determine which protocol functions depend on the failing component and whether the protocol should communicate or mitigate.

Needs:

- authoritative dependency paths;
- current monitor observations;
- severity and confidence inputs;
- protocol response publishing;
- historical evidence after the incident.

### 6.2 Wallet, aggregator, or DeFi application developer

**Job:** Surface operational risk context before routing a user into a potentially exposed action.

Needs:

- stable read API;
- dependency/protocol exposure endpoint;
- machine-readable current consensus and disagreement;
- provenance/proof links;
- predictable rate limits and caching semantics.

### 6.3 Infrastructure operator/monitor publisher

**Job:** Publish evidence-backed observations about sequencers, RPC infrastructure, oracles, and later other shared dependencies.

Needs:

- documented methodology;
- idempotent publisher worker;
- short TTL semantics;
- immutable creator attribution;
- observable publication failures.

### 6.4 Security researcher / incident analyst

**Job:** Reconstruct what dependencies and observations existed when an incident occurred.

Needs:

- versioned edges;
- creator provenance;
- evidence references/hashes;
- historical Arkiv query support once verified against the active SDK/network.

### 6.5 DeFi user

**Job:** Understand whether a specific action is exposed without having to understand the entire infrastructure stack.

Needs:

- simple language;
- visible “what is wrong / who says so / what is affected” summary;
- operation-level paths;
- honest unknown/unavailable states;
- no wallet/login requirement just to read.

---

## 7. Core product concepts

### 7.1 Dependency

A typed node representing infrastructure, a protocol component, or a user-facing operation.

Initial infrastructure types:

- `sequencer`
- `oracle`
- `rpc`

Architecture-ready future types:

- `bridge`
- `keeper`
- `data_availability`
- `cross_chain_messaging`
- `stablecoin_issuer`
- `proof_system`
- `relayer`

Application graph nodes can also include:

- `chain_environment`
- `oracle_adapter`
- `protocol`
- `market`
- `vault`
- `operation`

### 7.2 Dependency edge

A directed relationship:

```text
dependent -> dependency
```

Example:

```text
protocol-a:borrow-eth-usdc -> chainlink:eth-usd
```

Meaning: the borrow operation depends on the Chainlink ETH/USD dependency.

Edges are versioned and evidence-backed.

### 7.3 Health assertion

A short-lived, wallet-authored claim describing what a monitor observed about one dependency at a specific time using a known monitoring method.

A health assertion is **not** objective truth. It is an attributable observation.

### 7.4 Monitor method

A versioned public description of the checks, thresholds, and assumptions behind a health assertion.

### 7.5 Protocol response

A temporary protocol-authored declaration that describes its response to an incident, for example:

- `investigating`
- `frontend_warning`
- `disable_deposits`
- `disable_borrows`
- `fallback_enabled`
- `resolved`

BlastRadius displays the statement and provenance; it does not assume the declared action occurred unless separately verifiable.

### 7.6 Trust policy

BlastRadius maintains a fail-closed mapping of accepted creators and roles/scopes. Arkiv creator provenance proves which wallet authored an entity; the application decides how that wallet should be classified.

---

## 8. Primary user journeys

### Journey A — Investigate a live dependency incident

1. User opens `/system` or lands on a live incident card.
2. BlastRadius shows dependency name/type, current consensus, severity, observation count, disagreement, and freshness.
3. User opens the incident.
4. Above the fold, the user sees:
   - what is wrong;
   - how many trusted observers currently support each state;
   - how recently they observed it;
   - number of affected protocols/operations;
   - critical downstream operations.
5. User explores the dependency graph.
6. User clicks any path to see edge provenance and evidence.
7. User opens any monitor claim to inspect creator, method, created/expiry blocks, evidence hash, and Arkiv proof metadata.
8. User sees any current protocol responses separately from monitor claims.

### Journey B — Check one protocol before acting

1. User searches for a protocol.
2. `/protocols/[id]` shows current dependencies and exposed operations.
3. Each affected operation includes:
   - root degraded dependency;
   - top exposure score;
   - path(s) that lead to the operation;
   - current health consensus;
   - relevant protocol response.
4. Healthy, unknown, degraded, and unavailable states are visually distinct.

### Journey C — Publish/update a dependency declaration

1. Authorized protocol publisher or curator prepares a validated declaration through CLI/config.
2. The tool resolves publisher identity and evidence.
3. It reads existing versions from Arkiv.
4. If the semantic relationship is unchanged, it does not create meaningless new versions; it may extend an eligible existing entity where Arkiv semantics and policy allow.
5. If changed, it publishes a new version.
6. Removal publishes a new version with `state=removed`.
7. CLI outputs the Arkiv entity key and verification details.

### Journey D — Monitor disappears

1. A trusted monitor has active short-lived assertions.
2. The monitor process stops or cannot publish.
3. No central job marks the old claim “dead.”
4. The assertion expires on Arkiv.
5. Live consensus recalculates without that creator.
6. UI shows fewer active observers and, where material, a monitor-coverage warning.

### Journey E — Protocol responds to an incident

1. Authorized protocol wallet publishes a `ProtocolResponse`.
2. BlastRadius validates project/kind/publisher scope.
3. Response appears on incident and protocol pages with author provenance and freshness.
4. If another newer response supersedes it, current view resolves the latest valid response while historical records remain inspectable.

---

## 9. Functional requirements

### FR-001 — Public system dashboard

The product shall expose a public system view that lists currently observed dependencies and incidents without requiring login/wallet connection.

The view shall support filters for dependency type, chain, severity/state, and search by known dependency/protocol identifiers.

### FR-002 — Dependency detail

For each dependency, the product shall show:

- canonical identifier and human-friendly label;
- dependency type and chain where applicable;
- current active trusted observations;
- consensus/disagreement state;
- latest observation timestamps/freshness;
- monitoring method links;
- downstream exposure summary;
- evidence/provenance links.

### FR-003 — Multi-hop dependency graph

The product shall model dependencies as a directed graph with arbitrary nesting and shall compute downstream impact by reverse traversal from a degraded root.

The graph shall be cycle-safe and bounded by configured limits.

### FR-004 — Health monitoring

Release 1 shall implement real monitoring adapters for:

1. sequencer/chain progression;
2. oracle freshness/round progression and, where configured, source agreement;
3. RPC availability/head agreement/latency.

Monitors shall publish compact health assertions according to configured publication cadence and state-change rules.

### FR-005 — Attributed claims

Every health claim shown by BlastRadius shall retain the immutable Arkiv creator and creation metadata available from the SDK/network.

### FR-006 — Expiring health state

`HealthAssertion` entities shall be short-lived and shall not be extended. Each published observation is a new entity. Expired assertions shall no longer contribute to live consensus.

### FR-007 — Creator-based quorum

For one dependency, method scope, and consensus window, multiple active claims from the same creator shall count as one observer. The application shall resolve the newest valid assertion per trusted creator before calculating observer counts.

### FR-008 — Visible disagreement

If trusted creators report conflicting states, the product shall show the distribution and not falsely render unanimity.

### FR-009 — Protocol response

Authorized protocol publishers shall be able to publish time-scoped incident responses. The product shall display them as protocol-authored statements distinct from independently observed monitor evidence.

### FR-010 — Evidence-backed dependencies

Every curated/protocol dependency edge shall support evidence references and/or evidence hashes. The interface shall show source type and publisher provenance.

Unverified dependencies must not silently enter the trusted production graph.

### FR-011 — Proof/provenance view

The product shall expose a dedicated proof view for Arkiv-backed records, including as available:

- entity key;
- kind;
- immutable creator;
- current owner if relevant;
- created block;
- expiration block/time representation;
- last modification metadata where relevant;
- selected indexed attributes;
- methodology/evidence reference;
- explorer link when the active network provides one.

### FR-012 — Public read API

The system shall expose a versioned read API for incidents, dependency state, protocol exposure, graph blast-radius results, monitoring methods, and proof metadata.

### FR-013 — Near-live refresh

The web experience shall update current incident state without full-page reload. Use real Arkiv subscriptions if stable/supported in the active network and SDK; otherwise use honest bounded polling against the API. Polling is not a mock.

### FR-014 — Honest failure states

If Arkiv, Redis, an RPC endpoint, a monitor target, or a query path is unavailable, the product shall surface typed unknown/unavailable/degraded states. It shall not substitute stale or synthetic “healthy” information.

---

## 10. Severity and status semantics

### 10.1 Monitor state

Canonical high-level monitor states:

- `healthy`
- `watch`
- `degraded`
- `critical`
- `unknown`
- `unavailable`

A monitor method may calculate a normalized integer severity from `0..100`.

Default display bands:

| Severity | Display band |
|---:|---|
| 0–19 | Healthy |
| 20–39 | Watch |
| 40–69 | Degraded |
| 70–89 | Severe |
| 90–100 | Critical |

These bands are a UI normalization, not a claim that every dependency shares identical failure thresholds. Raw method-specific evidence and method version must remain inspectable.

### 10.2 Confidence

`confidence_bps` is a scaled integer from `0..10000` indicating the monitor method’s confidence in that observation according to its documented methodology. It is not a universal probability of failure.

### 10.3 Consensus

Consensus output must include:

- number of active trusted creators;
- state distribution by creator;
- selected aggregate state according to documented policy;
- whether the result is unanimous, majority, split, insufficient, or unavailable;
- freshness window.

The UI should prefer language such as:

> `2/3 trusted observers report DEGRADED`

rather than pretending “Arkiv says degraded.”

---

## 11. Exposure semantics

BlastRadius must keep **dependency health severity** separate from **downstream exposure severity**.

A dependency can be severely degraded while a particular downstream operation has a low exposure if it has a fallback or low criticality. Conversely, a high-criticality edge can propagate a large portion of root severity.

A simple explainable Release 1 propagation model is:

```text
downstream_score = upstream_score
                 * edge_criticality_bps / 10000
                 * propagation_bps / 10000
```

For multi-hop paths, apply the calculation sequentially.

If multiple distinct paths reach one operation:

- do not blindly sum scores;
- expose the maximum path score as the primary score;
- expose the number of materially distinct paths;
- retain the top N paths for explanation;
- note that multiple paths can increase concern without pretending their probabilities are independent.

Affected/exposed means **dependency exposure**, not guaranteed user loss or protocol failure.

---

## 12. UX requirements

### 12.1 First-screen comprehension

A user opening an incident should understand within seconds:

1. **What is wrong?**
2. **Who is reporting it and how much do trusted observers agree?**
3. **What protocols/actions are exposed?**

Those answers must appear before deep graph controls or raw proof details.

### 12.2 No authentication barrier for reading

Public browsing/search/proof views require no wallet connection. Wallets/private keys are relevant to publisher tooling, not ordinary users.

### 12.3 Plain language layered over technical detail

Use concise descriptions such as:

> `Base sequencer safe head is lagging beyond the configured method threshold.`

Then expose raw blocks/lags/methodology in secondary panes.

### 12.4 Truthful empty/loading/error states

Never show zero affected protocols when the query failed. Differentiate:

- `0 affected` — successfully computed and none found;
- `unknown` — insufficient data;
- `unavailable` — upstream read failed;
- `loading` — computation is in progress.

### 12.5 Mobile

On small screens, users must not be forced to manipulate a dense graph. Provide a path-first list showing root → intermediate dependencies → protocol operation, with the full graph available as an enhancement.

---

## 13. Landing page requirements

The landing page must communicate the product without fake metrics or fake product screenshots.

Recommended content sequence:

1. **Hero**
   - headline: `KNOW THE BLAST RADIUS BEFORE YOU ACT.`
   - concise supporting copy explaining live DeFi dependency exposure;
   - CTA `[ EXPLORE SYSTEM ]`;
   - secondary CTA `[ HOW IT WORKS ]`.
2. **Live system strip**
   - uses real API state only;
   - if no live data is available, show an explicit system-data-unavailable message rather than invented numbers.
3. **Generated cyber-industrial infrastructure illustration**
   - visualizes dependency propagation conceptually, not as fake telemetry.
4. **Three-step explanation**
   - `01 OBSERVE`
   - `02 ATTEST`
   - `03 TRAVERSE`
5. **Example dependency path explanation**
   - clearly marked as an explanatory diagram/example, not a live incident unless backed by current data.
6. **Why Arkiv**
   - creator provenance;
   - queryable shared state;
   - meaningful expiry;
   - tamper-evident history.
7. **Final CTA**
   - `[ OPEN BLASTRADIUS ]`.

Image generation instructions are in `10_LANDING_ASSET_GENERATION.md`.

---

## 14. Data integrity and trust requirements

The UI and API must distinguish at least:

- **monitor observation** — independently observed health claim;
- **protocol-authored declaration** — protocol says something about its own dependency/response;
- **curator declaration** — a trusted BlastRadius curator published an evidence-backed edge;
- **untrusted/unknown creator** — may be queryable on Arkiv but not accepted into trusted product calculations.

No visual treatment may imply that Arkiv itself verified the factual truth of a publisher’s content.

---

## 15. Release 1 scope

Release 1 should be intentionally deep rather than broad.

### Infrastructure support

- Sequencers / chain progression
- Oracles
- RPC infrastructure

### Suggested initial graph size

Enough real, verifiable dependency data to prove transitive behavior, not an artificial target. As a practical launch goal:

- 3 supported chain environments;
- 5–8 well-documented protocols;
- 10–15 monitored/shared infrastructure dependencies;
- 25–40 user-facing operations/components;
- approximately 40–70 verified edges.

The exact numbers are not release blockers if authoritative evidence is unavailable. **Never fabricate edges to hit a count.**

### Future expansion

- bridges;
- keepers/automation;
- data availability layers;
- cross-chain messaging;
- stablecoin issuer dependencies;
- proof systems;
- relayers;
- community publisher reputation;
- richer historical incident reconstruction;
- wallet/aggregator SDK surfaces;
- verified protocol self-service publishing.

---

## 16. Data and privacy requirements

Do not place the following on Arkiv:

- private keys or API credentials;
- raw full RPC logs;
- user transaction calldata or wallet behavior not required for the product;
- private incident discussions;
- large high-frequency time series;
- personal data.

Health assertions should contain compact measurements and hashes/references sufficient to explain the observation without leaking secrets or unnecessarily bloating public storage.

---

## 17. Reliability and performance requirements

Initial production targets, to be validated through load testing:

- API p95 cached read: `< 300 ms` under normal conditions.
- API p95 uncached bounded graph calculation for launch-scale graph: `< 1.5 s`.
- Dashboard LCP target on modern broadband: `< 2.5 s`.
- No unbounded Arkiv pagination loops.
- No unbounded graph traversals.
- Worker observation I/O has explicit timeouts.
- Monitor publishing supports retries without duplicate-authority inflation.
- Web/API must degrade honestly when Arkiv is unavailable.
- Redis loss may reduce caching/queue availability but must not corrupt authoritative state.

Reliability targets should be measured rather than claimed without instrumentation.

---

## 18. Product and operational metrics

Do not confuse product metrics with fake dashboard data. Instrument internally:

### Product usefulness

- incident-detail views;
- protocol exposure searches;
- proof/methodology opens;
- API consumers and request volume;
- graph paths inspected;
- percentage of supported dependencies with >=2 trusted active observers when expected.

### Data quality

- percentage of trusted dependency edges with evidence;
- unresolved/ambiguous edge count;
- stale methodology count;
- monitor disagreement rate;
- average active monitor coverage per dependency.

### Reliability

- Arkiv read/write success rate;
- monitor observation success rate;
- publication lag;
- queue depth/age;
- graph calculation latency;
- cache hit rate;
- RPC provider disagreement;
- API error/timeout rate.

---

## 19. Constraints and known product limitations

1. **Arkiv network availability can change.** Network endpoints must be configured at runtime and verified from current official docs.
2. **Dependency knowledge is imperfect.** Some protocol dependencies are hard to verify. BlastRadius must prefer incomplete-but-verifiable data over complete-looking guesses.
3. **A protocol may have internal mitigations not observable publicly.** “Exposed” describes modeled dependency exposure, not certain failure.
4. **Monitors can be wrong or compromised.** Creator provenance + trust policy + independent observers reduce but do not eliminate this risk.
5. **External RPC providers can disagree or fail together.** Monitor methodology must document provider diversity and limitations.
6. **Oracle heartbeat/deviation configuration is feed-specific.** Do not invent generic thresholds.
7. **Historical Arkiv queries must be tested against the active SDK/network before promising UI behavior.** Architecture supports them, but release gating depends on real integration verification.

---

## 20. Acceptance criteria for Release 1

Release 1 is acceptable only when all of the following are true:

- A real supported sequencer/chain, oracle feed, and RPC dependency can be observed without mocked production data.
- At least two independently configured trusted monitor creator identities can publish real health assertions to the target Arkiv environment.
- The application reads current assertions from Arkiv, deduplicates by immutable creator, and displays disagreement correctly.
- Health assertions expire and cease contributing to live consensus without a cleanup mutation.
- A verified multi-hop dependency graph can be queried from Arkiv and resolved into affected operations.
- Edge versioning/removal semantics work without destroying historical records.
- Protocol/curator provenance is visible in the UI.
- Proof pages display Arkiv metadata from real entities.
- API and web surfaces distinguish `healthy`, `degraded`, `unknown`, and `unavailable` truthfully.
- Monitoring/API/worker/web services expose operational health and structured logs.
- Unit, integration, and E2E suites pass according to `07_TESTING_QA_EDGE_CASES.md`.
- No production path contains fake/mock BlastRadius data.
- Security/threat-model release blockers are resolved.
- Accessibility/responsive UI passes the design QA checklist.
- Full environment setup and real test flow can be followed by a new engineer from documentation alone.

---

## 21. Canonical product statement

> **BlastRadius is an Arkiv-native DeFi dependency graph and ephemeral health-attestation layer. It models who and what depends on shared infrastructure, accepts short-lived independently authored health claims, preserves publisher provenance and disagreement, and computes the downstream protocols and user operations exposed when a dependency degrades—without putting monitoring or execution on the DeFi hot path.**
