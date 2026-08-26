import { Controller, Get, HttpException, HttpStatus, Param } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ArkivService } from "../arkiv/arkiv.service.js";

@ApiTags("Monitoring Methods")
@Controller("methods")
export class MethodsController {
  constructor(private readonly arkivService: ArkivService) {}

  @Get(":methodId")
  @ApiOperation({
    summary: "Get methodology documentation and check specifications",
    description: "Returns official method parameters, checks, and thresholds.",
  })
  @ApiParam({
    name: "methodId",
    description: "Methodology identifier (e.g. sequencer-health-v1, chainlink-feed-v1)",
  })
  @ApiResponse({ status: 200, description: "Methodology record" })
  async getMethod(@Param("methodId") methodId: string) {
    const methodsResult = await this.arkivService.listMonitorMethods();
    const method = methodsResult.items.find((m) => m.attributes.method_id === methodId);

    if (method) {
      return method;
    }

    // Built-in standard definitions if not yet on-chain
    const standardMethods: Record<string, unknown> = {
      "sequencer-health-v1": {
        methodId: "sequencer-health-v1",
        version: 1,
        name: "Sequencer Health Progression",
        description: "Measures rollup head advancement, safe lag, and multi-provider agreement.",
        checks: ["headProgression", "safeLag", "providerAgreement", "rpcLatency"],
        thresholds: { warningSafeLagSec: 120, criticalSafeLagSec: 600, maxBlockGapSec: 60 },
      },
      "chainlink-feed-v1": {
        methodId: "chainlink-feed-v1",
        version: 1,
        name: "Chainlink AggregatorV3 Price Feed",
        description:
          "Observes round validity, price positivity, and staleness vs configured heartbeat.",
        checks: ["roundValidity", "pricePositivity", "heartbeatStaleness"],
      },
      "rpc-provider-v1": {
        methodId: "rpc-provider-v1",
        version: 1,
        name: "RPC Provider Cluster Health",
        description:
          "Measures availability, head lag, latency, and block agreement across endpoints.",
        checks: ["availability", "latency", "headLag", "agreement"],
      },
    };

    const builtIn = standardMethods[methodId];
    if (!builtIn) {
      throw new HttpException(`Methodology '${methodId}' is not registered`, HttpStatus.NOT_FOUND);
    }

    return builtIn;
  }
}
