import { describe, expect, it } from "vitest";
import { IMPLEMENTATION_PHASE, PACKAGE_NAME, type ReadyProbe } from "./index";

describe("@blastradius/shared", () => {
  it("exports probe types used by scaffold health endpoints", () => {
    expect(PACKAGE_NAME).toBe("@blastradius/shared");
    expect(IMPLEMENTATION_PHASE).toBe(0);
    const probe: ReadyProbe = {
      status: "not_ready",
      reason: "phase_0_scaffold",
      checks: { arkiv: "unconfigured" },
    };
    expect(probe.checks.arkiv).toBe("unconfigured");
  });
});
