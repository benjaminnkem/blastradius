import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("reports process liveness without claiming observations", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    const controller = moduleRef.get(HealthController);
    expect(controller.live()).toEqual({ status: "ok" });
  });

  it("stays not_ready until workers and Arkiv publishing exist", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    const controller = moduleRef.get(HealthController);
    const body = controller.ready();
    expect(body.status).toBe("not_ready");
    expect(body.checks.scheduler).toBe("unconfigured");
  });
});
