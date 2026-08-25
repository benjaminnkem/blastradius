import { describe, expect, it } from "vitest";
import type { TrustPolicy } from "@blastradius/schemas";
import { computeTrustPolicyChecksum, validateTrustPolicy } from "./policy.js";

describe("Trust Policy", () => {
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
        name: "Monitor-A",
        address: "0x1111111111111111111111111111111111111111",
        roles: ["monitor"],
        enabled: true,
        scopes: {},
      },
      {
        id: "mon-2",
        name: "Monitor-B",
        address: "0x2222222222222222222222222222222222222222",
        roles: ["monitor"],
        enabled: true,
        scopes: { chains: [8453] },
      },
    ],
  };

  it("validates valid trust policy", () => {
    const validated = validateTrustPolicy(policy);
    expect(validated.version).toBe(1);
    expect(validated.policyId).toBe("blastradius-trust-v1");
  });

  it("computes deterministic SHA-256 checksum independent of publisher order", () => {
    const checksumA = computeTrustPolicyChecksum(policy);

    const reversedPolicy: TrustPolicy = {
      ...policy,
      publishers: [policy.publishers[1]!, policy.publishers[0]!],
    };
    const checksumB = computeTrustPolicyChecksum(reversedPolicy);

    expect(checksumA).toHaveLength(64);
    expect(checksumA).toBe(checksumB);
  });
});
