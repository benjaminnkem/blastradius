# BlastRadius — Arkiv MCP, Agent Skills, and Current References

This file tells Codex exactly how to ground implementation decisions in current Arkiv sources instead of stale memory.

## 1. Critical current network fact

As of **25 August 2026**, Arkiv's official docs state:

- Braga was retired at 23:59 CET on 12 August 2026.
- There is currently no public Arkiv network/RPC/faucet/explorer.
- A limited devnet is running through August and access can be requested through Arkiv's official community channel.
- The next public testnet is expected in September 2026.

Therefore the repository must never hard-code Braga constants or assume an always-available public testnet.

## 2. Official Arkiv Ideathon MCP

The Arkiv Ideathon provides a read-only MCP server intended to give agents current event/product context:

```text
https://ideathon-mcp.arkiv.network/api/mcp
```

The official ideathon materials describe tools such as:

- `list_tracks`
- `get_doc`
- `search_kb`

and a review workflow/tool named `review_my_idea`.

### How Codex should use it

At Phase 0:

1. Connect the Arkiv Ideathon MCP using Codex's **current** MCP configuration workflow.
2. Read the current DeFi track guidance, scoring rubric, and Arkiv data-model guidance.
3. Query specifically for entity lifecycle, expiration, creator provenance, queries, and off-hot-path DeFi guidance.
4. Record source links/dated facts in `docs/arkiv-compatibility.md`.

At Phase 13:

- run `review_my_idea` against the final BlastRadius framing/data model;
- treat feedback as a review input, not an instruction to override verified SDK/docs/production architecture.

### Important MCP rule

Do **not** freeze a copied Codex configuration snippet into this handoff because Codex MCP configuration syntax can evolve. Codex should consult its current product docs/help and add the server using the supported mechanism at implementation time. The required server URL above is the stable project input.

## 3. Official Arkiv agent skill

Arkiv publishes an official skills repository. The most important skill for BlastRadius is:

```text
arkiv-best-practices
```

It covers SDK usage, entities, attributes, queries, and expiration.

Official installation examples currently documented by Arkiv include:

```bash
npx skills add https://github.com/Arkiv-Network/skills --skill arkiv-best-practices
```

or:

```bash
pnpm dlx skills add https://github.com/Arkiv-Network/skills --skill arkiv-best-practices
```

Codex should install it **project-locally** when its current environment supports compatible skills. Do not install arbitrary community skills just to increase agent capability.

The Arkiv repository also lists `arkiv-feedback`; that skill is not necessary to build BlastRadius unless a real Arkiv SDK/platform bug must be reported.

## 4. Required official sources to re-read

Codex must prefer official Arkiv docs/repositories over blog posts and stale examples.

Canonical starting points:

- Arkiv docs home: `https://docs.arkiv.network/`
- Installation/current SDK setup: `https://docs.arkiv.network/start-here/installation/`
- Arkiv Ideathon repo: `https://github.com/Arkiv-Network/arkiv-ideathon`
- Arkiv SDK JS repo: `https://github.com/Arkiv-Network/arkiv-sdk-js`
- Arkiv skills repo: `https://github.com/Arkiv-Network/skills`

Codex should locate the current official pages for:

- fundamentals/entity model;
- query builder/filter semantics;
- creator vs owner;
- expiration/extension;
- pagination/cursors;
- historical query (`validAtBlock`/equivalent) if still supported;
- wallet/public client creation;
- payload encoding;
- network status;
- SDK version compatibility.

## 5. Facts BlastRadius depends on and must verify

Before implementation, verify each item and record `verified_at`, source URL, SDK version, and notes:

| Fact | Why it matters |
|---|---|
| Entity has immutable creator metadata | Publisher attribution and quorum |
| Owner may differ/change | Never confuse owner with creator |
| String/numeric attribute filter semantics | Query design |
| Arkiv numeric attributes are integer-compatible | bps/severity/version design |
| Entity expiration semantics | HealthAssertion freshness |
| Extension API and restrictions | Edge/method lifecycle |
| Pagination maximum/cursor behavior | Bounded reads |
| Historical query support | Incident reconstruction |
| SDK wallet/public client construction | Runtime adapter |
| Network chain/RPC values | Real integration |
| Block cadence / TTL constraints if any | Valid assertion TTL |

If current docs contradict this bundle, Codex should stop that affected implementation decision, cite the newer official source, update compatibility docs, and make the narrowest architecture adjustment that preserves product invariants.

## 6. Recommended non-Arkiv MCP/tooling

These are **optional accelerators**, not architecture dependencies.

### Playwright

Use Playwright's normal test runner as a required code dependency. If Codex has an official/current browser automation MCP available, it may use it interactively for UI inspection, but automated regression tests must still be committed as Playwright tests in the repository.

### shadcn/ui

Use the official shadcn CLI/component registry as normal development tooling. An MCP is not required. BlastRadius's design tokens must override generic shadcn aesthetics; do not let generated components introduce rounded corners or non-monospace typography.

### GitHub

GitHub integration is useful for PR/issues/CI but is not required to implement local product behavior. Do not grant write access to unrelated repositories.

### Image generation

A production image-generation capability is useful only for creating landing-page assets described in `10_LANDING_ASSET_GENERATION.md`. Generated assets must be committed/served as static optimized images; the app must not call an image-generation API at runtime just to render the landing page.

## 7. Skills/MCP permission policy

Only add a tool when it has a concrete purpose. Before adding any skill/MCP:

1. identify the exact phase/task it assists;
2. prefer official publisher;
3. inspect permissions/data access;
4. avoid giving secrets/repo write access when read-only is sufficient;
5. record the tool in `HANDOFF.md`;
6. ensure the build/test remains reproducible without an interactive MCP session.

The product must not depend on an agent tool being online at runtime.

## 8. `docs/arkiv-compatibility.md` template

Codex should create/update a repository file like:

```md
# Arkiv Compatibility

Verified at: YYYY-MM-DDTHH:mm:ssZ
SDK: @arkiv-network/sdk x.y.z
Network: <name>
RPC: <redacted/public endpoint>
Chain ID: <id>

## Verified behavior
- client construction: PASS/FAIL
- create entity: PASS/FAIL
- project/kind query: PASS/FAIL
- creator metadata: PASS/FAIL
- numeric filters: PASS/FAIL
- pagination: PASS/FAIL
- extension: PASS/FAIL
- expiration: PASS/FAIL
- historical query: PASS/FAIL/UNAVAILABLE

## Source URLs
- ...

## Deviations from handoff assumptions
- ...
```

## 9. Current-source note for this handoff

This bundle was completed on 25 August 2026 using the then-current official Arkiv docs and Arkiv-Network GitHub materials. Network/SDK facts are intentionally treated as re-verifiable because Arkiv is pre-mainnet and changing quickly.

