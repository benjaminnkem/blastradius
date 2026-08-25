import { describe, expect, it } from "vitest";
import type { DependencyEdgeRecord, TrustPolicy } from "@blastradius/schemas";
import { resolveCurrentEdges } from "./edges.js";

describe("resolveCurrentEdges", () => {
  const policy: TrustPolicy = {
    version: 1,
    policyId: "blastradius-trust-v1",
    quorum: {
      minMonitors: 1,
      agreementThresholdBps: 6600,
      tieBreakerRule: "worst_case",
    },
    publishers: [
      {
        id: "cur-1",
        address: "0x1111111111111111111111111111111111111111",
        name: "Curator-1",
        roles: ["curator"],
        enabled: true,
        scopes: {},
      },
      {
        id: "proto-1",
        address: "0x2222222222222222222222222222222222222222",
        name: "Protocol-Author",
        roles: ["protocol"],
        enabled: true,
        scopes: { protocols: ["aave-v3"] },
      },
    ],
  };

  const createEdge = (
    creator: string,
    key: string,
    version: number,
    state: "active" | "removed",
    sourceKind: "protocol" | "curator",
    criticalityBps: number = 8000,
  ): DependencyEdgeRecord => ({
    metadata: {
      key,
      creator: creator.toLowerCase() as `0x${string}`,
      owner: creator.toLowerCase() as `0x${string}`,
      createdAtBlock: 100 + version,
      expiresAtBlock: 500,
    },
    attributes: {
      project: "blastradius-v1",
      kind: "dependency_edge",
      dependent_id: "aave:vault:usdc",
      dependent_type: "vault",
      dependency_id: "chainlink:usdc-usd:8453",
      dependency_type: "oracle",
      protocol_id: "aave-v3",
      version,
      state,
      criticality_bps: criticalityBps,
      propagation_bps: 10000,
      chain_id: 8453,
      source_kind: sourceKind,
    },
    payload: {
      fallback: { exists: false, description: null },
      evidence: [
        {
          type: "official_docs",
          url: "https://example.org/docs",
          description: "Official docs",
        },
      ],
      contractReferences: [],
    },
  });

  it("selects newest version when multiple active versions exist", () => {
    const edges = [
      createEdge(
        "0x1111111111111111111111111111111111111111",
        "0xedge-v1",
        1,
        "active",
        "curator",
        5000,
      ),
      createEdge(
        "0x1111111111111111111111111111111111111111",
        "0xedge-v2",
        2,
        "active",
        "curator",
        9000,
      ),
    ];

    const resolved = resolveCurrentEdges(edges, policy);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.version).toBe(2);
    expect(resolved[0]?.criticalityBps).toBe(9000);
  });

  it("prunes edge when newest version has state='removed'", () => {
    const edges = [
      createEdge("0x1111111111111111111111111111111111111111", "0xedge-v1", 1, "active", "curator"),
      createEdge(
        "0x1111111111111111111111111111111111111111",
        "0xedge-v2",
        2,
        "removed",
        "curator",
      ),
    ];

    const resolved = resolveCurrentEdges(edges, policy);
    expect(resolved).toHaveLength(0); // v2 removed supersedes v1 active
  });

  it("prefers protocol publisher over curator on same version tie", () => {
    const edges = [
      createEdge(
        "0x1111111111111111111111111111111111111111",
        "0xcurator-v1",
        1,
        "active",
        "curator",
        5000,
      ),
      createEdge(
        "0x2222222222222222222222222222222222222222",
        "0xprotocol-v1",
        1,
        "active",
        "protocol",
        9900,
      ),
    ];

    const resolved = resolveCurrentEdges(edges, policy);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.publisherRole).toBe("protocol");
    expect(resolved[0]?.criticalityBps).toBe(9900);
  });

  it("ignores untrusted publishers", () => {
    const edges = [
      createEdge(
        "0x9999999999999999999999999999999999999999",
        "0xuntrusted",
        1,
        "active",
        "curator",
      ),
    ];

    const resolved = resolveCurrentEdges(edges, policy);
    expect(resolved).toHaveLength(0);
  });
});
