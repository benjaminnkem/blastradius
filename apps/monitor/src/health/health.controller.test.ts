import "reflect-metadata";
import { HttpException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller.js";

describe("HealthController", () => {
  it("reports process liveness", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    const controller = moduleRef.get(HealthController);
    expect(controller.live()).toEqual({ status: "ok" });
  });

  it("handles ready probe when Redis is not running or unconfigured", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    const controller = moduleRef.get(HealthController);

    try {
      const body = await controller.ready();
      expect(body.status).toBeDefined();
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      const res = (err as HttpException).getResponse() as {
        status: string;
        checks: Record<string, string>;
      };
      expect(res.status).toBeDefined();
      expect(res.checks.redis).toBeDefined();
    }
  });
});
