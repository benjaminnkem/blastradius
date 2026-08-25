import type { GraphNode } from "@blastradius/schemas";
import type { ResolvedEdge } from "./edges.js";

export interface GraphIndex {
  reverseAdjacency: Map<string, ResolvedEdge[]>;
  forwardAdjacency: Map<string, ResolvedEdge[]>;
  nodes: Map<string, GraphNode>;
}

/**
 * Builds reverse and forward adjacency indexes from active resolved edges.
 */
export function buildGraphIndex(edges: readonly ResolvedEdge[]): GraphIndex {
  const reverseAdjacency = new Map<string, ResolvedEdge[]>();
  const forwardAdjacency = new Map<string, ResolvedEdge[]>();
  const nodes = new Map<string, GraphNode>();

  for (const edge of edges) {
    // 1. Reverse adjacency (dependency_id -> incoming dependent edges)
    const revList = reverseAdjacency.get(edge.dependencyId) ?? [];
    revList.push(edge);
    reverseAdjacency.set(edge.dependencyId, revList);

    // 2. Forward adjacency (dependent_id -> outgoing dependency edges)
    const fwdList = forwardAdjacency.get(edge.dependentId) ?? [];
    fwdList.push(edge);
    forwardAdjacency.set(edge.dependentId, fwdList);

    // 3. Populate node records
    if (!nodes.has(edge.dependencyId)) {
      nodes.set(edge.dependencyId, {
        id: edge.dependencyId,
        type: edge.dependencyType,
        label: edge.dependencyId,
        chainId: edge.chainId,
        healthState: "unknown",
        severity: null,
      });
    }

    if (!nodes.has(edge.dependentId)) {
      nodes.set(edge.dependentId, {
        id: edge.dependentId,
        type: edge.dependentType,
        label: edge.dependentId,
        protocolId: edge.protocolId,
        chainId: edge.chainId,
        healthState: "unknown",
        severity: null,
      });
    }
  }

  return {
    reverseAdjacency,
    forwardAdjacency,
    nodes,
  };
}
