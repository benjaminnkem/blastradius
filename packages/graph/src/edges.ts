import type {
  ContractReference,
  DependencyEdgeRecord,
  DependencyType,
  EdgeState,
  EvidenceReference,
  FallbackInfo,
  PublisherRole,
  TrustPolicy,
} from "@blastradius/schemas";
import { classifyPublisher } from "@blastradius/trust";

export interface ResolvedEdge {
  dependentId: string;
  dependencyId: string;
  dependentType: DependencyType;
  dependencyType: DependencyType;
  chainId?: number;
  protocolId?: string;
  version: number;
  state: EdgeState;
  criticalityBps: number;
  propagationBps: number;
  failureMode?: string;
  fallback: FallbackInfo;
  declaredByLabel?: string;
  evidence: readonly EvidenceReference[];
  contractReferences?: readonly ContractReference[];
  publisherAddress: string;
  publisherRole: PublisherRole;
  createdAtBlock?: number;
  entityKey: string;
}

/**
 * Resolves current active edges from a set of DependencyEdge records.
 *
 * Invariants:
 * 1. Edges must be authored by a trusted publisher matching target scope.
 * 2. Groups edges by (dependent_id, dependency_id) pair.
 * 3. Highest version supersedes older versions.
 * 4. An edge whose latest resolved version has state='removed' is pruned from active edges.
 * 5. Ties between different publishers prefer 'protocol' role over 'curator', then latest block.
 */
export function resolveCurrentEdges(
  edges: readonly DependencyEdgeRecord[],
  trustPolicy: TrustPolicy,
): ResolvedEdge[] {
  const groups = new Map<string, DependencyEdgeRecord[]>();

  for (const edge of edges) {
    const creator = edge.metadata.creator.toLowerCase();
    const role: PublisherRole = edge.attributes.source_kind === "protocol" ? "protocol" : "curator";

    const classification = classifyPublisher(
      creator,
      role,
      {
        dependencyId: edge.attributes.dependency_id,
        dependencyType: edge.attributes.dependency_type,
        protocolId: edge.attributes.protocol_id,
        chainId: edge.attributes.chain_id,
      },
      trustPolicy,
    );

    if (!classification.trusted) {
      continue;
    }

    const pairKey = `${edge.attributes.dependent_id}::${edge.attributes.dependency_id}`;
    const list = groups.get(pairKey) ?? [];
    list.push(edge);
    groups.set(pairKey, list);
  }

  const activeEdges: ResolvedEdge[] = [];

  for (const list of groups.values()) {
    // Sort highest version first, then protocol over curator, then createdAtBlock descending
    const sorted = [...list].sort((a, b) => {
      const vDiff = b.attributes.version - a.attributes.version;
      if (vDiff !== 0) return vDiff;

      const aIsProto = a.attributes.source_kind === "protocol" ? 1 : 0;
      const bIsProto = b.attributes.source_kind === "protocol" ? 1 : 0;
      if (bIsProto !== aIsProto) return bIsProto - aIsProto;

      return (b.metadata.createdAtBlock ?? 0) - (a.metadata.createdAtBlock ?? 0);
    });

    const newest = sorted[0];
    if (!newest) continue;

    // Prune removed edges
    if (newest.attributes.state === "removed") {
      continue;
    }

    activeEdges.push({
      dependentId: newest.attributes.dependent_id,
      dependencyId: newest.attributes.dependency_id,
      dependentType: newest.attributes.dependent_type,
      dependencyType: newest.attributes.dependency_type,
      chainId: newest.attributes.chain_id,
      protocolId: newest.attributes.protocol_id,
      version: newest.attributes.version,
      state: newest.attributes.state,
      criticalityBps: newest.attributes.criticality_bps,
      propagationBps: newest.attributes.propagation_bps,
      failureMode: newest.payload.failureMode,
      fallback: newest.payload.fallback,
      declaredByLabel: newest.payload.declaredByLabel,
      evidence: newest.payload.evidence,
      contractReferences: newest.payload.contractReferences,
      publisherAddress: newest.metadata.creator.toLowerCase(),
      publisherRole: newest.attributes.source_kind === "protocol" ? "protocol" : "curator",
      createdAtBlock: newest.metadata.createdAtBlock,
      entityKey: newest.metadata.key,
    });
  }

  return activeEdges;
}
