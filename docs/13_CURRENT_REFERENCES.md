# BlastRadius — Current External References (25 August 2026)

This is a convenience index, not a replacement for re-verifying current docs during implementation.

## Arkiv

- Official documentation: https://docs.arkiv.network/
- Installation / current network warning: https://docs.arkiv.network/start-here/installation/
- Official Ideathon repository: https://github.com/Arkiv-Network/arkiv-ideathon
- Official JS/TS SDK repository: https://github.com/Arkiv-Network/arkiv-sdk-js
- Official agent skills repository: https://github.com/Arkiv-Network/skills
- Ideathon MCP: https://ideathon-mcp.arkiv.network/api/mcp

### Verified at bundle completion

Official Arkiv documentation stated that Braga was retired on 12 August 2026, no public network was currently available, a limited devnet was available through August, and the next public testnet was expected in September 2026.

The official Arkiv skills repository listed `arkiv-best-practices` for SDK/entities/attributes/queries/expiration and documented installation through the `skills` CLI.

The official Ideathon repository described the August 2026 challenge, DeFi off-hot-path framing, data-model/query emphasis, and the Agent Guide/MCP workflow.

## Re-verification policy

Before Codex writes Arkiv integration code or deployment configuration, it must re-check:

- current network status;
- current `@arkiv-network/sdk` version/API;
- query/filter/pagination semantics;
- creator/owner semantics;
- expiration/extension semantics;
- historical-query availability;
- current MCP/skill instructions.

The pre-mainnet ecosystem is moving quickly; source code and docs at implementation time override static network constants in this bundle.

