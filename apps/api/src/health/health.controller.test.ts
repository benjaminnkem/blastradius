import { describe, expect, it } from "vitest";
import { ArkivService } from "../arkiv/arkiv.service.js";
import { HealthController } from "./health.controller.js";

describe("HealthController", () => {
  it("returns live status ok", () => {
    const arkivService = new ArkivService();
    const controller = new HealthController(arkivService);
    expect(controller.live()).toEqual({ status: "ok" });
  });

  it("returns ready status", () => {
    const arkivService = new ArkivService();
    const controller = new HealthController(arkivService);
    const probe = controller.ready();
    expect(probe.status).toBe("ok");
    expect(probe.checks).toBeDefined();
  });
});
