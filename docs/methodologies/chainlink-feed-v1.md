# Methodology: Chainlink AggregatorV3 Price Feed (`chainlink-feed-v1`)

- **Method ID**: `chainlink-feed-v1`
- **Method Version**: `1`
- **Target Dependency**: Oracle Price Feed (e.g. `chainlink:eth-usd:8453`, `chainlink:usdc-usd:8453`)
- **Published Entity Kind**: `health_assertion`
- **Publication Namespace**: `blastradius-v1`

---

## 1. Overview and Model

Chainlink AggregatorV3 contracts expose decentralized price reference feeds on Ethereum and L2 rollups. Feeds update when:
1. **Heartbeat Time Elapsed**: The configured maximum time between updates has passed.
2. **Deviation Threshold Reached**: Asset price moves beyond the configured deviation percentage (e.g. 0.5%).

The monitor calls `latestRoundData()` on the official AggregatorV3 contract:
```solidity
function latestRoundData() external view returns (
    uint80 roundId,
    int256 answer,
    uint256 startedAt,
    uint256 updatedAt,
    uint80 answeredInRound
);
```

---

## 2. Measurement Definitions

| Measurement | Type | Unit | Description |
| :--- | :--- | :--- | :--- |
| `answer` | number / string | formatted price | Formatted asset price scaled by feed decimals. |
| `rawAnswer` | string | integer | Raw `int256` answer from contract. |
| `updatedAt` | integer | unix sec | Timestamp of the latest round update. |
| `roundId` | string | uint80 | Current round ID. |
| `answeredInRound` | string | uint80 | Round ID in which the answer was computed. |
| `stalenessSec` | integer | seconds | $\max(0, T_{\text{host}} - \text{updatedAt})$ — elapsed time since last on-chain update. |
| `heartbeatSec` | integer | seconds | Documented official heartbeat period for the feed. |
| `isHeartbeatViolated` | boolean | bool | `true` if `stalenessSec > heartbeatSec`; `false` otherwise. |
| `isRoundValid` | boolean | bool | `true` if `answeredInRound >= roundId && updatedAt > 0 && answer > 0`. |
| `latencyMs` | integer | ms | Average RPC response latency for the contract read. |

---

## 3. Health State and Severity Derivation

```text
IF all RPC reads fail/timeout:
  state = "unavailable"
  severity = 100
  confidenceBps = 10000

ELSE IF isRoundValid == false OR rawAnswer <= 0 OR updatedAt == 0:
  state = "critical"
  severity = 100
  confidenceBps = 10000

ELSE IF stalenessSec > heartbeatSec * 2:
  state = "critical"
  severity = min(100, 80 + min(20, round(((stalenessSec - heartbeatSec * 2) / heartbeatSec) * 20)))
  confidenceBps = 9500

ELSE IF stalenessSec > heartbeatSec:
  state = "degraded"
  severity = max(60, min(79, 60 + round(((stalenessSec - heartbeatSec) / heartbeatSec) * 20)))
  confidenceBps = 9000

ELSE IF stalenessSec > heartbeatSec * 0.85:
  state = "watch"
  severity = 30
  confidenceBps = 10000

ELSE:
  state = "healthy"
  severity = 0
  confidenceBps = 10000
```

---

## 4. Evidence Canonicalization and Privacy

The monitor records:
- Feed address, chain ID, and dependency ID.
- Contract return values (`roundId`, `answer`, `updatedAt`, `answeredInRound`).
- Configured heartbeat and calculated staleness.
- Sanitized RPC endpoints queried.

The canonical evidence is hashed with SHA-256 and committed with the HealthAssertion entity.
