import { describe, expect, it } from "vitest";
import {
  DependencyEdgeAttributesSchema,
  DependencyTypeSchema,
  HealthAssertionAttributesSchema,
  HealthStateSchema,
  IMPLEMENTATION_PHASE,
  PACKAGE_NAME,
} from "./index.js";

describe("@blastradius/schemas", () => {
  it("exports Phase 1 domain contracts and schemas", () => {
    expect(PACKAGE_NAME).toBe("@blastradius/schemas");
    expect(IMPLEMENTATION_PHASE).toBe(1);
    expect(DependencyTypeSchema).toBeDefined();
    expect(HealthStateSchema).toBeDefined();
    expect(DependencyEdgeAttributesSchema).toBeDefined();
    expect(HealthAssertionAttributesSchema).toBeDefined();
  });
});
