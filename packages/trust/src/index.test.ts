import { describe, expect, it } from "vitest";
import { IMPLEMENTATION_PHASE, PACKAGE_NAME } from "./index.js";

describe("@blastradius/trust", () => {
  it("exports Phase 3 package metadata", () => {
    expect(PACKAGE_NAME).toBe("@blastradius/trust");
    expect(IMPLEMENTATION_PHASE).toBe(3);
  });
});
