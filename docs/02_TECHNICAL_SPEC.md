# BlastRadius Technical Specification

**Status:** Canonical engineering specification  
**Namespace:** `blastradius-v1`  
**Language:** TypeScript  
**Architecture:** pnpm/Turborepo monorepo, Next.js web, NestJS API/workers, Arkiv authoritative public data, Redis transient coordination/cache

---

## 1. Engineering objectives

BlastRadius must be implemented as a production-operable distributed application that can ingest real infrastructure observations, publish compact provenance-bearing records to Arkiv, query and resolve a versioned dependency graph, calculate downstream exposure, and expose that information through a public API and high-quality web interface.

The implementation must optimize for:

- correctness and provenance over superficial breadth;
- graceful behavior under partial upstream failure;
- explicit trust boundaries;
- bounded resource consumption;
- reproducible operations;
- observability;
- code ownership and maintainability;
- zero mocked/fabricated production state.

---

## 2. System topology

```text
                    +------------------------------+
                    |     REAL DEPENDENCIES        |
                    | sequencers / RPC / oracles   |
                    +---------------+--------------+
                                    |
                              real RPC reads
                                    |
                                    v
+------------------+      +---------+----------+
| BullMQ scheduler |----->|  apps/monitor      |
| Redis            |      | observations       |
+------------------+      | methods / scoring  |
        ^                 +---------+----------+
        |                           |
        |                   signed Arkiv writes
        |                           v
        |                 +---------+----------+
        |                 |       ARKIV        |
        |                 | DependencyEdge     |
        |                 | HealthAssertion    |
        |                 | MonitorMethod      |
        |                 | ProtocolResponse   |
        |                 +---------+----------+
        |                           |
        |                      Arkiv reads
        |                           v
+-------+-----------+      +--------+-----------+
| short-lived cache |<-----| apps/api           |
| graph/results     |      | trust + traversal  |
+-------------------+      | REST/OpenAPI       |
                           +--------+-----------+
                                    |
                             HTTPS / live refresh
                                    v
                           +--------+-----------+
                           | apps/web           |
                           | Next.js UI         |
                           +--------------------+

Publisher workflows:
apps/publisher-cli -> verified config/evidence -> signed Arkiv writes
```

---

## 3. Monorepo structure

```text
blast-radius/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── lib/
│   │   ├── public/images/
│   │   └── tests/
│   ├── api/
│   │   └── src/
│   │       ├── arkiv/
│   │       ├── incidents/
│   │       ├── dependencies/
│   │       ├── protocols/
│   │       ├── proofs/
│   │       ├── methods/
│   │       ├── health/
│   │       └── common/
│   ├── monitor/
│   │   └── src/
│   │       ├── scheduler/
│   │       ├── sequencer/
│   │       ├── oracle/
│   │       ├── rpc/
│   │       ├── publishing/
│   │       └── health/
│   └── publisher-cli/
│       └── src/
│           ├── commands/
│           ├── config/
│           └── validation/
├── packages/
│   ├── arkiv/
│   │   ├── src/client/
│   │   ├── src/readers/
│   │   ├── src/writers/
│   │   ├── src/mappers/
│   │   └── src/errors/
│   ├── schemas/
│   ├── graph/
│   ├── monitoring/
│   ├── trust/
│   ├── config/
│   ├── observability/
│   └── shared/
├── config/
│   ├── dependencies/
│   ├── monitors/
│   └── trust/
├── docs/
│   ├── arkiv-compatibility.md
│   ├── runbooks/
│   └── adr/
├── docker/
├── scripts/
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── AGENTS.md
```

### Package rules

- `packages/schemas` defines shared domain contracts and Zod schemas. It must not import framework code.
- `packages/arkiv` is the **only package permitted to depend directly on Arkiv SDK primitives**. Apps use its interfaces.
- `packages/graph` contains deterministic traversal/version/scoring logic and is framework-independent.
- `packages/trust` classifies creator identities and publisher scopes.
- `packages/monitoring` contains reusable monitor interfaces, observation domain types, severity primitives, and evidence hashing.
- `packages/config` owns validated configuration schemas.
- `packages/observability` standardizes logs, metrics, trace IDs, and error reporting.
- Avoid circular dependencies. Shared packages point inward toward pure contracts, not toward apps.

---

## 4. Runtime services and responsibilities

### 4.1 `apps/web`

Responsibilities:

- public landing page;
- live system dashboard;
- dependency, incident, protocol, proof, and methodology pages;
- React Flow graph rendering;
- path-first mobile alternative;
- typed API client;
- loading/error/unknown states;
- accessibility and responsive behavior.

Must not:

- contain monitor private keys;
- query secret RPC endpoints directly;
- calculate authoritative trust state independently from API;
- fabricate telemetry when API is unavailable.

### 4.2 `apps/api`

Responsibilities:

- public versioned REST API;
- read/query Arkiv through `packages/arkiv`;
- resolve edge versions;
- resolve creator-based live consensus;
- compute blast-radius graph paths and scores;
- expose proof/method metadata;
- rate limiting;
- reconstructable Redis caching;
- OpenAPI;
- liveness/readiness.

### 4.3 `apps/monitor`

Responsibilities:

- schedule observations;
- read real external dependencies;
- normalize observations;
- calculate method-specific severity/confidence;
- decide publication cadence;
- create deterministic observation IDs;
- publish signed `HealthAssertion` entities;
- expose worker health/metrics;
- safely retry transient failures.

Each monitor wallet identity should have explicit scope and be independently configurable.

### 4.4 `apps/publisher-cli`

Responsibilities:

- validate dependency declaration files;
- verify required evidence metadata is present;
- inspect current Arkiv edge/method versions;
- publish new `DependencyEdge` / `MonitorMethod` / authorized `ProtocolResponse` entities;
- extend eligible unchanged long-lived entities when policy permits;
- output entity key, creator, network, transaction/proof metadata;
- provide dry **validation** mode only; never a fake-write mode that looks successful.

---

## 5. Arkiv compatibility layer

### 5.1 Isolation

All Arkiv SDK usage must be isolated in `packages/arkiv` so network/SDK changes affect a narrow boundary.

Suggested interfaces:

```ts
export interface ArkivReader {
  listDependencyEdges(input: ListDependencyEdgesInput): Promise<ArkivPage<DependencyEdgeRecord>>;
  listHealthAssertions(input: ListHealthAssertionsInput): Promise<ArkivPage<HealthAssertionRecord>>;
  listMonitorMethods(input: ListMonitorMethodsInput): Promise<ArkivPage<MonitorMethodRecord>>;
  listProtocolResponses(input: ListProtocolResponsesInput): Promise<ArkivPage<ProtocolResponseRecord>>;
  getEntity(input: GetEntityInput): Promise<ArkivEntityRecord | null>;
}

export interface ArkivWriter {
  publishDependencyEdge(input: DependencyEdgeWrite): Promise<PublishResult>;
  publishHealthAssertion(input: HealthAssertionWrite): Promise<PublishResult>;
  publishMonitorMethod(input: MonitorMethodWrite): Promise<PublishResult>;
  publishProtocolResponse(input: ProtocolResponseWrite): Promise<PublishResult>;
  extendEntity(input: ExtendEligibleEntityInput): Promise<ExtendResult>;
}
```

### 5.2 Runtime network configuration

Do not import a retired network constant into business logic. Resolve current network config from environment and construct SDK clients in one adapter.

```ts
export interface ArkivRuntimeConfig {
  networkName: string;
  chainId: number;
  rpcUrl: string;
  wsUrl?: string;
  explorerUrl?: string;
  requestTimeoutMs: number;
  maxQueryPages: number;
}
```

Startup validation must reject missing/invalid chain ID or RPC URL.

### 5.3 Current network caveat

As of this document's preparation in August 2026, Arkiv's previous Braga public testnet had been retired and there was no public testnet endpoint. Do not hard-code Braga values from old examples. Verify `docs.arkiv.network` before every deployment and record tested network details in `docs/arkiv-compatibility.md`.

### 5.4 SDK/query invariants

Implementation must account for the current official SDK semantics:

- indexed numeric attributes are integers;
- scale decimals/percentages into integers such as basis points;
- expiry values are positive and compatible with Arkiv's block/expiry rules;
- every query includes `project=blastradius-v1`;
- use immutable creator metadata when classifying publisher identity;
- paginate rather than assuming one query returns all entities;
- current docs specify a bounded page size; adapter must respect server limits;
- do not depend on deprecated server-side ordering; resolve deterministically application-side;
- historical read support (`validAtBlock`/`atBlock` or current equivalent) must be feature-gated until verified against the actual active SDK/network.

### 5.5 Query safety

A common paginator should enforce:

- max pages from config;
- max total records appropriate to endpoint;
- cursor loop detection;
- timeout/deadline;
- cancellation/abort signal;
- structured error when completeness cannot be guaranteed.

Never return a “complete” blast radius from a truncated query without marking it partial/unavailable.

---

## 6. Canonical domain schemas

All contracts must be Zod-defined and TypeScript-inferred in `packages/schemas`.

### 6.1 Common enums

```ts
type DependencyType =
  | 'sequencer'
  | 'oracle'
  | 'rpc'
  | 'bridge'
  | 'keeper'
  | 'data_availability'
  | 'cross_chain_messaging'
  | 'stablecoin_issuer'
  | 'proof_system'
  | 'relayer'
  | 'chain_environment'
  | 'oracle_adapter'
  | 'protocol'
  | 'market'
  | 'vault'
  | 'operation';

type HealthState =
  | 'healthy'
  | 'watch'
  | 'degraded'
  | 'critical'
  | 'unknown'
  | 'unavailable';
```

### 6.2 IDs

IDs must be stable, lowercase, human-inspectable where practical, and namespaced by semantic object. Examples:

```text
sequencer:base
chain:base
oracle:chainlink:base:eth-usd
rpc:base:provider-a
protocol:aave-v3:base
market:aave-v3:base:weth
operation:aave-v3:base:weth:borrow
```

Never use display names as graph identity.

---

## 7. Arkiv entities

Full payload examples and query designs are in `03_ARCHITECTURE_AND_DATA_MODEL.md`. This section defines engineering contracts.

### 7.1 `DependencyEdge`

Purpose: versioned declaration that one node depends on another.

Required indexed attributes:

- `project`
- `kind=dependency_edge`
- `edge_id`
- `dependent_id`
- `dependent_type`
- `dependency_id`
- `dependency_type`
- `protocol_id` when applicable
- `operation` when applicable
- `chain_id` integer when applicable
- `criticality_bps` integer `0..10000`
- `propagation_bps` integer `0..10000`
- `version` positive integer
- `state=active|removed`
- `effective_at` integer Unix seconds
- `source_kind=protocol|curator`

Suggested TTL: approximately 30 days for active declarations, with deliberate renewal/extension if unchanged and new version on semantic changes.

### 7.2 `HealthAssertion`

Purpose: short-lived observation of one dependency.

Required indexed attributes:

- `project`
- `kind=health_assertion`
- `observation_id`
- `dependency_id`
- `dependency_type`
- `chain_id` where applicable
- `state`
- `severity` integer `0..100`
- `confidence_bps` integer `0..10000`
- `observed_at` integer Unix seconds
- `observed_block` integer when applicable
- `method_id`
- `method_version`

Optional method-specific indexed measurements may include integer fields such as:

- `safe_lag_sec`
- `block_gap_sec`
- `provider_count`
- `latency_ms`
- `staleness_sec`

Suggested TTL: `300` seconds unless a method justifies another short period compatible with Arkiv rules.

**Never extend this entity type.**

### 7.3 `MonitorMethod`

Purpose: public versioned description of monitor methodology.

Attributes include:

- `project`
- `kind=monitor_method`
- `method_id`
- `dependency_type`
- `version`
- `min_sources`
- `sample_interval_sec`

TTL: approximately 30 days; extension allowed only when semantically unchanged.

### 7.4 `ProtocolResponse`

Purpose: protocol-authored statement about response to a current/recent dependency incident.

Attributes include:

- `project`
- `kind=protocol_response`
- `protocol_id`
- `dependency_id`
- `chain_id` where applicable
- `action`
- `severity` if supplied by protocol policy
- `policy_version`
- `response_at`

TTL: response-class dependent, typically 6 hours to 7 days.

---

## 8. Edge version resolution

Arkiv may contain multiple historical `DependencyEdge` entities sharing `edge_id`.

For a current graph:

1. fetch all relevant records within bounded/paginated limits;
2. validate each record;
3. discard creators not accepted for the requested trust view;
4. group by `(edge_id, creator)` if preserving publisher-specific versions;
5. choose highest valid `version`; use deterministic tie-breaking based on immutable Arkiv creation metadata if malformed duplicates exist;
6. keep `state=active`; a newest `state=removed` suppresses older versions from that publisher;
7. combine multiple accepted publisher views according to trust policy without erasing provenance.

If conflicting accepted publishers disagree on the same conceptual edge, expose provenance/conflict rather than silently selecting one unless the active policy explicitly establishes publisher precedence.

For a simple curated Release 1 graph, curator/protocol scopes can define which publisher owns which edge namespace.

---

## 9. Trust policy

Use a repository-managed, validated trust registry at launch. Example:

```yaml
version: 1
publishers:
  - id: monitor-a
    address: "0x..."
    roles: [monitor]
    scopes:
      dependency_types: [sequencer, rpc]
    enabled: true
  - id: protocol-a
    address: "0x..."
    roles: [protocol]
    scopes:
      protocols: [protocol-a]
    enabled: true
  - id: curator-primary
    address: "0x..."
    roles: [curator]
    scopes:
      dependency_types: [sequencer, oracle, rpc, chain_environment, oracle_adapter, market, vault, operation]
    enabled: true
```

Requirements:

- normalize addresses before matching;
- use immutable Arkiv creator, not display label;
- unknown creators are untrusted by default;
- role and scope are checked per entity kind;
- trust policy has explicit version and checksum;
- cache keys include trust policy version;
- policy changes should be auditable in repository history and operations logs.

Do not put a complex reputation protocol on-chain in Release 1.

---

## 10. Health consensus algorithm

For one dependency:

1. query unexpired/current `HealthAssertion` records scoped to project + dependency;
2. validate schema;
3. filter to trusted monitor creators authorized for the dependency type;
4. group by immutable `$creator`;
5. for each creator, select newest valid assertion by observed time plus immutable Arkiv metadata tie-breaker;
6. reject assertions outside method/freshness policy if required;
7. calculate state distribution;
8. return aggregate state plus evidence, not just one number.

Suggested response type:

```ts
interface HealthConsensus {
  dependencyId: string;
  aggregateState: HealthState;
  aggregateSeverity: number | null;
  coverage: {
    activeTrustedCreators: number;
    expectedTrustedCreators?: number;
    minimumRequired: number;
  };
  agreement: 'unanimous' | 'majority' | 'split' | 'insufficient' | 'unavailable';
  byState: Record<HealthState, number>;
  observations: ResolvedCreatorObservation[];
  computedAt: string;
}
```

Do not use Arkiv entity count as quorum because one creator can publish multiple entities.

---

## 11. Aggregate severity policy

A simple initial policy should be documented and deterministic.

Recommended:

- insufficient trusted creators -> `unknown`/`insufficient`, not healthy;
- if a strict majority agrees on a state, use that state;
- if tied/split across materially different states, aggregate state=`unknown` or `degraded` according to conservative configured policy, but always expose split;
- aggregate severity can use the median severity of the creators supporting the selected state, avoiding one extreme publisher dominating;
- protocol response never overrides monitor consensus.

Methodology must remain configurable/tested and described in API docs.

---

## 12. Monitor architecture

### 12.1 Interface

```ts
export interface DependencyMonitor<TTarget, TEvidence> {
  readonly type: DependencyType;
  observe(target: TTarget, signal: AbortSignal): Promise<HealthObservation<TEvidence>>;
}
```

Observation:

```ts
interface HealthObservation<TEvidence = unknown> {
  dependencyId: string;
  dependencyType: DependencyType;
  state: HealthState;
  severity: number;
  confidenceBps: number;
  observedAt: number;
  observedBlock?: number;
  methodId: string;
  methodVersion: number;
  measurements: Record<string, number | string | boolean>;
  evidence: TEvidence;
}
```

### 12.2 Scheduling

Baseline guidance:

- observation sampling: every 15–30 seconds depending target/method;
- publish healthy heartbeat: around every 120 seconds;
- publish degraded/critical: every 30–60 seconds while state remains current;
- publish immediately on material state transition;
- assertion TTL: around 300 seconds.

Jobs must be staggered with jitter to avoid synchronized bursts.

### 12.3 Publication policy

The system should observe more frequently than it writes to Arkiv. Publish when:

- state changes materially;
- severity crosses a configured band/threshold;
- healthy heartbeat interval is reached;
- degraded heartbeat interval is reached;
- evidence changes materially under method rules.

This reduces storage writes while preserving current time-scoped evidence.

### 12.4 Idempotency

Construct deterministic observation IDs, for example:

```text
sha256(
  project |
  creatorAddress |
  dependencyId |
  methodId |
  methodVersion |
  publicationTimeBucket |
  state |
  evidenceHash
)
```

Before publishing, use a bounded distributed lock and/or query for the deterministic ID where appropriate. The system must tolerate process crash after broadcast but before local acknowledgement without causing unbounded duplicate writes.

---

## 13. Sequencer / chain progression monitor

Release 1 should support an explicitly configured EVM chain/sequencer methodology using real provider reads.

Potential observations, depending chain support:

- latest/unsafe head progression;
- safe head progression;
- finalized head progression;
- elapsed time since head advancement;
- safe-to-unsafe lag;
- finalized-to-safe lag;
- block timestamp progression;
- agreement across independent RPC providers.

For OP Stack-like chains, use documented RPC semantics supported by the configured providers. Do not assume every EVM chain exposes identical tags/semantics.

Illustrative severity model only — actual method file must document thresholds:

```text
safe lag < 30 sec       -> severity 0
30–120 sec              -> severity 20
120–300 sec             -> severity 50
300–600 sec             -> severity 75
> 600 sec               -> severity 95
```

Add method-defined penalties for provider disagreement or missing required observations.

Thresholds are methodology, not universal protocol truth.

---

## 14. Oracle monitor

Each configured oracle target must include authoritative feed metadata.

For a Chainlink-style feed, where applicable, observe:

- current round/answer;
- update timestamp;
- configured heartbeat expectation from official source;
- round progression;
- stale/invalid timestamps;
- answer validity appropriate to feed;
- optional comparison to an independent secondary source for anomaly context.

Never invent heartbeat/deviation thresholds. If authoritative metadata is unavailable, do not onboard the feed as production-trusted.

Potential method measurements:

- `staleness_sec`
- `heartbeat_sec`
- `round_id`
- `updated_at`
- `secondary_deviation_bps`

The monitor is not a replacement price oracle; it is an operational health observer.

---

## 15. RPC monitor

Observe each provider independently and compare across providers.

Checks may include:

- `eth_blockNumber` success and head;
- `eth_getBlockByNumber` correctness/latency;
- block hash agreement for the same block;
- head lag vs peer median;
- request latency;
- timeout/error rate over bounded recent sample;
- malformed response behavior.

Important:

- provider endpoints are secrets/server-only if they contain keys;
- use at least two providers for agreement claims where possible;
- one provider failure must not automatically imply chain failure;
- correlated providers must not be presented as fully independent if known to share infrastructure.

---

## 16. Evidence hashing

For compact public provenance, canonicalize evidence before hashing.

Requirements:

- stable key ordering;
- exclude secrets, auth headers, full provider URLs with API keys;
- include method version, target ID, observation timestamp/time bucket, and the normalized measurements needed to reproduce interpretation;
- hash with a standard cryptographic hash (e.g. SHA-256 for application evidence unless Arkiv/Web3 compatibility requires another explicitly documented algorithm);
- represent algorithm alongside hash.

Example canonical object:

```json
{
  "methodId": "sequencer-health-v1",
  "methodVersion": 1,
  "dependencyId": "sequencer:base",
  "observedAt": 1787365120,
  "measurements": {
    "safeLagSec": 612,
    "providersAgreeing": 2,
    "providersTotal": 3
  }
}
```

---

## 17. Graph resolution and traversal

### 17.1 Direction

Stored edge:

```text
dependent -> dependency
```

Impact traversal from failing root goes in the reverse direction: find all edges whose `dependency_id` equals current node, then visit their `dependent_id`.

### 17.2 Safety limits

Configurable hard limits:

- maximum graph depth;
- maximum visited nodes;
- maximum traversed edges;
- maximum paths returned/stored per root;
- per-query timeout/deadline;
- Arkiv pagination maximum.

If limits are reached, response must indicate partial/truncated computation rather than claim completeness.

### 17.3 Cycle handling

Use visited node/path guards. A malformed cyclic graph must not hang the API.

### 17.4 Path preservation

Preserve enough path information to explain why an operation is affected.

For each leaf operation return:

- highest-exposure path;
- top N materially distinct alternate paths;
- path count (bounded or flagged as capped);
- edge provenance for selected paths.

---

## 18. Exposure scoring

Use integer math to avoid floating ambiguity where practical.

At each edge:

```text
next = round(
  current
  * criticality_bps / 10000
  * propagation_bps / 10000
)
```

Where `current` is normalized 0–100 severity.

Definitions:

- `criticality_bps`: how important the dependency is to the dependent operation/component under modeled conditions.
- `propagation_bps`: how much of upstream impairment is expected to propagate, accounting for documented fallback/isolation.

Both must be evidence-backed/defaulted conservatively according to explicit policy. They are not hidden ML outputs.

Do not sum scores from independent paths. Use maximum path score for primary severity and show multiplicity separately.

---

## 19. Caching

Redis may cache expensive read results, but every cache entry must be reconstructable from Arkiv and config.

Suggested cache keys include:

```text
br:{project}:health:{dependencyId}:{trustPolicyVersion}
br:{project}:graph:{graphFingerprint}:{rootId}:{trustPolicyVersion}
br:{project}:protocol:{protocolId}:{graphFingerprint}:{trustPolicyVersion}
```

`graphFingerprint` should reflect the resolved current graph version/set, not a static version number that can silently become stale.

Recommended short TTL: ~15–30 seconds for current-state computed results.

Do not serve a cached “healthy” response indefinitely when Arkiv reads fail. API response should include freshness and cache provenance; stale-while-error behavior, if added, must be explicit and bounded, with `stale=true` and age.

---

## 20. API specification

Base path: `/api/v1`

### 20.1 `GET /incidents`

Query examples:

- `state=degraded,critical`
- `dependencyType=sequencer`
- `chainId=8453`
- `cursor=...`
- `limit=50`

Response:

```json
{
  "data": [
    {
      "dependency": {
        "id": "sequencer:base",
        "type": "sequencer",
        "label": "Base Sequencer"
      },
      "health": {
        "aggregateState": "critical",
        "aggregateSeverity": 91,
        "agreement": "majority",
        "activeTrustedCreators": 3,
        "byState": {"critical": 2, "healthy": 1}
      },
      "exposure": {
        "protocolsAffected": 9,
        "operationsAffected": 37,
        "criticalOperations": 11,
        "complete": true
      },
      "computedAt": "2026-08-25T12:00:00Z"
    }
  ],
  "page": {"nextCursor": null}
}
```

### 20.2 `GET /dependencies/:dependencyId`

Returns canonical metadata, current health consensus, monitor methods, active responses, and direct exposure summary.

### 20.3 `GET /blast-radius/:dependencyId`

Response shape:

```json
{
  "root": {
    "id": "sequencer:base",
    "healthState": "critical",
    "severity": 91
  },
  "summary": {
    "dependenciesAffected": 13,
    "protocolsAffected": 9,
    "operationsAffected": 37,
    "criticalOperations": 11
  },
  "operations": [
    {
      "operationId": "operation:protocol-a:base:eth-usdc:borrow",
      "protocolId": "protocol-a",
      "operation": "borrow",
      "blastScore": 88,
      "pathCount": 2,
      "topPaths": [["sequencer:base", "chain:base", "oracle:...", "operation:..."]]
    }
  ],
  "graph": {
    "nodes": [],
    "edges": []
  },
  "meta": {
    "complete": true,
    "computedAt": "...",
    "trustPolicyVersion": "...",
    "graphFingerprint": "..."
  }
}
```

### 20.4 `GET /protocols/:protocolId/exposure`

Returns all currently exposed supported operations for a protocol, grouped by root degraded dependency.

### 20.5 `GET /proof/:entityKey`

Returns normalized Arkiv metadata and validated entity content. Do not return secrets or unsafe raw HTML.

### 20.6 `GET /methods/:methodId`

Returns latest accepted methodology plus versions as requested.

### 20.7 Health probes

- `/health/live`: process/event-loop is alive.
- `/health/ready`: required internal dependencies are usable according to service role.

A read-only web/API service may be “ready with degraded Arkiv” only if deployment policy explicitly supports a maintenance/unavailable page; it must not claim live current data.

### 20.8 Error envelope

```json
{
  "error": {
    "code": "ARKIV_QUERY_UNAVAILABLE",
    "message": "Current Arkiv data could not be read.",
    "retryable": true,
    "requestId": "...",
    "details": null
  }
}
```

Do not leak upstream URLs/keys/internal stack traces.

---

## 21. Live-update behavior

Preferred order:

1. use supported Arkiv subscription/WebSocket primitives if verified stable on the active network/SDK;
2. otherwise poll BlastRadius API at a bounded interval (e.g. 15–30 seconds for live incident views, slower for background views);
3. apply browser visibility detection to reduce unnecessary requests;
4. refetch immediately on focus when stale;
5. clearly expose last-updated timestamp.

Do not build a fake WebSocket server that emits synthetic incidents merely to appear real-time.

---

## 22. Frontend architecture

### State

Use TanStack Query for server state:

- caching;
- retries appropriate to read operations;
- loading/error/refetch states;
- query invalidation.

Use component/local state for graph interaction, filters, expanded paths, and UI controls.

Avoid a global client state library unless a concrete cross-route requirement emerges.

### API typing

Generate or share types from schemas/OpenAPI where practical. Validate external API payloads in development-critical boundaries rather than blindly trusting JSON.

### Graph rendering

React Flow is responsible only for visualization/interaction. The API is responsible for authoritative path/scoring computation.

Large graph behavior:

- initially render a focused root subgraph;
- collapse low-priority branches;
- allow expand-on-demand;
- virtualize/limit detail sidebars;
- provide path list alternative.

---

## 23. Dependency declaration configuration

Verified dependency data should be stored in reviewable repository config before publication.

Example:

```yaml
schemaVersion: 1
edgeId: "aave-v3-base-weth-borrow->chainlink-base-eth-usd"
dependent:
  id: "operation:aave-v3:base:weth:borrow"
  type: operation
dependency:
  id: "oracle:chainlink:base:eth-usd"
  type: oracle
protocolId: "aave-v3"
chainId: 8453
criticalityBps: 9500
propagationBps: 10000
sourceKind: curator
evidence:
  - type: official_docs
    url: "https://..."
    description: "Official protocol documentation identifying oracle dependency."
contractReferences:
  - chainId: 8453
    address: "0x..."
failureMode: "Borrow health/account valuation depends on this feed under documented configuration."
```

CLI validation must reject missing evidence, malformed IDs/addresses, invalid bps, duplicate version semantics, or unauthorized publisher role.

---

## 24. Configuration architecture

All config is startup-validated.

Layers:

1. static code defaults for safe non-secret values;
2. versioned YAML for monitor targets/trust/dependency declarations;
3. environment variables for deployment-specific endpoints and secrets.

Config parser should fail with actionable errors, for example:

```text
Invalid configuration: ARKIV_CHAIN_ID is required when ARKIV_RPC_URL is set.
```

Never substitute a default test private key in non-test runtime.

---

## 25. Observability

### 25.1 Logs

Structured JSON logs in deployed environments.

Common fields:

- `timestamp`
- `level`
- `service`
- `environment`
- `requestId` / `jobId`
- `dependencyId`
- `methodId`
- `creatorAddress` (public address only)
- `operation`
- `durationMs`
- `errorCode`

Never log private keys or API tokens.

### 25.2 Metrics

Suggested metric names:

- `blastradius_arkiv_read_requests_total`
- `blastradius_arkiv_read_failures_total`
- `blastradius_arkiv_write_requests_total`
- `blastradius_arkiv_write_failures_total`
- `blastradius_arkiv_write_latency_seconds`
- `blastradius_monitor_observations_total`
- `blastradius_monitor_failures_total`
- `blastradius_monitor_publication_lag_seconds`
- `blastradius_monitor_active_publishers`
- `blastradius_rpc_provider_errors_total`
- `blastradius_rpc_provider_latency_seconds`
- `blastradius_graph_traversal_seconds`
- `blastradius_graph_nodes_visited`
- `blastradius_graph_truncations_total`
- `blastradius_api_requests_total`
- `blastradius_api_request_duration_seconds`
- `blastradius_queue_depth`
- `blastradius_queue_oldest_job_age_seconds`

Use bounded labels; never put raw entity IDs/high-cardinality hashes into Prometheus labels indiscriminately.

### 25.3 Tracing

Propagate trace/correlation context across API -> Arkiv and scheduler -> job -> monitor -> publisher where possible.

---

## 26. Error taxonomy

At minimum define typed codes for:

- `CONFIG_INVALID`
- `ARKIV_READ_TIMEOUT`
- `ARKIV_QUERY_UNAVAILABLE`
- `ARKIV_WRITE_REJECTED`
- `ARKIV_WRITE_UNKNOWN_RESULT`
- `ARKIV_PAGINATION_LIMIT_REACHED`
- `ARKIV_SCHEMA_INVALID`
- `UNTRUSTED_CREATOR`
- `INSUFFICIENT_MONITOR_COVERAGE`
- `RPC_TIMEOUT`
- `RPC_MALFORMED_RESPONSE`
- `RPC_PROVIDER_DISAGREEMENT`
- `ORACLE_CONFIG_INVALID`
- `ORACLE_READ_FAILED`
- `GRAPH_LIMIT_REACHED`
- `GRAPH_INVALID_EDGE`
- `EVIDENCE_VALIDATION_FAILED`
- `REDIS_UNAVAILABLE`
- `RATE_LIMITED`

Unknown write result is particularly important: if network failure occurs after broadcasting, do not blindly retry forever. Reconcile by deterministic observation ID/entity lookup before another write.

---

## 27. Security requirements

Detailed threat model is in `08_SECURITY_THREAT_MODEL.md`. Technical baseline:

- secret keys server/worker/CLI only;
- production private keys in secret manager/KMS-compatible mechanism when deployment provider supports it;
- least privilege by separate publisher identities;
- no user-supplied arbitrary URL fetching from API without SSRF controls;
- strict output escaping;
- CSP/security headers in web app;
- request body limits;
- rate limiting;
- dependency pinning/lockfile;
- CI secret scanning and dependency audit;
- no dynamic code execution from Arkiv payloads;
- validate and sanitize all Arkiv payloads as untrusted external data;
- trust registry fail-closed.

---

## 28. Production deployment topology

Hosting provider is intentionally not hard-coded.

Recommended topology:

```text
CDN/Edge
   |
Next.js web replicas
   |
NestJS API replicas ---- Redis HA/managed
   |                         |
   |                         +---- BullMQ queues
   |
Arkiv network

Independent monitor worker replicas
   |
   +---- RPC provider A/B/C
   +---- oracle contracts
   +---- Arkiv writer
```

Operational requirements:

- web/API horizontally scalable and stateless;
- worker concurrency controlled by target and wallet publication policy;
- scheduler leadership/unique repeatable jobs prevent duplicate storm;
- Redis uses durable/HA mode suitable to selected provider but remains non-authoritative;
- readiness prevents broken instances receiving traffic;
- rolling deploys preserve queued jobs;
- environment-specific publisher wallets/keys;
- production alerting configured before launch.

---

## 29. Scaling model

### 29.1 Read scaling

- short-lived Redis caches for repeated current-state queries;
- precompute hot root blast radii on incident state changes if needed;
- preserve API bounds/pagination;
- collapse graph rendering client-side.

### 29.2 Monitor scaling

Partition jobs by dependency ID. Set per-provider concurrency and rate budgets. Do not increase worker count in a way that multiplies identical Arkiv writes.

### 29.3 Graph scaling

Launch-scale graph is small enough for in-memory traversal after bounded fetch. As edge count grows:

- build a cached adjacency index from resolved Arkiv edges;
- fingerprint the edge set;
- refresh incrementally/currently where supported;
- keep source records/provenance on Arkiv;
- benchmark 1k/10k/50k edge datasets;
- consider a dedicated reconstructable graph-index service only when measurements justify it.

Do not introduce an authoritative graph database prematurely.

---

## 30. CI pipeline

Recommended stages:

1. lockfile/install integrity;
2. formatting check;
3. ESLint;
4. TypeScript typecheck;
5. unit tests + coverage thresholds for critical graph/trust logic;
6. build all packages/apps;
7. dependency/security scan;
8. integration tests with real Redis and a real supported Arkiv test environment when available;
9. real RPC/oracle integration tests using dedicated non-production credentials/targets;
10. Playwright E2E against running stack;
11. container image build/scan;
12. deployment smoke test in staging.

If Arkiv integration cannot run because no authorized network/local official node is available, CI must explicitly mark that required gate unavailable/failing rather than replacing it with a fake adapter.

---

## 31. Arkiv compatibility record

Maintain `docs/arkiv-compatibility.md` containing:

- verification date;
- `@arkiv-network/sdk` version;
- `viem` version;
- active Arkiv network name/chain ID;
- RPC/WS/explorer source (not secrets);
- entity creation API tested;
- extension API tested;
- query operators tested;
- creator metadata tested;
- pagination behavior tested;
- expiration behavior tested;
- historical query behavior tested/not tested;
- subscriptions tested/not tested;
- known SDK/network caveats;
- links to exact official docs/release notes consulted.

This prevents stale assumptions from becoming invisible technical debt.

---

## 32. Initial performance budgets

Validate with tests; these are targets, not guarantees.

| Area | Initial target |
|---|---|
| API cached p95 | < 300 ms |
| API uncached graph p95 at launch scale | < 1.5 s |
| Arkiv read timeout | 10 s default, configurable |
| External RPC request timeout | 5–10 s method-specific |
| Public API request body | minimal/read API; <= 256 KB where writes/admin added |
| Graph max depth | 32 default |
| Graph max paths/root | 5,000 default safety cap |
| Current-result cache TTL | 15–30 s |
| Landing/dashboard LCP | < 2.5 s target |
| CLS | < 0.1 target |

---

## 33. Data consistency model

BlastRadius is intentionally eventually consistent across independent publishers.

A page may briefly observe:

- a new health assertion before a graph cache refresh;
- a protocol response slightly after an incident view loads;
- one monitor observation before another monitor publishes.

The API must expose timestamps/freshness so this is understandable.

Do not implement distributed transactions across Arkiv + Redis. Arkiv publication is authoritative; Redis state can be recreated.

---

## 34. Failure-mode behavior

### Arkiv read outage

- API current-data endpoints return typed unavailable or explicitly stale bounded cached data if policy allows;
- UI displays `[DATA UNAVAILABLE]` / last successful freshness;
- do not show green/healthy based solely on inability to read.

### Arkiv write outage

- monitor observation still records operational failure metrics locally/logging;
- worker retries safely according to policy;
- if broadcast outcome is unknown, reconcile before retry;
- alert on publication lag;
- claim coverage eventually falls as old assertions expire, which should be visible.

### Redis outage

- API may bypass cache and read Arkiv directly within rate/safety limits;
- BullMQ scheduling may pause/fail readiness;
- no authoritative public data is lost;
- alert and restore Redis.

### One RPC provider outage

- monitor treats provider as unavailable, evaluates remaining coverage;
- chain state is not automatically considered down;
- confidence/coverage may fall.

### All monitor providers disagree

- health consensus shows split/unknown/degraded according to conservative policy;
- raw observations remain visible.

---

## 35. Implementation definition of done

Technical completion requires:

- strict typecheck/lint/build pass;
- production runtime has no mock Arkiv adapter;
- real Arkiv read/write integration verified in an authorized environment;
- health expiry behavior verified end-to-end;
- creator dedupe verified;
- graph versioning/removal verified;
- sequencer/oracle/RPC monitors perform real reads;
- evidence and trust validation enforced;
- API OpenAPI generated/validated;
- UI correctly handles live/loading/unknown/unavailable states;
- security headers/secrets controls enabled;
- metrics/logs/health probes operational;
- load tests demonstrate safety limits;
- Playwright critical journeys pass;
- operator can follow `06_ENV_SETUP_OPERATIONS.md` from clean checkout;
- final repository audit finds no production fake/mock/placeholder data paths.

See `11_DECISIONS_GATES_AND_DEFINITION_OF_DONE.md` for phase gates.
