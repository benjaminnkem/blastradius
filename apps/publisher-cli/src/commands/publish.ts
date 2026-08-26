import type { ArkivWriter } from "@blastradius/arkiv";
import type {
  DependencyDeclarationFile,
  DependencyEdgeAttributes,
  DependencyEdgePayload,
  DependencyEdgeWriteInput,
  PublisherRole,
  TrustPolicy,
} from "@blastradius/schemas";
import { classifyPublisher } from "@blastradius/trust";

export interface PublishOptions {
  dryRun?: boolean;
  ttlSec?: number;
  trustPolicy?: TrustPolicy;
}

export interface PublishResult {
  dryRun: boolean;
  edgeId: string;
  version: number;
  entityKey?: string;
  txHash?: string;
  publisherAddress?: string;
  sourceKind: "curator" | "protocol";
}

/**
 * Publishes a DependencyDeclarationFile to Arkiv as a DependencyEdge entity.
 */
export async function publishDependencyDeclaration(
  declaration: DependencyDeclarationFile,
  writer: ArkivWriter,
  privateKey: string,
  version: number,
  options?: PublishOptions,
): Promise<PublishResult> {
  const dryRun = options?.dryRun ?? false;
  const role: PublisherRole = declaration.sourceKind === "protocol" ? "protocol" : "curator";

  // 1. Trust policy check if provided
  if (options?.trustPolicy) {
    const classification = classifyPublisher(
      "0x0000000000000000000000000000000000000000",
      role,
      {
        dependencyId: declaration.dependency.id,
        dependencyType: declaration.dependency.type,
        protocolId: declaration.protocolId,
        chainId: declaration.chainId,
      },
      options.trustPolicy,
    );

    if (!classification.trusted && !dryRun) {
      throw new Error(`Publisher check failed for ${declaration.edgeId}: ${classification.reason}`);
    }
  }

  const attributes: DependencyEdgeAttributes = {
    project: "blastradius-v1",
    kind: "dependency_edge",
    edge_id: declaration.edgeId,
    dependent_id: declaration.dependent.id,
    dependent_type: declaration.dependent.type,
    dependency_id: declaration.dependency.id,
    dependency_type: declaration.dependency.type,
    state: "active",
    criticality_bps: declaration.criticalityBps,
    propagation_bps: declaration.propagationBps,
    version,
    source_kind: declaration.sourceKind,
    protocol_id: declaration.protocolId,
    operation: declaration.operation,
    chain_id: declaration.chainId,
    effective_at: Math.floor(Date.now() / 1000),
  };

  const payload: DependencyEdgePayload = {
    name: declaration.name ?? declaration.edgeId,
    description: declaration.description ?? declaration.edgeId,
    failureMode: declaration.failureMode ?? "Unspecified failure mode",
    fallback: declaration.fallback ?? { exists: false },
    contractReferences: declaration.contractReferences,
    evidence: declaration.evidence,
  };

  const input: DependencyEdgeWriteInput = {
    attributes,
    payload,
    expiresInSec: options?.ttlSec ?? 2592000, // default 30 days
  };

  if (dryRun) {
    return {
      dryRun: true,
      edgeId: declaration.edgeId,
      version,
      sourceKind: declaration.sourceKind,
    };
  }

  const writeResult = await writer.publishDependencyEdge(input, privateKey);

  return {
    dryRun: false,
    edgeId: declaration.edgeId,
    version,
    entityKey: writeResult.entityKey,
    txHash: writeResult.txHash,
    publisherAddress: writeResult.creator,
    sourceKind: declaration.sourceKind,
  };
}
