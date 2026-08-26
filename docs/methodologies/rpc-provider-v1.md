# Methodology: RPC Provider Health (`rpc-provider-v1`)

- **Method ID**: `rpc-provider-v1`
- **Method Version**: `1`
- **Target Dependency**: RPC Endpoint Cluster (e.g. `rpc:base`, `rpc:ethereum`)
- **Published Entity Kind**: `health_assertion`
- **Publication Namespace**: `blastradius-v1`

---

## 1. Overview and Model

The RPC provider monitor measures the availability, latency, block progression, and agreement across multiple independently configured RPC endpoints for a target network.

A single RPC endpoint failure does not imply chain failure, but degrades redundancy. All observations explicitly reflect responding provider count and coverage.

---

## 2. Measurement Definitions

| Measurement | Type | Unit | Description |
| :--- | :--- | :--- | :--- |
| `totalProviders` | integer | count | Number of configured RPC endpoints. |
| `respondingProviders` | integer | count | Number of endpoints that returned valid responses within the timeout. |
| `availabilityBps` | integer | bps | Proportion of healthy endpoints in basis points ($0..10000$). |
| `avgLatencyMs` | integer | ms | Average response latency across responding endpoints. |
| `maxLatencyMs` | integer | ms | Highest latency observed among responding endpoints. |
| `headBlock` | integer | block | Highest latest block number observed. |
| `headLag` | integer | block | Max block divergence between responding endpoints. |
| `blockAgreement` | boolean | bool | `true` if all responding endpoints are within 2 blocks of each other. |

---

## 3. Health State and Severity Derivation

```text
IF respondingProviders == 0:
  state = "unavailable"
  severity = 100
  confidenceBps = 10000

ELSE IF availabilityBps < 5000:
  state = "critical"
  severity = 80
  confidenceBps = 9000

ELSE IF avgLatencyMs > latencyThresholdMs * 2 OR headLag > 5 OR blockAgreement == false:
  state = "degraded"
  severity = 65
  confidenceBps = 8500

ELSE IF avgLatencyMs > latencyThresholdMs OR availabilityBps < 10000:
  state = "watch"
  severity = 30
  confidenceBps = 9500

ELSE:
  state = "healthy"
  severity = 0
  confidenceBps = 10000
```
