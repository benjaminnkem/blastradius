import { Controller, Get, HttpCode } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { LiveProbe, ReadyProbe } from "@blastradius/shared";
import { ArkivService } from "../arkiv/arkiv.service.js";

@ApiTags("Health Probes")
@Controller("health")
export class HealthController {
  constructor(private readonly arkivService: ArkivService) {}

  @Get("live")
  @HttpCode(200)
  @ApiOperation({ summary: "Liveness probe" })
  @ApiResponse({ status: 200, description: "Process is live" })
  live(): LiveProbe {
    return { status: "ok" };
  }

  @Get("ready")
  @ApiOperation({ summary: "Readiness probe" })
  @ApiResponse({ status: 200, description: "Service is ready to serve traffic" })
  @ApiResponse({ status: 503, description: "Service is degraded or initializing" })
  ready(): ReadyProbe {
    const isArkivReady = this.arkivService.getReader() !== null;

    const probe: ReadyProbe = {
      status: "ok",
      checks: {
        arkiv: isArkivReady ? "ok" : "unconfigured",
        redis: "ok",
      },
    };

    return probe;
  }
}
