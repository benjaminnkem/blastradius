import { describe, expect, it } from "vitest";
import type { HealthAssertionRecord, TrustPolicy } from "@blastradius/schemas";
import { resolveHealthConsensus } from "./consensus.js";

describe("Adversarial Trust & Quorum Security Tests (T1, T2, T3, T8)", () => {
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
        name: "Monitor 1",
        roles: ["monitor"],
        enabled: true,
        scopes: {},
      },
      {
        id: "mon-2",
        address: "0x2222222222222222222222222222222222222222",
        name: "Monitor 2",
        roles: ["monitor"],
        enabled: true,
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
      dependency_id: "sequencer:base",
      dependency_type: "sequencer",
      method_id: "sequencer-health-v1",
      method_version: 1,
      confidence_bps: 10000,
      observed_at: observedAt,
      state,
      severity,
      chain_id: 8453,
    },
    payload: {
      summary: "Observation",
      measurements: {},
    },
  });

  it("resists Sybil attacks from 100 untrusted wallets claiming critical failure (T1)", () => {
    const now = Math.floor(Date.now() / 1000);
    const sybilAssertions: HealthAssertionRecord[] = [];

    for (let i = 1; i <= 100; i++) {
      const fakeAddress = `0xdeadbeef${i.toString().padStart(32, "0")}`;
      sybilAssertions.push(createAssertion(fakeAddress, `0xsybil${i}`, "critical", 100, now));
    }

    const consensus = resolveHealthConsensus({
      dependencyId: "sequencer:base",
      dependencyType: "sequencer",
      assertions: sybilAssertions,
      policy,
      nowSec: now,
    });

    // Untrusted sybil claims must NOT be accepted as trusted consensus
    expect(consensus.coverage.activeTrustedCreators).toBe(0);
    expect(consensus.aggregateState).toBe("unknown");
    expect(consensus.agreement).toBe("insufficient");
  });

  it("prevents a single trusted wallet from inflating quorum by publishing 1,000 assertions (T2)", () => {
    const now = Math.floor(Date.now() / 1000);
    const spamAssertions: HealthAssertionRecord[] = [];

    // Trusted wallet 1 spams 1,000 assertions
    for (let i = 1; i <= 1000; i++) {
      spamAssertions.push(
        createAssertion(
          "0x1111111111111111111111111111111111111111",
          `0xspam${i}`,
          "critical",
          90,
          now - i,
        ),
      );
    }

    const consensus = resolveHealthConsensus({
      dependencyId: "sequencer:base",
      dependencyType: "sequencer",
      assertions: spamAssertions,
      policy,
      nowSec: now,
    });

    // Must deduplicate to exactly 1 active observer, which is below the minimum quorum of 2
    expect(consensus.coverage.activeTrustedCreators).toBe(1);
    expect(consensus.coverage.minimumRequired).toBe(2);
    expect(consensus.agreement).toBe("insufficient");
  });

  it("identifies split disagreement between trusted observers and applies tie breaker (T8)", () => {
    const now = Math.floor(Date.now() / 1000);
    const splitAssertions: HealthAssertionRecord[] = [
      createAssertion("0x1111111111111111111111111111111111111111", "0xkey1", "healthy", 0, now),
      createAssertion("0x2222222222222222222222222222222222222222", "0xkey2", "critical", 90, now),
    ];

    const consensus = resolveHealthConsensus({
      dependencyId: "sequencer:base",
      dependencyType: "sequencer",
      assertions: splitAssertions,
      policy,
      nowSec: now,
    });

    expect(consensus.coverage.activeTrustedCreators).toBe(2);
    expect(consensus.agreement).toBe("split");
    expect(consensus.aggregateState).toBe("critical"); // Worst-case tie breaker
  });
});
