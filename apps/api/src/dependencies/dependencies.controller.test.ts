import { describe, expect, it } from "vitest";
import { ArkivService } from "../arkiv/arkiv.service.js";
import { GraphService } from "../graph/graph.service.js";
import { TrustService } from "../trust/trust.service.js";
import { DependenciesController } from "./dependencies.controller.js";

describe("DependenciesController", () => {
  it("returns dependency status and blast radius summary for existing dependency", async () => {
    const arkivService = new ArkivService();
    const trustService = new TrustService();
    trustService.onModuleInit();
    const graphService = new GraphService(arkivService, trustService);

    const controller = new DependenciesController(arkivService, trustService, graphService);

    const result = await controller.getDependency("sequencer:base");
    expect(result.dependencyId).toBe("sequencer:base");
    expect(result.dependencyType).toBe("sequencer");
    expect(result.blastRadiusSummary).toBeDefined();
  });

  it("throws 404 NOT_FOUND for unknown dependency", async () => {
    const arkivService = new ArkivService();
    const trustService = new TrustService();
    trustService.onModuleInit();
    const graphService = new GraphService(arkivService, trustService);

    const controller = new DependenciesController(arkivService, trustService, graphService);

    await expect(controller.getDependency("nonexistent:dependency")).rejects.toThrow(
      "Dependency 'nonexistent:dependency' not found in resolved dependency graph",
    );
  });
});
