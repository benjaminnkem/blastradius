import { describe, expect, it } from "vitest";
import { IMPLEMENTATION_PHASE, PACKAGE_NAME } from "./index";

describe("@blastradius/schemas", () => {
  it("is a phase 0 identity export only", () => {
    expect(PACKAGE_NAME).toBe("@blastradius/schemas");
    expect(IMPLEMENTATION_PHASE).toBe(0);
  });
});
