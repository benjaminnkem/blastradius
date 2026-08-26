import { describe, expect, it } from "vitest";
import { ArkivService } from "../arkiv/arkiv.service.js";
import { MethodsController } from "./methods.controller.js";

describe("MethodsController", () => {
  it("returns standard method definition for sequencer-health-v1", async () => {
    const arkivService = new ArkivService();
    const controller = new MethodsController(arkivService);
    const result = (await controller.getMethod("sequencer-health-v1")) as {
      methodId: string;
      version: number;
    };

    expect(result.methodId).toBe("sequencer-health-v1");
    expect(result.version).toBe(1);
  });
});
