import { describe, expect, it } from "vitest";
import { computeBlastRadius } from "./traversal.js";
import { resolveHealthConsensus } from "../../trust/src/consensus.js";
import type {
  DependencyEdgeRecord,
  HealthAssertionRecord,
  TrustPolicy,
} from "@blastradius/schemas";

describe("End-to-End Lifecycle Verification (Phase 12)", () => {
  const policy: TrustPolicy = {
    version: 1,
    policyId: "blastradius-trust-v1",
    quorum: {
      minMonitors: 2,
      agreementThresholdBps: 6600,
      tieBreakerRule: "worst_case",
    },
    publishers: [
      {
        id: "mon-1",
        address: "0x1111111111111111111111111111111111111111",
        name: "Trusted Monitor 1",
        roles: ["monitor"],
        enabled: true,
        scopes: {},
      },
      {
        id: "mon-2",
        address: "0x2222222222222222222222222222222222222222",
        name: "Trusted Monitor 2",
        roles: ["monitor"],
        enabled: true,
        scopes: {},
      },
      {
        id: "cur-1",
        address: "0x3333333333333333333333333333333333333333",
        name: "Verified Curator",
        roles: ["curator"],
        enabled: true,
        scopes: {},
      },
    ],
  };

  it("proves the full lifecycle from observation to quorum consensus, graph traversal, and TTL decay", () => {
    const nowSec = Math.floor(Date.now() / 1000);

    // 1. Signed Monitor Assertions
    const assertions: HealthAssertionRecord[] = [
      {
        metadata: {
          key: "0xassertion-mon1-seq-base",
          creator: "0x1111111111111111111111111111111111111111",
          owner: "0x1111111111111111111111111111111111111111",
          createdAtBlock: 24910280,
          expiresAtBlock: 24910380,
        },
        attributes: {
          project: "blastradius-v1",
          kind: "health_assertion",
          observation_id: "obs-seq-base-001",
          dependency_id: "sequencer:base",
          dependency_type: "sequencer",
          method_id: "sequencer-health-v1",
          method_version: 1,
          confidence_bps: 10000,
          observed_at: nowSec - 5,
          state: "critical",
          severity: 90,
          chain_id: 8453,
        },
        payload: {
          summary: "Sequencer stalled: unsafe head lag exceeds 60s",
          measurements: { lagSec: 65 },
        },
      },
      {
        metadata: {
          key: "0xassertion-mon2-seq-base",
          creator: "0x2222222222222222222222222222222222222222",
          owner: "0x2222222222222222222222222222222222222222",
          createdAtBlock: 24910281,
          expiresAtBlock: 24910381,
        },
        attributes: {
          project: "blastradius-v1",
          kind: "health_assertion",
          observation_id: "obs-seq-base-002",
          dependency_id: "sequencer:base",
          dependency_type: "sequencer",
          method_id: "sequencer-health-v1",
          method_version: 1,
          confidence_bps: 10000,
          observed_at: nowSec - 4,
          state: "critical",
          severity: 90,
          chain_id: 8453,
        },
        payload: {
          summary: "Sequencer stalled: provider agreement failed",
          measurements: { lagSec: 64 },
        },
      },
    ];

    // 2. Quorum Consensus Evaluation
    const consensus = resolveHealthConsensus({
      dependencyId: "sequencer:base",
      dependencyType: "sequencer",
      assertions,
      policy,
      nowSec,
    });

    expect(consensus.aggregateState).toBe("critical");
    expect(consensus.aggregateSeverity).toBe(90);
    expect(consensus.agreement).toBe("unanimous");
    expect(consensus.coverage.activeTrustedCreators).toBe(2);

    // 3. Graph Edge Resolution & Reverse Blast Radius Traversal
    const edges: DependencyEdgeRecord[] = [
      {
        metadata: {
          key: "0xedge-aave-usdc-sequencer",
          creator: "0x3333333333333333333333333333333333333333",
          owner: "0x3333333333333333333333333333333333333333",
          createdAtBlock: 24900000,
          expiresAtBlock: 25000000,
        },
        attributes: {
          project: "blastradius-v1",
          kind: "dependency_edge",
          dependent_id: "aave:vault:usdc",
          dependent_type: "vault",
          dependency_id: "sequencer:base",
          dependency_type: "sequencer",
          protocol_id: "aave-v3",
          version: 1,
          state: "active",
          criticality_bps: 10000,
          propagation_bps: 10000,
          chain_id: 8453,
          source_kind: "curator",
        },
        payload: {
          fallback: { exists: false, description: null },
          evidence: [],
          contractReferences: [],
        },
      },
      {
        metadata: {
          key: "0xedge-aave-borrow-usdc",
          creator: "0x3333333333333333333333333333333333333333",
          owner: "0x3333333333333333333333333333333333333333",
          createdAtBlock: 24900000,
          expiresAtBlock: 25000000,
        },
        attributes: {
          project: "blastradius-v1",
          kind: "dependency_edge",
          dependent_id: "aave:operation:borrow",
          dependent_type: "operation",
          dependency_id: "aave:vault:usdc",
          dependency_type: "vault",
          protocol_id: "aave-v3",
          version: 1,
          state: "active",
          criticality_bps: 10000,
          propagation_bps: 10000,
          chain_id: 8453,
          source_kind: "curator",
        },
        payload: {
          fallback: { exists: false, description: null },
          evidence: [],
          contractReferences: [],
        },
      },
    ];

    const blastResult = computeBlastRadius({
      rootDependencyId: "sequencer:base",
      rootDependencyType: "sequencer",
      rootHealthState: consensus.aggregateState,
      rootSeverity: consensus.aggregateSeverity,
      edges,
      trustPolicy: policy,
    });

    expect(blastResult.summary.dependenciesAffected).toBe(2);
    expect(blastResult.summary.protocolsAffected).toBe(1);
    expect(blastResult.summary.operationsAffected).toBe(1);
    expect(blastResult.operations[0]?.operationId).toBe("aave:operation:borrow");
    expect(blastResult.operations[0]?.blastScore).toBe(90);

    // 4. Automatic TTL Expiration & Fail-Closed Decay
    const futureSec = nowSec + 400; // 400s into future
    const decayedConsensus = resolveHealthConsensus({
      dependencyId: "sequencer:base",
      dependencyType: "sequencer",
      assertions,
      policy,
      nowSec: futureSec,
      maxAgeSec: 300,
    });

    expect(decayedConsensus.aggregateState).toBe("unknown");
    expect(decayedConsensus.coverage.activeTrustedCreators).toBe(0);
  });
});
