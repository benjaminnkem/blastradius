import { Controller, Get, HttpException, HttpStatus, Param } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GraphService } from "../graph/graph.service.js";

@ApiTags("Protocols")
@Controller("protocols")
export class ProtocolsController {
  constructor(private readonly graphService: GraphService) {}

  @Get(":protocolId/exposure")
  @ApiOperation({
    summary: "Get protocol aggregated exposure",
    description:
      "Evaluates aggregate blast radius exposure for a specific protocol across all operations.",
  })
  @ApiParam({ name: "protocolId", description: "Protocol identifier (e.g. aave-v3)" })
  @ApiResponse({ status: 200, description: "Protocol exposure and critical paths" })
  async getProtocolExposure(@Param("protocolId") protocolId: string) {
    const exposure = await this.graphService.computeProtocolExposure(protocolId);

    if (!exposure) {
      throw new HttpException(
        `Protocol '${protocolId}' has no registered operations or nodes in the dependency graph`,
        HttpStatus.NOT_FOUND,
      );
    }

    return exposure;
  }
}
