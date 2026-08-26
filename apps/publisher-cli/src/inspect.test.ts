import { describe, expect, it, vi } from "vitest";
import type { ArkivReader } from "@blastradius/arkiv";
import { inspectEntity } from "./commands/inspect.js";

describe("Publisher CLI: inspect command", () => {
  it("inspects existing entity by key", async () => {
    const mockReader = {
      getEntity: vi.fn().mockResolvedValue({
        metadata: {
          key: "0x123",
          creator: "0x1111111111111111111111111111111111111111",
          owner: "0x1111111111111111111111111111111111111111",
          createdAtBlock: 100,
          expiresAtBlock: 300,
        },
        attributes: { project: "blastradius-v1", kind: "health_assertion" },
        payload: { summary: "Healthy" },
      }),
    } as unknown as ArkivReader;

    const result = await inspectEntity(mockReader, "0x123");
    expect(result.found).toBe(true);
    expect(result.creator).toBe("0x1111111111111111111111111111111111111111");
    expect(result.attributes?.kind).toBe("health_assertion");
  });

  it("handles missing entity key", async () => {
    const mockReader = {
      getEntity: vi.fn().mockResolvedValue(null),
    } as unknown as ArkivReader;

    const result = await inspectEntity(mockReader, "0xnonexistent");
    expect(result.found).toBe(false);
  });
});
