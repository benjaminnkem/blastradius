# Arkiv Compatibility

Verified at: 2026-08-25T14:10:00Z  
SDK pinned: `@arkiv-network/sdk@0.7.0` (npm `latest`)  
viem pinned: `2.55.19` (peer of the SDK: `^2.0.0`)  
Network: **none public**

## Network availability

| Fact | Status | Source |
|---|---|---|
| Braga retired 23:59 CET on 12 August 2026 | Confirmed | https://docs.arkiv.network/ , https://docs.arkiv.network/networks/braga/ |
| No public RPC / faucet / explorer | Confirmed | docs home + installation caution |
| Limited experimental devnet in August, access via Discord | Confirmed | docs, Ideathon MCP `network-and-roadmap` |
| Next public testnet expected September 2026 | Confirmed | docs, https://arkiv.network/roadmap |
| Do not hard-code Braga | Binding | BlastRadius AGENTS.md + official retirement page |

Official Braga reference (retired — **do not use as defaults**):

- Chain ID `60138453102`
- Historical RPC `https://braga.hoodi.arkiv.network/rpc` (offline for product use)

`status.arkiv.network` still listed Braga as “Operational” on 25 August 2026. That contradicts the documentation retirement notice. **Docs + MCP roadmap win; do not treat the status page as proof that Braga is usable.**

## SDK vs docs contradictions (recorded, not resolved by guessing)

1. **npm `latest` is `0.7.0`.** GitHub `develop` is `0.8.0-dev.2` (`dev` dist-tag). Phase 0 pins **0.7.0**. Phase 2 must re-check before writing adapter code.
2. **Installation docs still import `braga` from `@arkiv-network/sdk/chains`.** The develop-branch SDK exports `cheesecake` and `localhost` only (`src/chains/index.ts`). BlastRadius must construct clients from **runtime env** (`ARKIV_RPC_URL`, `ARKIV_CHAIN_ID`), never from a hard-coded chain export.
3. **Develop-branch `cheesecake`** (not used, not defaulted):
   - chain id `7733102`
   - RPC `https://rpc.cheesecake.db-chain.devnet.gobas.me`
   - This looks like a private/devnet host, is **not** documented as a public testnet, and must not be committed as a product default.
4. **Query API:** current docs + `arkiv-best-practices` skill (0.7.0+) use `select().where().limit().fetch()`. Ideathon MCP `arkiv-fundamentals` still mentions `buildQuery()` in a sketch. Prefer official docs/skill (`select`) at implementation time; re-verify against the installed SDK in Phase 2.
5. **`orderBy` / `asc` / `desc`:** deprecated no-ops since 0.7.0. Sort application-side. Matches BlastRadius invariants.
6. **Entity change events:** MCP fundamentals say the SDK **polls**, it does not push. Subscriptions are not a Phase 0/2 requirement.

## Verified SDK/docs behavior (not yet exercised on a live network)

| Behavior | Docs/SDK claim | Live verification |
|---|---|---|
| Client construction from chain + `viem` `http()` | Documented | **UNAVAILABLE** — no public network |
| `createEntity` / `getEntity` | Documented | UNAVAILABLE |
| `select()` + `eq/gt/lt/gte/lte` + `and/or` | Documented | UNAVAILABLE |
| `createdBy()` / `ownedBy()`; select `creator` vs `owner` | Documented; `$creator` immutable | UNAVAILABLE |
| Numeric attributes must be integers | Documented; `InvalidAttributeError` | UNAVAILABLE |
| `expiresIn` seconds, positive multiple of 2 (2s blocks); `ExpirationTime` helpers | Documented; `InvalidExpirationError` | UNAVAILABLE |
| `extendEntity` | Documented | UNAVAILABLE — BlastRadius must still refuse to extend `HealthAssertion` |
| Cursor pagination; max **200** results/page; `hasNextPage()` / `next()` | Documented | UNAVAILABLE |
| Newest-first only; no server-side order | Documented | UNAVAILABLE |
| JSON-RPC `atBlock` historical query | Documented on JSON-RPC querying page | **Feature-gated** until SDK+network test |
| SDK `validAtBlock()` helper | Not confirmed on current querying-data page | **UNAVAILABLE / gated** |
| `localhost` chain export id `1337` at `http://127.0.0.1:8545` | develop SDK source | Not an official “run Arkiv locally” guide; Phase 2 must not assume it is a full DB-chain |

## BlastRadius implications

- Every entity and query uses `project=blastradius-v1` (or a test suffix).
- Trust classification uses **immutable creator**, never owner.
- Health assertions: short TTL (design ~300s, even), **never extend**.
- Pagination must be bounded; truncated reads cannot be reported as complete.
- No in-memory Arkiv stand-in. If the network is missing, Phase 2 is **BLOCKED**.

## MCP / skills used this phase

- Ideathon MCP `https://ideathon-mcp.arkiv.network/api/mcp` — tools `list_tracks`, `get_doc`, `search_kb`, `review_my_idea`. Docs fetched: `network-and-roadmap`, `arkiv-fundamentals`.
- Official skill `arkiv-best-practices` installed project-locally at `.agents/skills/arkiv-best-practices`.

## Phase 2 Implementation Status (2026-08-25)

The production Arkiv adapter (`packages/arkiv`) has been fully implemented in strict adherence to SDK 0.7.0 and repository invariants:

1. **Client Construction (`src/client.ts`)**: `createArkivPublicClient` and `createArkivWalletClient` construct `viem` `Chain` definitions dynamically from validated `ArkivRuntimeConfig`. Zero hard-coded network constants exist in the codebase.
2. **Normalized Readers (`src/reader.ts`)**: `ArkivReader` provides type-safe queries for `DependencyEdge`, `HealthAssertion`, `MonitorMethod`, and `ProtocolResponse`. Every query is namespaced with `project = blastradius-v1` and selects immutable `$creator`, `$owner`, blocks, attributes, and payload.
3. **Cursor Pagination Engine (`src/reader.ts`)**: Bounded pagination with `maxPages`, `maxRecords`, `AbortSignal` deadlines, and cursor-loop detection returning `BoundedResult` completeness metadata.
4. **Normalized Writers (`src/writer.ts`)**: `ArkivWriter` publishes all 4 entity types, serializes JSON payloads, maps integer attributes, and enforces a hard domain invariant refusing to extend `HealthAssertion` entities (`HealthAssertionCannotBeExtendedError`).
5. **Typed Domain Errors (`src/errors.ts`)**: Distinguishes `ArkivQueryUnavailableError` (retryable), `ArkivWriteRejectedError` (non-retryable), and `ArkivWriteUnknownError` (reconciliation required).
6. **Historical Query Feature Gate (`src/historical.ts`)**: `isHistoricalQuerySupported()` returns `false` and `listHealthAssertionsAtBlock()` throws `ArkivHistoricalQueryNotSupportedError` until verified on live testnet.

## Real Integration Gate Status: BLOCKED

As documented above:
- No public testnet exists (Braga retired August 12, 2026; next public testnet September 2026).
- No live RPC endpoint or funded private devnet wallet credentials are configured in `.env`.
- Per `AGENTS.md` truthfulness policy, **no in-memory mock or fake Arkiv server** is permitted in production code paths.
- The unit test suite (`packages/arkiv/src/*.test.ts`) verifies all client factory, schema mapping, lifecycle guards, and error translation logic deterministically.
- **Access required to unblock real integration test**: Authorized Arkiv devnet credentials (`ARKIV_RPC_URL`, `ARKIV_CHAIN_ID`, isolated private key) via [Arkiv Discord](https://discord.gg/arkiv).

