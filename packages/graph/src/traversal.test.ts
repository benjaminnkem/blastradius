import { describe, expect, it } from "vitest";
import type { DependencyEdgeRecord, DependencyType, TrustPolicy } from "@blastradius/schemas";
import { computeBlastRadius } from "./traversal.js";

describe("computeBlastRadius Traversal Engine", () => {
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

  it("traverses a linear chain and calculates propagated exposure", () => {
    // sequencer:base (root) <- aave:vault:usdc <- aave:operation:borrow
    const edges = [
      createEdgeRecord(
        "aave:vault:usdc",
        "vault",
        "sequencer:base",
        "sequencer",
        8000, // 80%
        10000, // 100%
        "aave-v3",
      ),
      createEdgeRecord(
        "aave:operation:borrow",
        "operation",
        "aave:vault:usdc",
        "vault",
        9000, // 90%
        10000, // 100%
        "aave-v3",
      ),
    ];

    const result = computeBlastRadius({
      rootDependencyId: "sequencer:base",
      rootDependencyType: "sequencer",
      rootHealthState: "critical",
      rootSeverity: 90,
      edges,
      trustPolicy: policy,
    });

    expect(result.meta.complete).toBe(true);
    expect(result.summary.protocolsAffected).toBe(1);
    expect(result.summary.operationsAffected).toBe(1);
    expect(result.summary.dependenciesAffected).toBe(2);

    const op = result.operations[0]!;
    expect(op.operationId).toBe("aave:operation:borrow");
    expect(op.protocolId).toBe("aave-v3");
    expect(op.operation).toBe("borrow");
    // Scaled blastScore = 90 * 0.72 = 65
    expect(op.blastScore).toBe(65);
    expect(op.primaryPath).toEqual(["sequencer:base", "aave:vault:usdc", "aave:operation:borrow"]);
  });

  it("traverses diamond graph and selects max exposure without blind summation", () => {
    // oracle:eth-usd <- vault:a (80%) <- operation:liquidation
    // oracle:eth-usd <- vault:b (50%) <- operation:liquidation
    const edges = [
      createEdgeRecord("vault:a", "vault", "oracle:eth-usd", "oracle", 8000, 10000, "aave-v3"),
      createEdgeRecord("vault:b", "vault", "oracle:eth-usd", "oracle", 5000, 10000, "aave-v3"),
      createEdgeRecord(
        "operation:liquidation",
        "operation",
        "vault:a",
        "vault",
        10000,
        10000,
        "aave-v3",
      ),
      createEdgeRecord(
        "operation:liquidation",
        "operation",
        "vault:b",
        "vault",
        10000,
        10000,
        "aave-v3",
      ),
    ];

    const result = computeBlastRadius({
      rootDependencyId: "oracle:eth-usd",
      rootDependencyType: "oracle",
      rootHealthState: "degraded",
      rootSeverity: 80,
      edges,
      trustPolicy: policy,
    });

    expect(result.operations).toHaveLength(1);
    const op = result.operations[0]!;
    expect(op.pathCount).toBe(2);
    // BlastScore with rootSeverity=80: 80 * 0.8 = 64
    expect(op.blastScore).toBe(64);
    expect(op.topPaths).toHaveLength(2);
  });

  it("safely terminates traversal when graph contains cycles", () => {
    // node:a (root) <- node:b <- node:c <- node:b (cycle)
    // node:c <- node:op (operation)
    const edges = [
      createEdgeRecord("node:b", "protocol", "node:a", "sequencer", 9000, 10000),
      createEdgeRecord("node:c", "protocol", "node:b", "protocol", 9000, 10000),
      createEdgeRecord("node:b", "protocol", "node:c", "protocol", 9000, 10000), // cycle
      createEdgeRecord("node:op", "operation", "node:c", "protocol", 9000, 10000),
    ];

    const result = computeBlastRadius({
      rootDependencyId: "node:a",
      rootDependencyType: "sequencer",
      rootHealthState: "critical",
      rootSeverity: 100,
      edges,
      trustPolicy: policy,
    });

    expect(result.meta.complete).toBe(true);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]?.operationId).toBe("node:op");
  });

  it("truncates with truncatedReason='max_depth' when maxDepth is reached", () => {
    const edges = [
      createEdgeRecord("node:1", "protocol", "root", "sequencer"),
      createEdgeRecord("node:2", "protocol", "node:1", "protocol"),
      createEdgeRecord("node:3", "operation", "node:2", "protocol"),
    ];

    const result = computeBlastRadius({
      rootDependencyId: "root",
      rootDependencyType: "sequencer",
      rootHealthState: "critical",
      rootSeverity: 100,
      edges,
      trustPolicy: policy,
      limits: { maxDepth: 2 }, // maxDepth 2 prevents reaching node:3 at depth 3
    });

    expect(result.meta.complete).toBe(false);
    expect(result.meta.truncatedReason).toBe("max_depth");
    expect(result.operations).toHaveLength(0);
  });

  it("attenuates and prunes branches with 0 bps propagation", () => {
    const edges = [
      createEdgeRecord(
        "isolated:vault",
        "vault",
        "root:oracle",
        "oracle",
        10000,
        0, // 0% propagation (isolated/paused)
      ),
      createEdgeRecord("isolated:op", "operation", "isolated:vault", "vault", 10000, 10000),
    ];

    const result = computeBlastRadius({
      rootDependencyId: "root:oracle",
      rootDependencyType: "oracle",
      rootHealthState: "critical",
      rootSeverity: 100,
      edges,
      trustPolicy: policy,
    });

    expect(result.operations).toHaveLength(0);
  });
});
