import { describe, expect, it } from "vitest";
import type { ResolvedEdge } from "./edges.js";
import { computeGraphFingerprint } from "./fingerprint.js";

describe("computeGraphFingerprint", () => {
  const edgeA: ResolvedEdge = {
    dependentId: "aave:vault:usdc",
    dependencyId: "chainlink:usdc-usd:8453",
    dependentType: "vault",
    dependencyType: "oracle",
    chainId: 8453,
    protocolId: "aave-v3",
    version: 1,
    state: "active",
    criticalityBps: 8000,
    propagationBps: 10000,
    fallback: { exists: false, description: null },
    evidence: [],
    contractReferences: [],
    publisherAddress: "0x1111111111111111111111111111111111111111",
    publisherRole: "curator",
    entityKey: "0xkey-a",
  };

  const edgeB: ResolvedEdge = {
    dependentId: "aave:operation:borrow",
    dependencyId: "aave:vault:usdc",
    dependentType: "operation",
    dependencyType: "vault",
    chainId: 8453,
    protocolId: "aave-v3",
    version: 1,
    state: "active",
    criticalityBps: 9000,
    propagationBps: 10000,
    fallback: { exists: false, description: null },
    evidence: [],
    contractReferences: [],
    publisherAddress: "0x1111111111111111111111111111111111111111",
    publisherRole: "curator",
    entityKey: "0xkey-b",
  };

  it("computes deterministic SHA-256 fingerprint independent of input edge order", () => {
    const fp1 = computeGraphFingerprint([edgeA, edgeB], 1);
    const fp2 = computeGraphFingerprint([edgeB, edgeA], 1);

    expect(fp1).toHaveLength(64);
    expect(fp1).toBe(fp2);
  });

  it("yields distinct fingerprints for different policy versions", () => {
    const fp1 = computeGraphFingerprint([edgeA], 1);
    const fp2 = computeGraphFingerprint([edgeA], 2);

    expect(fp1).not.toBe(fp2);
  });
});
