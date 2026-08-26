import { describe, expect, it } from "vitest";
import type { DependencyDeclarationFile, DependencyEdgeRecord } from "@blastradius/schemas";
import { computeGraphDiff } from "./commands/diff.js";

describe("Publisher CLI: diff command", () => {
  const localDeclaration: DependencyDeclarationFile = {
    schemaVersion: 1,
    edgeId: "base-aave-v3-vault-usdc-to-chainlink-oracle",
    dependent: { id: "aave:vault:usdc", type: "vault" },
    dependency: { id: "chainlink:usdc-usd:8453", type: "oracle" },
    criticalityBps: 10000,
    propagationBps: 10000,
    sourceKind: "curator",
    evidence: [{ type: "official_docs", url: "https://docs.aave.com" }],
  };

  it("identifies new edge when on-chain record does not exist", () => {
    const diff = computeGraphDiff([localDeclaration], []);
    expect(diff.hasChanges).toBe(true);
    expect(diff.items).toHaveLength(1);
    expect(diff.items[0]?.action).toBe("NEW");
    expect(diff.items[0]?.targetVersion).toBe(1);
  });

  it("identifies UNCHANGED when local declaration matches active on-chain edge", () => {
    const onChainEdge: DependencyEdgeRecord = {
      metadata: {
        key: "0x123",
        creator: "0x1111111111111111111111111111111111111111",
        createdAt: 1700000000,
        expiresInSec: 31536000,
      },
      attributes: {
        project: "blastradius-v1",
        kind: "dependency_edge",
        edge_id: "base-aave-v3-vault-usdc-to-chainlink-oracle",
        dependent_id: "aave:vault:usdc",
        dependent_type: "vault",
        dependency_id: "chainlink:usdc-usd:8453",
        dependency_type: "oracle",
        state: "active",
        criticality_bps: 10000,
        propagation_bps: 10000,
        version: 1,
        source_kind: "curator",
        effective_at: 1700000000,
      },
      payload: {
        name: "Aave USDC to Oracle",
        description: "Desc",
        failureMode: "Mode",
        fallback: { exists: false },
        evidence: [{ type: "official_docs", url: "https://docs.aave.com" }],
      },
    };

    const diff = computeGraphDiff([localDeclaration], [onChainEdge]);
    expect(diff.hasChanges).toBe(false);
    expect(diff.items[0]?.action).toBe("UNCHANGED");
  });

  it("identifies VERSION_INCREMENT when criticality or propagation changes", () => {
    const onChainEdge: DependencyEdgeRecord = {
      metadata: {
        key: "0x123",
        creator: "0x1111111111111111111111111111111111111111",
        createdAt: 1700000000,
        expiresInSec: 31536000,
      },
      attributes: {
        project: "blastradius-v1",
        kind: "dependency_edge",
        edge_id: "base-aave-v3-vault-usdc-to-chainlink-oracle",
        dependent_id: "aave:vault:usdc",
        dependent_type: "vault",
        dependency_id: "chainlink:usdc-usd:8453",
        dependency_type: "oracle",
        state: "active",
        criticality_bps: 8000, // old criticality
        propagation_bps: 10000,
        version: 1,
        source_kind: "curator",
        effective_at: 1700000000,
      },
      payload: {
        name: "Aave USDC to Oracle",
        description: "Desc",
        failureMode: "Mode",
        fallback: { exists: false },
        evidence: [{ type: "official_docs", url: "https://docs.aave.com" }],
      },
    };

    const diff = computeGraphDiff([localDeclaration], [onChainEdge]);
    expect(diff.hasChanges).toBe(true);
    expect(diff.items[0]?.action).toBe("VERSION_INCREMENT");
    expect(diff.items[0]?.currentVersion).toBe(1);
    expect(diff.items[0]?.targetVersion).toBe(2);
  });
});
