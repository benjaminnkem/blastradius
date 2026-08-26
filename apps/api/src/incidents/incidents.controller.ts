import type { HealthAssertionRecord } from "@blastradius/schemas";
import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ArkivService } from "../arkiv/arkiv.service.js";
import { GraphService } from "../graph/graph.service.js";
import { TrustService } from "../trust/trust.service.js";

@ApiTags("Incidents")
@Controller("incidents")
export class IncidentsController {
  constructor(
    private readonly arkivService: ArkivService,
    private readonly trustService: TrustService,
    private readonly graphService: GraphService,
  ) {}

  @Get()
  @ApiOperation({
    summary: "List active incidents",
    description:
      "Returns currently active degraded, critical, or unavailable dependencies evaluated by trust quorum.",
  })
  @ApiQuery({ name: "chainId", required: false, type: Number })
  @ApiQuery({ name: "protocolId", required: false, type: String })
  @ApiResponse({ status: 200, description: "Active incidents list" })
  async getIncidents(@Query("chainId") chainId?: string, @Query("protocolId") protocolId?: string) {
    const assertionsResult = await this.arkivService.listHealthAssertions();
    const records = assertionsResult.items;

    // Group assertions by dependency_id
    const grouped = new Map<string, HealthAssertionRecord[]>();
    for (const record of records) {
      const depId = record.attributes.dependency_id;
      const list = grouped.get(depId) ?? [];
      list.push(record);
      grouped.set(depId, list);
    }

    const incidents: Array<{
      dependencyId: string;
      dependencyType: string;
      chainId?: number;
      consensusState: string;
      consensusSeverity: number | null;
      agreement: string;
      activeTrustedCreators: number;
      blastRadius?: unknown;
    }> = [];

    for (const [depId, depRecords] of grouped.entries()) {
      const sample = depRecords[0]!;
      const depChainId = sample.attributes.chain_id;

      if (chainId && depChainId !== Number(chainId)) continue;

      const consensus = this.trustService.resolveConsensus(
        {
          dependencyId: depId,
          dependencyType: sample.attributes.dependency_type,
          chainId: depChainId,
        },
        depRecords,
      );

      // Only include non-healthy states as active incidents
      if (
        consensus.aggregateState === "degraded" ||
        consensus.aggregateState === "critical" ||
        consensus.aggregateState === "unavailable"
      ) {
        const blast = await this.graphService.computeBlastRadius(
          depId,
          consensus.aggregateSeverity ?? 100,
          consensus.aggregateState,
          sample.attributes.dependency_type,
        );

        const affectedProtocols = blast.operations.map((o) => o.protocolId);
        if (protocolId && !affectedProtocols.includes(protocolId)) {
          continue;
        }

        incidents.push({
          dependencyId: depId,
          dependencyType: sample.attributes.dependency_type,
          chainId: depChainId,
          consensusState: consensus.aggregateState,
          consensusSeverity: consensus.aggregateSeverity,
          agreement: consensus.agreement,
          activeTrustedCreators: consensus.coverage.activeTrustedCreators,
          blastRadius: blast,
        });
      }
    }

    return {
      incidents,
      totalCount: incidents.length,
      graphFingerprint: await this.graphService.getFingerprint(),
    };
  }
}
