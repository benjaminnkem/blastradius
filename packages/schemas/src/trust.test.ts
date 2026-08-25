import { describe, expect, it } from "vitest";
import { TrustPolicySchema, TrustPublisherSchema } from "./trust.js";

describe("Trust Policy Schemas", () => {
  it("parses valid publisher with roles and scopes", () => {
    const publisher = {
      id: "monitor-base-a",
      name: "Base Monitor A",
      address: "0x1111111111111111111111111111111111111111",
      roles: ["monitor"],
      scopes: {
        dependencies: ["sequencer:base"],
        methods: ["sequencer-health-v1"],
      },
      enabled: true,
    };
    const parsed = TrustPublisherSchema.parse(publisher);
    expect(parsed.address).toBe("0x1111111111111111111111111111111111111111");
    expect(parsed.roles).toEqual(["monitor"]);
  });

  it("parses full trust policy", () => {
    const policy = {
      version: 1,
      policyId: "blastradius-trust-v1",
      publishers: [
        {
          id: "monitor-base-a",
          address: "0x1111111111111111111111111111111111111111",
          roles: ["monitor"],
        },
        {
          id: "curator-primary",
          address: "0x2222222222222222222222222222222222222222",
          roles: ["curator"],
        },
      ],
    };
    const parsed = TrustPolicySchema.parse(policy);
    expect(parsed.version).toBe(1);
    expect(parsed.publishers.length).toBe(2);
  });

  it("rejects trust policy with empty publishers array", () => {
    expect(() =>
      TrustPolicySchema.parse({
        version: 1,
        policyId: "empty-policy",
        publishers: [],
      }),
    ).toThrow(/at least one publisher/);
  });
});
