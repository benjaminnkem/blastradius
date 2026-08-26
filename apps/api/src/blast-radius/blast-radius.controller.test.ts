import { describe, expect, it } from "vitest";
import { ArkivService } from "../arkiv/arkiv.service.js";
import { GraphService } from "../graph/graph.service.js";
import { TrustService } from "../trust/trust.service.js";
import { BlastRadiusController } from "./blast-radius.controller.js";

describe("BlastRadiusController", () => {
  it("computes blast radius from root dependency", async () => {
    const arkivService = new ArkivService();
    const trustService = new TrustService();
    trustService.onModuleInit();
    const graphService = new GraphService(arkivService, trustService);

    const controller = new BlastRadiusController(graphService);
    const result = await controller.getBlastRadius("sequencer:base", "100");

    expect(result.root.id).toBe("sequencer:base");
    expect(result.root.severity).toBe(100);
    expect(result.summary.dependenciesAffected).toBeGreaterThanOrEqual(1);
    expect(result.operations.length).toBeGreaterThanOrEqual(1);
  });
});
