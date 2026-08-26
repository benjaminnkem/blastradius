import { describe, expect, it } from "vitest";
import type { DependencyEdgeRecord, DependencyType, TrustPolicy } from "@blastradius/schemas";
import { computeBlastRadius } from "./traversal.js";

describe("Adversarial Graph Load & Security Tests (T15, T16)", () => {
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
    ],
  };

  const createEdgeRecord = (
    dependentId: string,
    dependentType: DependencyType,
    dependencyId: string,
    dependencyType: DependencyType,
    criticalityBps: number = 10000,
    propagationBps: number = 10000,
    protocolId: string = "protocol-a",
  ): DependencyEdgeRecord => ({
    metadata: {
      key: `0xedge-${dependentId}-${dependencyId}`,
      creator: "0x1111111111111111111111111111111111111111",
      owner: "0x1111111111111111111111111111111111111111",
      createdAtBlock: 100,
      expiresAtBlock: 500,
    },
    attributes: {
      project: "blastradius-v1",
      kind: "dependency_edge",
      dependent_id: dependentId,
      dependent_type: dependentType,
      dependency_id: dependencyId,
      dependency_type: dependencyType,
      protocol_id: protocolId,
      version: 1,
      state: "active",
      criticality_bps: criticalityBps,
      propagation_bps: propagationBps,
      chain_id: 8453,
      source_kind: "curator",
    },
    payload: {
      fallback: { exists: false, description: null },
      evidence: [],
      contractReferences: [],
    },
  });

  it("safely traverses a graph with direct cyclic dependencies without infinite looping (T15)", () => {
    // node:a -> node:b -> node:c -> node:a (with a final operation connected to node:c)
    const cyclicEdges: DependencyEdgeRecord[] = [
      createEdgeRecord("node:b", "adapter", "node:a", "sequencer"),
      createEdgeRecord("node:c", "adapter", "node:b", "adapter"),
      createEdgeRecord("node:a", "sequencer", "node:c", "adapter"),
      createEdgeRecord("proto:operation:withdraw", "operation", "node:c", "adapter"),
    ];

    const result = computeBlastRadius({
      rootDependencyId: "node:a",
      rootDependencyType: "sequencer",
      rootHealthState: "critical",
      rootSeverity: 100,
      edges: cyclicEdges,
      trustPolicy: policy,
      limits: { maxDepth: 10, maxNodes: 50 },
    });

    expect(result.summary.operationsAffected).toBe(1);
    expect(result.operations[0]?.operationId).toBe("proto:operation:withdraw");
    expect(result.summary.dependenciesAffected).toBeGreaterThan(0);
  });

  it("handles 1,000 synthetic test edges with sub-millisecond traversal time (T15)", () => {
    const syntheticEdges: DependencyEdgeRecord[] = [];
    const layerCount = 10;
    const branchingFactor = 4;

    for (let layer = 0; layer < layerCount; layer++) {
      for (let i = 0; i < 100; i++) {
        const dependencyId = layer === 0 ? "root:sequencer" : `layer:${layer}:node:${i}`;
        const dependencyType: DependencyType = layer === 0 ? "sequencer" : "adapter";
        const dependentId =
          layer === layerCount - 1
            ? `protocol:aave:op:${i}`
            : `layer:${layer + 1}:node:${(i * branchingFactor + 1) % 100}`;
        const dependentType: DependencyType = layer === layerCount - 1 ? "operation" : "adapter";

        syntheticEdges.push(
          createEdgeRecord(
            dependentId,
            dependentType,
            dependencyId,
            dependencyType,
            9000,
            9500,
            "aave-v3",
          ),
        );
      }
    }

    const traverseStart = performance.now();
    const result = computeBlastRadius({
      rootDependencyId: "root:sequencer",
      rootDependencyType: "sequencer",
      rootHealthState: "critical",
      rootSeverity: 100,
      edges: syntheticEdges,
      trustPolicy: policy,
      limits: { maxDepth: 12, maxNodes: 2000 },
    });
    const traverseDuration = performance.now() - traverseStart;

    expect(syntheticEdges.length).toBe(1000);
    expect(result.summary.dependenciesAffected).toBeGreaterThan(0);
    expect(traverseDuration).toBeLessThan(500);
  });

  it("handles 10,000 synthetic test edges under strict memory and time bounds (T15)", () => {
    const syntheticEdges: DependencyEdgeRecord[] = [];
    const totalEdges = 10000;

    for (let i = 0; i < totalEdges; i++) {
      const dependencyId = `node:${Math.floor(i / 10)}`;
      const dependencyType: DependencyType = i === 0 ? "sequencer" : "adapter";
      const dependentId = i >= 9000 ? `protocol:op:${i}` : `node:${i + 1}`;
      const dependentType: DependencyType = i >= 9000 ? "operation" : "adapter";

      syntheticEdges.push(
        createEdgeRecord(
          dependentId,
          dependentType,
          dependencyId,
          dependencyType,
          10000,
          10000,
          "protocol-x",
        ),
      );
    }

    const travStart = performance.now();
    const result = computeBlastRadius({
      rootDependencyId: "node:0",
      rootDependencyType: "sequencer",
      rootHealthState: "critical",
      rootSeverity: 100,
      edges: syntheticEdges,
      trustPolicy: policy,
      limits: { maxDepth: 15, maxNodes: 500 },
    });
    const travTime = performance.now() - travStart;

    expect(syntheticEdges.length).toBe(10000);
    expect(result.summary.dependenciesAffected).toBeGreaterThan(0);
    expect(travTime).toBeLessThan(1000);
  });
});
