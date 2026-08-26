import { Controller, Get, HttpException, HttpStatus, Param } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ArkivService } from "../arkiv/arkiv.service.js";
import { GraphService } from "../graph/graph.service.js";
import { TrustService } from "../trust/trust.service.js";

@ApiTags("Dependencies")
@Controller("dependencies")
export class DependenciesController {
  constructor(
    private readonly arkivService: ArkivService,
    private readonly trustService: TrustService,
    private readonly graphService: GraphService,
  ) {}

  @Get(":dependencyId")
  @ApiOperation({
    summary: "Get dependency details",
    description:
      "Returns dependency status, consensus health state, and connected graph dependencies.",
  })
  @ApiParam({ name: "dependencyId", description: "Semantic dependency ID (e.g. sequencer:base)" })
  @ApiResponse({ status: 200, description: "Dependency status and details" })
  async getDependency(@Param("dependencyId") dependencyId: string) {
    const indices = await this.graphService.getIndices();
    const hasIncoming = indices.reverseAdjacency.has(dependencyId);
    const hasOutgoing = indices.forwardAdjacency.has(dependencyId);

    if (!hasIncoming && !hasOutgoing) {
      throw new HttpException(
        `Dependency '${dependencyId}' not found in resolved dependency graph`,
        HttpStatus.NOT_FOUND,
      );
    }

    const assertionsResult = await this.arkivService.listHealthAssertions();
    const depAssertions = assertionsResult.items.filter(
      (r) => r.attributes.dependency_id === dependencyId,
    );

    const depType = dependencyId.split(":")[0] ?? "unknown";
    const consensus = this.trustService.resolveConsensus(
      {
        dependencyId,
        dependencyType: depType,
      },
      depAssertions,
    );

    const blastRadius = await this.graphService.computeBlastRadius(
      dependencyId,
      consensus.aggregateSeverity ?? 100,
      consensus.aggregateState,
      depType,
    );

    return {
      dependencyId,
      dependencyType: depType,
      consensus,
      blastRadiusSummary: blastRadius.summary,
      graphFingerprint: await this.graphService.getFingerprint(),
    };
  }
}
