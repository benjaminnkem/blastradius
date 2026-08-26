import { describe, expect, it } from "vitest";
import { IMPLEMENTATION_PHASE, PACKAGE_NAME } from "./index.js";

describe("@blastradius/monitoring", () => {
  it("exports Phase 6 package metadata", () => {
    expect(PACKAGE_NAME).toBe("@blastradius/monitoring");
    expect(IMPLEMENTATION_PHASE).toBe(6);
  });
});
