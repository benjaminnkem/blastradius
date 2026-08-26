import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GraphService } from "../graph/graph.service.js";

@ApiTags("Blast Radius")
@Controller("blast-radius")
export class BlastRadiusController {
  constructor(private readonly graphService: GraphService) {}

  @Get(":dependencyId")
  @ApiOperation({
    summary: "Compute blast radius for a dependency",
    description:
      "Executes deterministic cycle-safe BFS traversal from the dependency up the dependency graph.",
  })
  @ApiParam({ name: "dependencyId", description: "Root semantic dependency ID" })
  @ApiQuery({
    name: "severity",
    required: false,
    type: Number,
    description: "Hypothetical root severity (0..100)",
  })
  @ApiResponse({ status: 200, description: "Blast radius traversal result" })
  async getBlastRadius(
    @Param("dependencyId") dependencyId: string,
    @Query("severity") severityStr?: string,
  ) {
    const rootSeverity = severityStr !== undefined ? Number(severityStr) : 100;
    return this.graphService.computeBlastRadius(dependencyId, rootSeverity);
  }
}
