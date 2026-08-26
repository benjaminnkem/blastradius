import { describe, expect, it, vi } from "vitest";
import { ArkivService } from "../arkiv/arkiv.service.js";
import { ProofController } from "./proof.controller.js";

describe("ProofController", () => {
  it("returns entity proof when entity exists", async () => {
    const arkivService = new ArkivService();
    vi.spyOn(arkivService, "getEntity").mockResolvedValue({
      metadata: {
        key: "0x123",
        creator: "0x1111111111111111111111111111111111111111",
        owner: "0x1111111111111111111111111111111111111111",
        createdAtBlock: 100,
        expiresAtBlock: 300,
      },
      attributes: { project: "blastradius-v1", kind: "health_assertion" },
      payload: { summary: "Healthy" },
    });

    const controller = new ProofController(arkivService);
    const result = await controller.getEntityProof("0x123");

    expect(result.metadata.key).toBe("0x123");
    expect(result.attributes.kind).toBe("health_assertion");
  });
});
