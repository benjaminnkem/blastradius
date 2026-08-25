import { describe, expect, it } from "vitest";
import type { TrustPolicy } from "@blastradius/schemas";
import { classifyPublisher } from "./classification.js";

describe("classifyPublisher", () => {
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
        id: "mon-global",
        address: "0x1111111111111111111111111111111111111111",
        name: "Global-Monitor",
        roles: ["monitor"],
        enabled: true,
        scopes: {},
      },
      {
        id: "mon-disabled",
        address: "0x2222222222222222222222222222222222222222",
        name: "Disabled-Monitor",
        roles: ["monitor"],
        enabled: false,
        scopes: {},
      },
      {
        id: "cur-chain",
        address: "0x3333333333333333333333333333333333333333",
        name: "Chain-Curator",
        roles: ["curator"],
        enabled: true,
        scopes: { chains: [8453] },
      },
      {
        id: "mon-target",
        address: "0x4444444444444444444444444444444444444444",
        name: "Target-Monitor",
        roles: ["monitor"],
        enabled: true,
        scopes: { dependencies: ["chainlink:eth-usd:8453"], chains: [8453] },
      },
    ],
  };

  it("fails closed on unregistered address", () => {
    const res = classifyPublisher(
      "0x9999999999999999999999999999999999999999",
      "monitor",
      undefined,
      policy,
    );
    expect(res.trusted).toBe(false);
  });

  it("fails closed on disabled publisher", () => {
    const res = classifyPublisher(
      "0x2222222222222222222222222222222222222222",
      "monitor",
      undefined,
      policy,
    );
    expect(res.trusted).toBe(false);
  });

  it("fails closed on role mismatch", () => {
    const res = classifyPublisher(
      "0x3333333333333333333333333333333333333333",
      "monitor", // required monitor, but publisher is curator
      { chainId: 8453 },
      policy,
    );
    expect(res.trusted).toBe(false);
  });

  it("fails closed on scope mismatch", () => {
    const res = classifyPublisher(
      "0x4444444444444444444444444444444444444444",
      "monitor",
      { dependencyId: "pyth:btc-usd:8453", chainId: 8453 },
      policy,
    );
    expect(res.trusted).toBe(false);
  });

  it("trusts global monitor for any scope", () => {
    const res = classifyPublisher(
      "0x1111111111111111111111111111111111111111",
      "monitor",
      { dependencyId: "any:dep", chainId: 1 },
      policy,
    );
    expect(res.trusted).toBe(true);
    expect(res.publisherId).toBe("mon-global");
  });
});
