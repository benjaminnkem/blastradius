import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("reports process liveness without claiming product data", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    const controller = moduleRef.get(HealthController);
    expect(controller.live()).toEqual({ status: "ok" });
  });

  it("does not report ready while the Arkiv adapter is unimplemented", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    const controller = moduleRef.get(HealthController);
    const body = controller.ready();
    expect(body.status).toBe("not_ready");
    expect(body.reason).toBe("phase_0_scaffold");
    expect(body.checks.arkiv).toBe("unconfigured");
  });
});
