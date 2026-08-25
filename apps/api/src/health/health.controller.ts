import { Controller, Get, HttpCode } from "@nestjs/common";
import type { LiveProbe, ReadyProbe } from "@blastradius/shared";

@Controller("health")
export class HealthController {
  @Get("live")
  live(): LiveProbe {
    return { status: "ok" };
  }

  @Get("ready")
  @HttpCode(503)
  ready(): ReadyProbe {
    return {
      status: "not_ready",
      reason: "phase_0_scaffold",
      checks: {
        arkiv: "unconfigured",
        redis: "unconfigured",
      },
    };
  }
}
