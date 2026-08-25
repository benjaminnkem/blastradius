# BlastRadius Architecture and Data Model

This document specifies BlastRadius's domain architecture, Arkiv entity model, trust policy, graph resolution, provenance behavior, query patterns, and data lifecycle.

---

## 1. Architectural thesis

BlastRadius separates four concerns that must not be conflated:

1. **Observation** — independent monitors inspect real infrastructure.
2. **Attestation** — those monitors publish short-lived wallet-attributed claims to Arkiv.
3. **Dependency modeling** — protocols/curators publish versioned declarations describing what depends on what.
4. **Inference** — BlastRadius reads current trusted state and performs graph traversal/scoring off Arkiv.

This architecture keeps network execution and high-frequency telemetry outside Arkiv while making the minimum important shared state queryable, time-scoped, tamper-evident, and attributable.

---

## 2. Topology

```text
                                  READ / VERIFY
                                  ┌───────────────┐
                                  │  PUBLIC USER  │
                                  └───────┬───────┘
                                          │
                                          ▼
                                  ┌───────────────┐
                                  │   NEXT.JS UI  │
                                  └───────┬───────┘
                                          │ HTTPS
                                          ▼
                                  ┌───────────────┐
                                  │  NESTJS API   │
                                  │ trust/graph   │
                                  └───┬───────┬───┘
                                      │       │ cache only
                           Arkiv reads│       ▼
                                      │   ┌─────────┐
                                      │   │  REDIS  │
                                      │   └─────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                              ARKIV                                  │
│                                                                     │
│  DependencyEdge      HealthAssertion      MonitorMethod             │
│  ProtocolResponse    immutable creator    time-scoped entities      │
└───────▲────────────────────▲────────────────────▲────────────────────┘
        │                    │                    │
        │ signed writes      │ signed writes      │ signed writes
        │                    │                    │
┌───────┴──────────┐ ┌───────┴──────────┐ ┌──────┴─────────────┐
│ PUBLISHER CLI    │ │ MONITOR WORKERS  │ │ PROTOCOL PUBLISHER│
│ curated edges    │ │ independent IDs  │ │ responses/edges   │
└───────┬──────────┘ └────────┬─────────┘ └─────────┬──────────┘
        │                     │                     │
        │ evidence            │ real observations   │ protocol policy
        ▼                     ▼                     ▼
 official docs/       sequencers / oracles /    protocol operators
 contracts/config       RPC endpoints
```

---

## 3. Graph model

### 3.1 Edge direction

Every edge is stored as:

```text
DEPENDENT -> DEPENDENCY
```

Examples:

```text
operation:aave-v3:base:weth:borrow
    -> oracle:chainlink:base:eth-usd

oracle:chainlink:base:eth-usd
    -> chain:base

chain:base
    -> sequencer:base
```

If `sequencer:base` degrades, BlastRadius computes impact by finding edges where `dependency_id=sequencer:base`, then recursively finding what depends on those dependents.

### 3.2 Why not a flat protocol-status model

A flat model:

```text
sequencer -> protocol
```

cannot explain which operation or intermediate adapter is actually exposed. BlastRadius therefore supports arbitrary intermediate nodes such as:

- chain environment;
- oracle feed;
- oracle adapter;
- bridge route;
- market;
- vault;
- protocol component;
- user-facing operation.

### 3.3 Stable IDs

Use deterministic semantic identifiers, not labels:

```text
sequencer:base
chain:base
oracle:chainlink:base:eth-usd
oracle-adapter:protocol-a:base:eth-usd
protocol:protocol-a:base
market:protocol-a:base:weth-usdc
operation:protocol-a:base:weth-usdc:borrow
```

ID rules:

- lowercase;
- colon-separated;
- no spaces;
- stable across UI renames;
- include chain/protocol/feed specificity where necessary;
- validate allowed characters and max length.

---

## 4. Entity design principles

All entities include:

```text
project = blastradius-v1
```

This is mandatory because Arkiv is shared storage and BlastRadius queries must be explicitly namespaced.

General rules:

- put fields used for filtering/range queries into attributes;
- keep verbose descriptions/evidence arrays in payload;
- numeric attributes are integers;
- use basis points for normalized fractional weights;
- use Unix seconds for timestamps stored as numeric attributes;
- use creator provenance for identity, not mutable owner;
- keep payloads compact enough for operational use;
- validate every Arkiv record as untrusted external input before domain use.

---

## 5. Entity: `DependencyEdge`

### 5.1 Meaning

A publisher declares:

> `dependent_id` depends on `dependency_id` under the described failure mode and evidence.

### 5.2 Indexed attributes

```ts
{
  project: "blastradius-v1",
  kind: "dependency_edge",
  edge_id: "protocol-a:borrow-eth-usdc->chainlink:eth-usd",

  dependent_id: "operation:protocol-a:base:eth-usdc:borrow",
  dependent_type: "operation",

  dependency_id: "oracle:chainlink:base:eth-usd",
  dependency_type: "oracle",

  protocol_id: "protocol-a",
  operation: "borrow",
  chain_id: 8453,

  criticality_bps: 9500,
  propagation_bps: 10000,

  version: 4,
  state: "active",
  effective_at: 1787364000,
  source_kind: "curator"
}
```

### 5.3 Payload

```json
{
  "name": "Protocol A borrow depends on ETH/USD oracle",
  "description": "Borrow health/account valuation requires the configured price feed.",
  "failureMode": "Borrowing may become unavailable or unsafe when price freshness exceeds protocol policy.",
  "fallback": {
    "exists": false,
    "description": null
  },
  "evidence": [
    {
      "type": "official_docs",
      "url": "https://example.org/official-doc",
      "description": "Official dependency documentation",
      "contentHash": "sha256:..."
    }
  ],
  "contractReferences": [
    {
      "chainId": 8453,
      "address": "0x...",
      "role": "oracle-adapter"
    }
  ],
  "declaredByLabel": "BlastRadius Curator"
}
```

`declaredByLabel` is display metadata only; actual publisher identity is Arkiv's immutable creator.

### 5.4 Criticality and propagation

`criticality_bps` answers:

> How important is this dependency to the dependent node under the modeled condition?

`propagation_bps` answers:

> How much of upstream health impairment should propagate through this edge given known fallback/isolation behavior?

Both range `0..10000`.

They must be justified in evidence/config review. They are not AI-generated confidence values.

### 5.5 Versioning

Rules:

- semantic change -> publish `version + 1`;
- removal -> publish `version + 1` with `state=removed`;
- do not delete prior versions merely because a relationship changed;
- unchanged long-lived edge may be extended before expiry if current Arkiv policy/SDK supports it and doing so does not alter meaning;
- malformed duplicate same-version entities require deterministic resolution + operator warning.

### 5.6 TTL

Suggested: ~30 days.

Why finite TTL?

Even dependency declarations can become abandoned. Renewal is an explicit assertion that the publisher still stands behind the relationship. At the same time, history remains available according to Arkiv's historical semantics and the active network's capabilities.

---

## 6. Entity: `HealthAssertion`

### 6.1 Meaning

A monitor creator declares:

> At `observed_at`, using `method_id` version `N`, I observed dependency `X` in state `Y` with these compact measurements/evidence.

### 6.2 Attributes

```ts
{
  project: "blastradius-v1",
  kind: "health_assertion",
  observation_id: "sha256:...",

  dependency_id: "sequencer:base",
  dependency_type: "sequencer",
  chain_id: 8453,

  state: "critical",
  severity: 91,
  confidence_bps: 9700,

  observed_at: 1787365120,
  observed_block: 34711289,

  safe_lag_sec: 612,
  block_gap_sec: 42,
  provider_count: 3,

  method_id: "sequencer-health-v1",
  method_version: 1
}
```

Method-specific attributes are optional but must remain integer and documented.

### 6.3 Payload

```json
{
  "summary": "Safe chain head has not progressed within the method's expected window.",
  "measurements": {
    "unsafeHead": 34711289,
    "safeHead": 34710871,
    "finalizedHead": 34710203,
    "providersAgreeing": 2,
    "providersTotal": 3
  },
  "evidence": {
    "algorithm": "sha256",
    "hash": "0x..."
  },
  "providerAgreement": {
    "agreeing": 2,
    "total": 3
  }
}
```

Do not publish secret provider URLs, tokens, or full raw logs.

### 6.4 TTL

Default design TTL: ~300 seconds.

**A HealthAssertion must never be extended.**

Why this matters:

- a claim represents one observation, not an indefinitely renewable status;
- if the monitor process disappears, its last claim expires;
- no central “mark monitor stale” cleanup write is required;
- live consensus naturally loses that creator when its claim is no longer current.

### 6.5 Publication cadence

Observation and publication are separate.

Example:

```text
observe every 15–30 sec
publish healthy heartbeat ~120 sec
publish degraded heartbeat 30–60 sec
publish immediately on material state transition
```

This keeps claims fresh without writing every raw sample.

---

## 7. Entity: `MonitorMethod`

### 7.1 Purpose

A health score is meaningless without methodology. `MonitorMethod` makes checks and thresholds inspectable.

### 7.2 Attributes

```ts
{
  project: "blastradius-v1",
  kind: "monitor_method",
  method_id: "sequencer-health-v1",
  dependency_type: "sequencer",
  version: 1,
  min_sources: 2,
  sample_interval_sec: 30
}
```

### 7.3 Payload

```json
{
  "name": "Sequencer / safe-head progression monitor",
  "description": "Compares chain head progression and provider agreement.",
  "checks": [
    "latest/unsafe head progression",
    "safe head progression",
    "finalized head progression",
    "safe-to-unsafe lag",
    "provider agreement"
  ],
  "thresholds": {
    "warningSafeLagSeconds": 120,
    "criticalSafeLagSeconds": 600
  },
  "limitations": [
    "RPC providers may share correlated upstream infrastructure.",
    "Thresholds describe this monitoring method, not universal protocol failure."
  ],
  "source": "repository://docs/methodologies/sequencer-health-v1.md"
}
```

### 7.4 Lifecycle

- TTL ~30 days;
- extend unchanged method only;
- semantic threshold/check change -> publish new method version;
- health assertions must reference exact method ID/version used at observation time.

---

## 8. Entity: `ProtocolResponse`

### 8.1 Purpose

Allows an authorized protocol publisher to publicly state its incident response without conflating that statement with independent monitor evidence.

### 8.2 Attributes

```ts
{
  project: "blastradius-v1",
  kind: "protocol_response",
  protocol_id: "protocol-a",
  dependency_id: "sequencer:base",
  chain_id: 8453,
  action: "disable_deposits",
  severity: 90,
  policy_version: 3,
  response_at: 1787365188
}
```

### 8.3 Payload

```json
{
  "message": "Deposits temporarily disabled in our frontend.",
  "affectedOperations": ["deposit", "borrow"],
  "fallback": null,
  "reference": "https://protocol.example/status/..."
}
```

### 8.4 Semantics

BlastRadius displays:

> `Protocol A publisher states: deposits disabled.`

It should not transform that into:

> `BlastRadius verified deposits are disabled.`

unless a separate deterministic verification check exists and is clearly labeled.

---

## 9. Creator provenance vs owner

Arkiv exposes creator and owner metadata.

BlastRadius uses **immutable creator** for publisher attribution because ownership can change.

Trust decision:

```ts
const classification = trustPolicy.classify(entity.creator, entityKind, scope)
```

not:

```ts
trustPolicy.classify(entity.owner)
```

Owner may be shown in proof views if relevant but must not silently replace creator identity.

---

## 10. Trust registry

Launch trust policy is repository-managed and versioned.

```yaml
version: 1
policyId: blastradius-trust-v1
publishers:
  - name: monitor-base-a
    address: "0x111..."
    enabled: true
    roles: [monitor]
    scopes:
      dependencies:
        - "sequencer:base"
      methods:
        - "sequencer-health-v1"

  - name: curator-core
    address: "0x222..."
    enabled: true
    roles: [curator]
    scopes:
      dependencyTypes:
        - chain_environment
        - sequencer
        - oracle
        - rpc
        - protocol
        - market
        - operation

  - name: protocol-a
    address: "0x333..."
    enabled: true
    roles: [protocol]
    scopes:
      protocols: [protocol-a]
```

Rules:

- fail closed;
- checksum the parsed policy;
- expose active policy version in API metadata;
- log rejected creator + reason without treating rejection as application crash;
- emergency disable is operationally possible without deleting Arkiv data;
- do not quietly expand scopes because an entity looks plausible.

---

## 11. Current-health query pattern

Conceptual SDK query:

```ts
const result = await publicClient
  .select({
    key: true,
    creator: true,
    payload: true,
    attributes: true,
    expiresAtBlock: true,
    createdAtBlock: true,
  })
  .where(
    eq("project", "blastradius-v1"),
    eq("kind", "health_assertion"),
    eq("dependency_id", "sequencer:base")
  )
  .limit(pageSize)
  .fetch();
```

Adapter must paginate if more pages exist.

Application then:

1. validates schema;
2. checks trusted creator and scope;
3. groups by creator;
4. selects newest valid assertion per creator;
5. computes agreement/aggregate health.

Do not use entity count directly as monitor quorum.

---

## 12. Direct dependent query pattern

Conceptual:

```ts
where(
  eq("project", "blastradius-v1"),
  eq("kind", "dependency_edge"),
  eq("dependency_id", currentDependencyId)
)
```

Resolve current edge versions after fetching. Because Arkiv is not responsible for arbitrary graph joins, traversal remains in BlastRadius.

---

## 13. Historical graph reconstruction

Architecture goal:

> Given an Arkiv block associated with an incident, reconstruct the graph/claims valid at that block.

Current Arkiv documentation exposes historical query concepts such as SDK `validAtBlock()` / JSON-RPC `atBlock`.

Implementation rules:

- do not expose a production historical UI until tested against the active network/SDK;
- when enabled, use the same project/type/trust filters at the historical block;
- resolve edge versions valid at that block;
- preserve method versions referenced by health assertions;
- label historical output with exact Arkiv block and query timestamp;
- never use today's trust policy silently for historical forensic claims without indicating that policy choice; support policy-version context when feasible.

---

## 14. Reverse traversal algorithm

Simplified pseudocode:

```ts
async function calculateBlastRadius(rootId: string, limits: GraphLimits) {
  const queue: TraversalItem[] = [{ nodeId: rootId, path: [rootId], score: rootSeverity }];
  const visitedBestScore = new Map<string, number>();
  const affected = new Map<string, AffectedNode>();

  while (queue.length > 0) {
    assertWithinDeadline();
    assertWithinTraversalLimits();

    const current = queue.shift()!;

    const previousBest = visitedBestScore.get(current.nodeId);
    if (previousBest !== undefined && previousBest >= current.score) continue;
    visitedBestScore.set(current.nodeId, current.score);

    const rawEdges = await edgeRepository.findCurrentDependents(current.nodeId);
    const edges = resolveCurrentTrustedEdges(rawEdges);

    for (const edge of edges) {
      if (current.path.includes(edge.dependentId)) {
        recordCycle(edge, current.path);
        continue;
      }

      const nextScore = propagate(current.score, edge);
      const nextPath = [...current.path, edge.dependentId];

      recordAffected(affected, edge, nextScore, nextPath);

      if (edge.dependentType !== "operation") {
        queue.push({ nodeId: edge.dependentId, path: nextPath, score: nextScore });
      }
    }
  }

  return buildResult(affected);
}
```

Production implementation should avoid one Arkiv network query per edge when possible. Fetch/resolved adjacency data in bounded batches or build a short-lived current graph index, then traverse in memory.

---

## 15. Graph index strategy

For launch scale, the API can periodically build a current adjacency index from Arkiv:

```ts
interface GraphIndex {
  fingerprint: string;
  builtAt: number;
  edgesByDependency: Map<string, ResolvedDependencyEdge[]>;
  nodeMetadata: Map<string, NodeMetadata>;
}
```

Properties:

- reconstructable from Arkiv;
- short TTL/invalidation;
- never authoritative over source entities;
- trust-policy-aware;
- fingerprint based on resolved entity keys/versions/creators;
- bounded memory.

On Arkiv read failure, do not silently treat an old index as current. If bounded stale operation is enabled, surface `stale=true`, age, and inability to confirm current state.

---

## 16. Exposure score

Start root severity at integer `0..100`.

Per edge:

```ts
function propagate(score: number, edge: Edge): number {
  return Math.round(
    score * edge.criticalityBps / 10_000 * edge.propagationBps / 10_000
  );
}
```

For critical deterministic calculations, an integer helper should avoid repeated floating precision artifacts.

Example:

```text
root severity             = 90
edge criticality          = 8000 bps
edge propagation          = 10000 bps
next score                = 72
```

Multiple paths reaching one operation:

```text
primary blast score = max(path scores)
pathCount           = count of retained materially distinct paths
alternatePaths      = top N bounded by config
```

Do not imply score is loss probability.

---

## 17. Evidence model

Accepted evidence types might include:

- `official_docs`
- `official_contract`
- `official_repository`
- `protocol_governance`
- `official_status_page`
- `verified_operator_statement`

Each evidence item should contain:

```ts
interface EvidenceReference {
  type: EvidenceType;
  url?: string;
  chainId?: number;
  address?: string;
  description: string;
  contentHash?: string;
  capturedAt?: number;
}
```

Do not fetch arbitrary evidence URLs server-side on user demand. Evidence ingestion/reverification jobs require SSRF protections and allowlisting/policy.

---

## 18. Monitor evidence hashing

Canonicalize a safe subset:

```text
method + methodVersion + dependencyId + observedAt + normalizedMeasurements
```

Then hash.

Raw response bodies may remain ephemeral/log-restricted if needed for debugging, but must not contain secrets and need not be written to Arkiv.

The hash lets BlastRadius demonstrate that the compact published assertion corresponds to a deterministic evidence summary known at observation time, without claiming Arkiv independently verified the upstream RPC responses.

---

## 19. Data lifecycle matrix

| Entity | Typical TTL | Extend? | New version/write when | Live-resolution behavior |
|---|---:|---|---|---|
| DependencyEdge | ~30 days | Yes, if semantically unchanged | dependency semantics change/removal | latest trusted version per publisher/namespace |
| HealthAssertion | ~300 sec | **Never** | every publication heartbeat/state change | newest active trusted assertion per creator |
| MonitorMethod | ~30 days | Yes, unchanged | checks/thresholds/meaning change | exact referenced version + latest for browse |
| ProtocolResponse | 6h–7d | Normally publish newer response | response/action meaning changes | latest valid trusted response, history preserved |

---

## 20. What does not belong on Arkiv

Do not write:

- raw high-volume RPC logs;
- every 15-second sample if not publication-worthy;
- authentication credentials;
- private keys;
- user transaction bodies/calldata;
- private incident chat;
- large historical time series;
- cache entries;
- internal queue state;
- frontend preferences;
- automatic action execution state.

The Arkiv layer remains compact and legible.

---

## 21. Protocol response vs independent evidence

Incident page should display independent panes:

```text
[ OBSERVERS ]
Monitor A   CRITICAL   48s ago
Monitor B   CRITICAL   31s ago
Monitor C   HEALTHY    44s ago

[ PROTOCOL RESPONSE ]
Protocol A creator wallet
"Deposits temporarily disabled in frontend."
```

A protocol cannot overwrite/delete another monitor's assertion. A monitor cannot impersonate a trusted protocol publisher under the trust policy merely by choosing a protocol-like label.

---

## 22. Unknown/unavailable semantics

The graph and health layers must never collapse these cases:

### `healthy`

Enough trusted current evidence exists and indicates expected operation under the method.

### `unknown`

Current evidence is insufficient or materially split.

### `unavailable`

BlastRadius could not read required source data or Arkiv data to determine current state.

### `no modeled dependency`

The current trusted graph does not contain an edge. This is not proof the real-world dependency does not exist.

The API/UI should say:

> `No verified dependency is currently modeled.`

not:

> `No dependency exists.`

---

## 23. Arkiv outage behavior

### Reads fail

- graph/health endpoint emits typed failure or explicitly stale bounded result;
- dashboard status becomes data-unavailable, not healthy;
- readiness/metrics reflect outage;
- preserve last-success timestamps only for operator context.

### Writes fail

- monitor records observation failure-to-publish separately from dependency health;
- retry safely;
- reconcile unknown transaction outcome before duplicate retry;
- old assertions expire naturally, reducing visible monitor coverage;
- alert on coverage/publication lag.

This distinction is essential: **failure to publish is not evidence that the monitored dependency is healthy or unhealthy.**

---

## 24. Query/result completeness

Every internal repository method that can be partial must make completeness explicit:

```ts
interface BoundedResult<T> {
  items: T[];
  complete: boolean;
  truncatedReason?: 'max_pages' | 'max_records' | 'deadline';
}
```

Blast-radius response must propagate `complete=false` if any required edge query/index was incomplete.

The web UI must show `[PARTIAL RESULT]` and explain why.

---

## 25. Example complete incident flow

```text
T+00:00
All three trusted Base-sequencer monitor creators have current HEALTHY claims.

T+00:20
Real RPC reads show safe-head lag crossing a warning threshold.
Monitor A observes DEGRADED.

T+00:27
Monitor B independently observes DEGRADED.

T+00:30
A and B publish fresh HealthAssertions to Arkiv.

T+00:35
API query resolves:
- A -> DEGRADED
- B -> DEGRADED
- C -> HEALTHY
Result: majority degraded; disagreement visible.

T+00:36
Graph index identifies reverse paths:
sequencer:base
 -> chain:base
 -> oracle adapter / protocol components
 -> operations such as borrow/withdraw

T+00:37
Incident UI displays impacted protocols/operations and top paths.

T+01:10
Authorized Protocol A wallet publishes ProtocolResponse:
`disable_deposits`.

T+01:12
UI shows response separately from independent monitor claims.

T+03:00
Monitor C is stopped for testing and publishes nothing further.

T+~08:00
Its last short-lived assertion expires. Live quorum now has two active trusted creators; no cleanup mutation was required.
```

The final step demonstrates why semantic expiry is a core product feature rather than decorative storage TTL.

---

## 26. Data-model validation rules

Reject at ingest/use time:

- wrong/missing `project`;
- unsupported `kind`;
- invalid semantic ID;
- bps outside `0..10000`;
- severity outside `0..100`;
- non-integer numeric query attributes;
- version < 1;
- invalid edge self-reference where not explicitly allowed;
- dependency/ dependent type mismatch;
- unknown health state;
- health assertion referencing unknown/invalid method format;
- evidence arrays beyond configured size;
- payload beyond configured application size budget;
- untrusted creator for trusted calculation;
- publisher scope mismatch;
- unreasonable future `observed_at` beyond clock-skew policy;
- malformed addresses.

Invalid Arkiv data is skipped/quarantined with metrics, not allowed to crash an entire public query.

---

## 27. Architectural invariants summary

```text
Arkiv stores claims and declarations.
BlastRadius computes interpretation.
Creator attribution is immutable.
Trust remains application policy.
Short-lived health claims expire.
One creator = one quorum vote.
Edges are versioned, not destructively rewritten.
Conflicts remain visible.
Traversal is bounded and off Arkiv.
Redis can disappear without becoming the historical source of truth.
No upstream data means UNKNOWN/UNAVAILABLE, never fake HEALTHY.
No automatic DeFi execution.
```
