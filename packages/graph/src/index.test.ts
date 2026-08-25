import { describe, expect, it } from "vitest";
import { IMPLEMENTATION_PHASE, PACKAGE_NAME } from "./index.js";

describe("@blastradius/graph", () => {
  it("exports Phase 3 package metadata", () => {
    expect(PACKAGE_NAME).toBe("@blastradius/graph");
    expect(IMPLEMENTATION_PHASE).toBe(3);
  });
});
