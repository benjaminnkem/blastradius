import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadDependencyDeclarationsDir } from "@blastradius/config";
import {
  buildGraphIndex,
  computeBlastRadius,
  computeGraphFingerprint,
  type GraphIndex,
  type ResolvedEdge,
  resolveCurrentEdges,
} from "@blastradius/graph";
import type {
  BlastRadiusResult,
  DependencyEdgeRecord,
  DependencyType,
  HealthState,
} from "@blastradius/schemas";
import { Injectable } from "@nestjs/common";
import { ArkivService } from "../arkiv/arkiv.service.js";
import { TrustService } from "../trust/trust.service.js";

@Injectable()
export class GraphService {
  constructor(
    private readonly arkivService: ArkivService,
    private readonly trustService: TrustService,
  ) {}

  async getEdgeRecords(): Promise<DependencyEdgeRecord[]> {
    const onChainResult = await this.arkivService.listDependencyEdges();
    if (onChainResult.items.length > 0) {
      return onChainResult.items;
    }

    // Fallback to local config dependencies
    const candidates = [
      resolve(process.cwd(), "config/dependencies"),
      resolve(process.cwd(), "../../config/dependencies"),
      resolve(process.cwd(), "../config/dependencies"),
    ];
    const depDir = candidates.find((p) => existsSync(p));

    if (depDir) {
      try {
        const declarations = loadDependencyDeclarationsDir(depDir);
        return declarations.map((d, i) => ({
          metadata: {
            key: `0xlocal-${i}`,
            creator: "0x1111111111111111111111111111111111111111",
            owner: "0x1111111111111111111111111111111111111111",
            createdAtBlock: 1,
            expiresAtBlock: 1000000,
          },
          attributes: {
            project: "blastradius-v1",
            kind: "dependency_edge" as const,
            edge_id: d.edgeId,
            dependent_id: d.dependent.id,
            dependent_type: d.dependent.type,
            dependency_id: d.dependency.id,
            dependency_type: d.dependency.type,
            state: "active" as const,
            criticality_bps: d.criticalityBps,
            propagation_bps: d.propagationBps,
            version: 1,
            source_kind: d.sourceKind,
            protocol_id: d.protocolId,
            operation: d.operation,
            chain_id: d.chainId,
            effective_at: 1700000000,
          },
          payload: {
            name: d.name ?? d.edgeId,
            description: d.description ?? d.edgeId,
            failureMode: d.failureMode ?? "Unspecified",
            fallback: d.fallback ?? { exists: false },
            contractReferences: d.contractReferences,
            evidence: d.evidence,
          },
        }));
      } catch {
        return [];
      }
    }

    return [];
  }

  async getResolvedEdges(): Promise<ResolvedEdge[]> {
    const records = await this.getEdgeRecords();
    const trustPolicy = this.trustService.getTrustPolicy();
    return resolveCurrentEdges(records, trustPolicy);
  }

  async getIndices(): Promise<GraphIndex> {
    const edges = await this.getResolvedEdges();
    return buildGraphIndex(edges);
  }

  async getFingerprint(): Promise<string> {
    const edges = await this.getResolvedEdges();
    const trustPolicy = this.trustService.getTrustPolicy();
    return computeGraphFingerprint(edges, trustPolicy.version);
  }

  async computeBlastRadius(
    rootDependencyId: string,
    rootSeverity: number = 100,
    rootHealthState: HealthState = "critical",
    rootDependencyType: string = "sequencer",
  ): Promise<BlastRadiusResult> {
    const edges = await this.getEdgeRecords();
    const trustPolicy = this.trustService.getTrustPolicy();

    return computeBlastRadius({
      rootDependencyId,
      rootDependencyType: (rootDependencyType || "sequencer") as DependencyType,
      rootHealthState,
      rootSeverity,
      edges,
      trustPolicy,
    });
  }

  async computeProtocolExposure(protocolId: string) {
    const edges = await this.getResolvedEdges();
    const protocolEdges = edges.filter((e) => e.protocolId === protocolId);
    const affectedOperations = new Set<string>();

    for (const e of protocolEdges) {
      if (e.dependentType === "operation" || e.operation) {
        affectedOperations.add(e.operation ?? e.dependentId);
      }
    }

    return {
      protocolId,
      totalOperations: affectedOperations.size,
      operations: Array.from(affectedOperations),
      graphFingerprint: await this.getFingerprint(),
    };
  }
}
