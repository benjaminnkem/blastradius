import type { DependencyDeclarationFile, DependencyEdgeRecord } from "@blastradius/schemas";

export type DiffAction = "NEW" | "VERSION_INCREMENT" | "UNCHANGED" | "REMOVED";

export interface EdgeDiffItem {
  edgeId: string;
  action: DiffAction;
  currentVersion?: number;
  targetVersion: number;
  changes?: string[];
  declaration?: DependencyDeclarationFile;
}

export interface GraphDiffResult {
  hasChanges: boolean;
  items: EdgeDiffItem[];
}

/**
 * Computes semantic differences between local declaration files and active on-chain Arkiv edges.
 */
export function computeGraphDiff(
  declarations: DependencyDeclarationFile[],
  onChainEdges: readonly DependencyEdgeRecord[],
): GraphDiffResult {
  // Group on-chain edges by edge_id and find the highest version for each
  const activeMap = new Map<string, DependencyEdgeRecord>();
  for (const edge of onChainEdges) {
    const existing = activeMap.get(edge.attributes.edge_id);
    if (!existing || edge.attributes.version > existing.attributes.version) {
      activeMap.set(edge.attributes.edge_id, edge);
    }
  }

  const items: EdgeDiffItem[] = [];
  const processedEdgeIds = new Set<string>();

  for (const decl of declarations) {
    processedEdgeIds.add(decl.edgeId);
    const existing = activeMap.get(decl.edgeId);

    if (!existing || existing.attributes.state === "removed") {
      items.push({
        edgeId: decl.edgeId,
        action: "NEW",
        targetVersion: 1,
        declaration: decl,
      });
      continue;
    }

    // Check for semantic differences
    const changes: string[] = [];
    if (existing.attributes.criticality_bps !== decl.criticalityBps) {
      changes.push(
        `criticality_bps: ${existing.attributes.criticality_bps} -> ${decl.criticalityBps}`,
      );
    }
    if (existing.attributes.propagation_bps !== decl.propagationBps) {
      changes.push(
        `propagation_bps: ${existing.attributes.propagation_bps} -> ${decl.propagationBps}`,
      );
    }
    if (existing.attributes.protocol_id !== decl.protocolId) {
      changes.push(`protocol_id: ${existing.attributes.protocol_id} -> ${decl.protocolId}`);
    }

    if (changes.length > 0) {
      items.push({
        edgeId: decl.edgeId,
        action: "VERSION_INCREMENT",
        currentVersion: existing.attributes.version,
        targetVersion: existing.attributes.version + 1,
        changes,
        declaration: decl,
      });
    } else {
      items.push({
        edgeId: decl.edgeId,
        action: "UNCHANGED",
        currentVersion: existing.attributes.version,
        targetVersion: existing.attributes.version,
        declaration: decl,
      });
    }
  }

  // Check for edges present on-chain but absent in local declarations (marked for removal)
  for (const [edgeId, activeEdge] of activeMap.entries()) {
    if (!processedEdgeIds.has(edgeId) && activeEdge.attributes.state !== "removed") {
      items.push({
        edgeId,
        action: "REMOVED",
        currentVersion: activeEdge.attributes.version,
        targetVersion: activeEdge.attributes.version + 1,
      });
    }
  }

  const hasChanges = items.some((item) => item.action !== "UNCHANGED");

  return {
    hasChanges,
    items,
  };
}
