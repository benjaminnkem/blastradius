import { describe, expect, it } from "vitest";
import { fromArkivAttributes, toArkivAttributes } from "./attributes.js";
import { ArkivValidationError } from "./errors.js";

describe("Arkiv Attributes Mapping", () => {
  it("converts mixed attributes and preserves types", () => {
    const raw = {
      project: "blastradius-v1",
      kind: "health_assertion",
      chain_id: 8453,
      severity: 90,
      enabled: true,
      unset: undefined,
    };

    const attrs = toArkivAttributes(raw);
    expect(attrs).toEqual([
      { key: "project", value: "blastradius-v1" },
      { key: "kind", value: "health_assertion" },
      { key: "chain_id", value: 8453 },
      { key: "severity", value: 90 },
      { key: "enabled", value: "true" },
    ]);
  });

  it("throws ArkivValidationError if a numeric attribute is a float", () => {
    expect(() =>
      toArkivAttributes({
        severity: 90.5,
      }),
    ).toThrow(ArkivValidationError);
  });

  it("converts attribute array back to dictionary", () => {
    const attrs = [
      { key: "project", value: "blastradius-v1" },
      { key: "severity", value: 90 },
    ];
    const dict = fromArkivAttributes(attrs);
    expect(dict).toEqual({
      project: "blastradius-v1",
      severity: 90,
    });
  });
});
