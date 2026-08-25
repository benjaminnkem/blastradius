import { describe, expect, it } from "vitest";
import type { HealthAssertionRecord, TrustPolicy } from "@blastradius/schemas";
import { resolveHealthConsensus } from "./consensus.js";

describe("resolveHealthConsensus", () => {
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
        name: "Monitor-1",
        roles: ["monitor"],
        enabled: true,
        scopes: {},
      },
      {
        id: "mon-2",
        address: "0x2222222222222222222222222222222222222222",
        name: "Monitor-2",
        roles: ["monitor"],
        enabled: true,
        scopes: {},
      },
      {
        id: "mon-3",
        address: "0x3333333333333333333333333333333333333333",
        name: "Monitor-3",
        roles: ["monitor"],
        enabled: true,
        scopes: {},
      },
      {
        id: "mon-4",
        address: "0x4444444444444444444444444444444444444444",
        name: "Disabled-Monitor",
        roles: ["monitor"],
        enabled: false,
        scopes: {},
      },
    ],
  };

  const createAssertion = (
    creator: string,
    key: string,
    state: "healthy" | "watch" | "degraded" | "critical",
    severity: number,
    observedAt: number,
  ): HealthAssertionRecord => ({
    metadata: {
      key,
      creator: creator.toLowerCase() as `0x${string}`,
      owner: creator.toLowerCase() as `0x${string}`,
      createdAtBlock: 100,
      expiresAtBlock: 200,
    },
    attributes: {
      project: "blastradius-v1",
      kind: "health_assertion",
      observation_id: `obs-${key}`,
      dependency_id: "chainlink:eth-usd:8453",
      dependency_type: "oracle",
      method_id: "oracle:price-deviation",
      method_version: 1,
      confidence_bps: 10000,
      observed_at: observedAt,
      state,
      severity,
      chain_id: 8453,
    },
    payload: {
      summary: "Oracle observation summary",
      measurements: { latency: 100 },
    },
  });

  it("treats 100 assertions from 1 creator as exactly 1 quorum observer", () => {
    const assertions: HealthAssertionRecord[] = [];
    for (let i = 0; i < 100; i++) {
      assertions.push(
        createAssertion(
          "0x1111111111111111111111111111111111111111",
          `0xkey-${i}`,
          "healthy",
          0,
          1000 + i,
        ),
      );
    }

    const consensus = resolveHealthConsensus({
      dependencyId: "chainlink:eth-usd:8453",
      dependencyType: "oracle",
      assertions,
      policy,
    });

    // Policy requires minMonitors = 2. Exactly 1 unique creator -> insufficient coverage.
    expect(consensus.coverage.activeTrustedCreators).toBe(1);
    expect(consensus.aggregateState).toBe("unknown");
    expect(consensus.agreement).toBe("insufficient");
    expect(consensus.observations).toHaveLength(1);
    expect(consensus.observations[0]?.observedAt).toBe(1099); // picked newest assertion
  });

  it("resolves majority state and records split/majority for 3 creators (2 degraded / 1 healthy)", () => {
    const assertions = [
      createAssertion("0x1111111111111111111111111111111111111111", "0x1", "degraded", 60, 1500),
      createAssertion("0x2222222222222222222222222222222222222222", "0x2", "degraded", 70, 1500),
      createAssertion("0x3333333333333333333333333333333333333333", "0x3", "healthy", 0, 1500),
    ];

    const consensus = resolveHealthConsensus({
      dependencyId: "chainlink:eth-usd:8453",
      dependencyType: "oracle",
      assertions,
      policy,
    });

    expect(consensus.coverage.activeTrustedCreators).toBe(3);
    expect(consensus.aggregateState).toBe("degraded");
    expect(consensus.aggregateSeverity).toBe(70); // max of winning votes (60, 70)
    expect(consensus.agreement).toBe("majority");
    expect(consensus.byState.degraded).toBe(2);
    expect(consensus.byState.healthy).toBe(1);
  });

  it("resolves tied states conservatively to worst-case state", () => {
    const assertions = [
      createAssertion("0x1111111111111111111111111111111111111111", "0x1", "critical", 95, 1500),
      createAssertion("0x2222222222222222222222222222222222222222", "0x2", "degraded", 50, 1500),
    ];

    const consensus = resolveHealthConsensus({
      dependencyId: "chainlink:eth-usd:8453",
      dependencyType: "oracle",
      assertions,
      policy,
    });

    expect(consensus.coverage.activeTrustedCreators).toBe(2);
    expect(consensus.aggregateState).toBe("critical"); // worst-case tie breaker
    expect(consensus.aggregateSeverity).toBe(95);
    expect(consensus.agreement).toBe("split"); // 5000 bps < 6600 threshold
  });

  it("ignores disabled or untrusted creators", () => {
    const assertions = [
      createAssertion(
        "0x4444444444444444444444444444444444444444", // Disabled in policy
        "0x1",
        "healthy",
        0,
        1500,
      ),
      createAssertion(
        "0x9999999999999999999999999999999999999999", // Unregistered
        "0x2",
        "healthy",
        0,
        1500,
      ),
    ];

    const consensus = resolveHealthConsensus({
      dependencyId: "chainlink:eth-usd:8453",
      dependencyType: "oracle",
      assertions,
      policy,
    });

    expect(consensus.coverage.activeTrustedCreators).toBe(0);
    expect(consensus.aggregateState).toBe("unknown");
  });

  it("ignores expired assertions when nowSec is provided", () => {
    const assertions = [
      createAssertion(
        "0x1111111111111111111111111111111111111111",
        "0x1",
        "healthy",
        0,
        1000, // 1000 is older than now (2000) - maxAge (600)
      ),
      createAssertion("0x2222222222222222222222222222222222222222", "0x2", "healthy", 0, 1000),
    ];

    const consensus = resolveHealthConsensus({
      dependencyId: "chainlink:eth-usd:8453",
      dependencyType: "oracle",
      assertions,
      policy,
      nowSec: 2000,
      maxAgeSec: 600,
    });

    expect(consensus.coverage.activeTrustedCreators).toBe(0);
    expect(consensus.aggregateState).toBe("unknown");
  });
});
