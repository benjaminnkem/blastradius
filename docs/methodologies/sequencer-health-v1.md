# Methodology: Sequencer Health Progression (`sequencer-health-v1`)

- **Method ID**: `sequencer-health-v1`
- **Method Version**: `1`
- **Target Dependency**: Rollup / L2 Sequencer (e.g. `sequencer:base`, chain ID `8453`)
- **Published Entity Kind**: `health_assertion`
- **Publication Namespace**: `blastradius-v1`

---

## 1. Overview and Model

L2 rollups such as Base produce blocks on a fast interval (2 seconds). Block progression operates through two distinct layers:
1. **Unsafe / Latest Head**: Blocks produced directly by the sequencer and streamed to consensus peers.
2. **Safe / Finalized Head**: Blocks that have been batched, posted to the L1 data availability layer (Ethereum), and validated by the rollup node.

A healthy sequencer demonstrates:
- Continuous advancement of the unsafe head close to the host real-time clock.
- Timely batch submission on L1 keeping the safe head lag bounded within normal batch intervals (typically < 120s on Base).
- Consistent block number and timestamp reporting across independent RPC providers.

---

## 2. Measurement Definitions

For an observation cycle executed across $N$ independently configured RPC endpoints:

| Measurement | Type | Unit | Description |
| :--- | :--- | :--- | :--- |
| `headBlock` | integer | block | Highest latest block number observed across responding providers. |
| `headTimestamp` | integer | unix sec | Timestamp of `headBlock`. |
| `safeBlock` | integer | block | Highest safe block number observed. |
| `safeTimestamp` | integer | unix sec | Timestamp of `safeBlock`. |
| `finalizedBlock` | integer | block | Highest finalized block number observed. |
| `blockGapSec` | integer | seconds | $\max(0, T_{\text{host}} - T_{\text{head}})$ — elapsed time between current host clock and the newest block timestamp. |
| `safeLagSec` | integer | seconds | $\max(0, T_{\text{head}} - T_{\text{safe}})$ — time difference between latest block and safe block. |
| `providerCount` | integer | count | Number of RPC providers that responded successfully within the per-request timeout. |
| `providerAgreement` | boolean | bool | `true` if all responding providers are within 2 blocks of each other; `false` otherwise. |
| `latencyMs` | integer | ms | Average response latency across responding providers. |

---

## 3. Health State and Severity Derivation

### Severity Scale (0 to 100)
- `0`: Completely healthy.
- `1..49`: Watch / minor latency or single-provider blip.
- `50..79`: Degraded / delayed batching or multiple missed blocks.
- `80..100`: Critical / sequencer halt or complete RPC outage.

### Decision Table

```text
IF providerCount == 0:
  state = "unavailable"
  severity = 100
  confidenceBps = 10000

ELSE IF blockGapSec > maxBlockGapSec (default 60s):
  state = "critical"
  severity = min(100, 80 + min(20, round((blockGapSec - 60) / 3)))
  confidenceBps = (providerCount > 1 && providerAgreement) ? 10000 : 7000

ELSE IF safeLagSec > criticalSafeLagSec (default 600s):
  state = "critical"
  severity = min(100, 80 + min(20, round((safeLagSec - 600) / 30)))
  confidenceBps = 9000

ELSE IF blockGapSec > 15s OR safeLagSec > warningSafeLagSec (default 120s) OR providerAgreement == false:
  state = "degraded"
  severity = max(60, min(79, round(blockGapSec * 2)))
  confidenceBps = (providerCount > 1) ? 9000 : 6000

ELSE IF blockGapSec > 8s:
  state = "watch"
  severity = 30
  confidenceBps = 10000

ELSE:
  state = "healthy"
  severity = 0
  confidenceBps = (providerCount > 1) ? 10000 : 8000
```

---

## 4. Evidence Canonicalization and Privacy

The monitor constructs an evidence JSON payload containing:
- Target chain ID and dependency ID.
- Sanitized provider list (URL query strings and auth tokens stripped).
- Response blocks, timestamps, and latencies.
- Observation timestamp.

The evidence is hashed using SHA-256 (`keccak256` or `sha256`), and the hash is committed in the `evidence` field of the `HealthAssertion` entity. No secret keys or authentication headers are stored.
