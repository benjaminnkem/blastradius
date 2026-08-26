import { describe, expect, it } from "vitest";
import { ArkivService } from "../arkiv/arkiv.service.js";
import { GraphService } from "../graph/graph.service.js";
import { TrustService } from "../trust/trust.service.js";
import { ProtocolsController } from "./protocols.controller.js";

describe("ProtocolsController", () => {
  it("computes protocol exposure for registered protocol", async () => {
    const arkivService = new ArkivService();
    const trustService = new TrustService();
    trustService.onModuleInit();
    const graphService = new GraphService(arkivService, trustService);

    const controller = new ProtocolsController(graphService);
    const result = await controller.getProtocolExposure("aave-v3");

    expect(result.protocolId).toBe("aave-v3");
    expect(result.totalOperations).toBeGreaterThanOrEqual(1);
  });
});
