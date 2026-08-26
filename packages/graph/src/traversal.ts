import type {
  AffectedOperation,
  BlastRadiusResult,
  BlastRadiusSummary,
  DependencyEdgeRecord,
  DependencyType,
  GraphEdge,
  GraphLimits,
  GraphNode,
  HealthState,
  TruncationReason,
  TrustPolicy,
} from "@blastradius/schemas";
import { resolveCurrentEdges } from "./edges.js";
import { computeGraphFingerprint } from "./fingerprint.js";
import { buildGraphIndex } from "./index_builder.js";

export interface ComputeBlastRadiusInput {
  rootDependencyId: string;
  rootDependencyType: DependencyType;
  rootHealthState: HealthState;
  rootSeverity: number | null;
  edges: readonly DependencyEdgeRecord[];
  trustPolicy: TrustPolicy;
  limits?: Partial<GraphLimits>;
  now?: string;
}

interface PathRecord {
  path: string[];
  exposureBps: number;
  depth: number;
}

const DEFAULT_LIMITS: GraphLimits = {
  maxDepth: 10,
  maxNodes: 1000,
  maxEdges: 2000,
  maxPaths: 50,
  topPathsPerOperation: 3,
  deadlineMs: 5000,
};

/**
 * Computes the blast radius of a failing root dependency using cycle-safe reverse traversal.
 *
 * Invariants:
 * 1. Cycle-safe: detects and halts on cycles along each traversal path.
 * 2. Strict limit enforcement: enforces maxDepth, maxNodes, maxEdges, maxPaths, and deadlineMs.
 * 3. Exposure propagation uses integer basis points:
 *    E_dependent = Math.round(E_current * (criticality_bps / 10000) * (propagation_bps / 10000)).
 * 4. Multi-path handling: uses maximum path score as primary exposure; collects top-N explainable paths.
 * 5. Returns deterministic graph fingerprint.
 */
export function computeBlastRadius(input: ComputeBlastRadiusInput): BlastRadiusResult {
  const {
    rootDependencyId,
    rootDependencyType,
    rootHealthState,
    rootSeverity,
    edges,
    trustPolicy,
    now,
  } = input;

  const limits: GraphLimits = {
    ...DEFAULT_LIMITS,
    ...input.limits,
  };

  const deadline = Date.now() + limits.deadlineMs;

  // 1. Resolve active edges and build index
  const resolvedEdges = resolveCurrentEdges(edges, trustPolicy);
  const index = buildGraphIndex(resolvedEdges);
  const graphFingerprint = computeGraphFingerprint(resolvedEdges, trustPolicy.version);

  // 2. Traversal state
  const visitedNodes = new Map<string, GraphNode>();
  const visitedEdges = new Map<string, GraphEdge>();
  const pathsByOperation = new Map<
    string,
    { operationId: string; protocolId: string; paths: PathRecord[] }
  >();

  // Add root node
  visitedNodes.set(rootDependencyId, {
    id: rootDependencyId,
    type: rootDependencyType,
    label: rootDependencyId,
    healthState: rootHealthState,
    severity: rootSeverity,
  });

  let truncatedReason: TruncationReason | undefined;
  let totalPathsExplored = 0;

  // 3. Reverse traversal queue (BFS with branch ancestor tracking for cycle safety)
  interface QueueItem {
    currId: string;
    exposureBps: number;
    depth: number;
    path: string[];
  }

  const queue: QueueItem[] = [
    {
      currId: rootDependencyId,
      exposureBps: 10000, // 100% root exposure
      depth: 0,
      path: [rootDependencyId],
    },
  ];

  while (queue.length > 0) {
    if (Date.now() > deadline) {
      truncatedReason = "deadline";
      break;
    }

    const item = queue.shift()!;
    const { currId, exposureBps, depth, path } = item;

    if (depth >= limits.maxDepth) {
      truncatedReason = "max_depth";
      continue;
    }

    const outgoingEdges = index.reverseAdjacency.get(currId) ?? [];

    for (const edge of outgoingEdges) {
      if (Date.now() > deadline) {
        truncatedReason = "deadline";
        break;
      }

      // Check cycle: if dependent node is already in this path, stop cycle
      if (path.includes(edge.dependentId)) {
        continue;
      }

      // Calculate propagated exposure
      const criticalityFactor = edge.criticalityBps / 10000;
      const propagationFactor = edge.propagationBps / 10000;
      const nextExposureBps = Math.min(
        10000,
        Math.max(0, Math.round(exposureBps * criticalityFactor * propagationFactor)),
      );

      // If attenuated to 0, prune branch
      if (nextExposureBps === 0) {
        continue;
      }

      // Check edge limits
      const edgeId = `${edge.dependentId}->${edge.dependencyId}`;
      if (!visitedEdges.has(edgeId)) {
        if (visitedEdges.size >= limits.maxEdges) {
          truncatedReason = "max_edges";
          break;
        }
        visitedEdges.set(edgeId, {
          id: edgeId,
          from: edge.dependentId,
          to: edge.dependencyId,
          dependentId: edge.dependentId,
          dependencyId: edge.dependencyId,
          dependentType: edge.dependentType,
          dependencyType: edge.dependencyType,
          criticalityBps: edge.criticalityBps,
          propagationBps: edge.propagationBps,
          version: edge.version,
          state: edge.state,
          creator: edge.publisherAddress as `0x${string}`,
        });
      }

      // Check node limits
      if (!visitedNodes.has(edge.dependentId)) {
        if (visitedNodes.size >= limits.maxNodes) {
          truncatedReason = "max_nodes";
          break;
        }
        const scaledSeverity =
          rootSeverity !== null
            ? Math.min(100, Math.max(0, Math.round((rootSeverity * nextExposureBps) / 10000)))
            : null;

        const nodeInfo: GraphNode = index.nodes.get(edge.dependentId) ?? {
          id: edge.dependentId,
          type: edge.dependentType,
          label: edge.dependentId,
          protocolId: edge.protocolId,
          chainId: edge.chainId,
          healthState: rootHealthState,
          severity: scaledSeverity,
        };

        visitedNodes.set(edge.dependentId, {
          ...nodeInfo,
          healthState: rootHealthState,
          severity: scaledSeverity,
        });
      }

      const nextDepth = depth + 1;
      const nextPath = [...path, edge.dependentId];

      totalPathsExplored++;
      if (totalPathsExplored >= limits.maxPaths) {
        truncatedReason = "max_paths";
      }

      // If node is an operation, record the path
      if (edge.dependentType === "operation" || Boolean(edge.operation)) {
        const protocolId = edge.protocolId ?? "unknown-protocol";
        const existing = pathsByOperation.get(edge.dependentId) ?? {
          operationId: edge.dependentId,
          protocolId,
          paths: [],
        };
        existing.paths.push({
          path: nextPath,
          exposureBps: nextExposureBps,
          depth: nextDepth,
        });
        pathsByOperation.set(edge.dependentId, existing);
      }

      if (!truncatedReason) {
        queue.push({
          currId: edge.dependentId,
          exposureBps: nextExposureBps,
          depth: nextDepth,
          path: nextPath,
        });
      }
    }

    if (
      truncatedReason &&
      (truncatedReason === "deadline" ||
        truncatedReason === "max_nodes" ||
        truncatedReason === "max_edges")
    ) {
      break;
    }
  }

  // 4. Aggregate affected operations
  const operations: AffectedOperation[] = [];

  for (const { operationId, protocolId, paths } of pathsByOperation.values()) {
    // Sort paths by highest exposure descending
    paths.sort((a, b) => b.exposureBps - a.exposureBps);

    const maxExposureBps = paths[0]?.exposureBps ?? 0;
    const blastScore =
      rootSeverity !== null
        ? Math.min(100, Math.max(0, Math.round((rootSeverity * maxExposureBps) / 10000)))
        : Math.min(100, Math.max(0, Math.round(maxExposureBps / 100)));

    const topPaths = paths.slice(0, limits.topPathsPerOperation).map((p) => p.path);

    const primaryPath = paths[0]?.path;
    const operationName = operationId.split(":").pop() ?? operationId;

    operations.push({
      operationId,
      protocolId,
      operation: operationName,
      blastScore,
      pathCount: paths.length,
      topPaths,
      primaryPath,
    });
  }

  // Sort operations by blastScore descending
  operations.sort((a, b) => b.blastScore - a.blastScore);

  // 5. Aggregate summary metrics
  const affectedProtocols = new Set<string>();
  let totalDependencies = 0;
  let criticalOperations = 0;

  for (const node of visitedNodes.values()) {
    if (node.protocolId) {
      affectedProtocols.add(node.protocolId);
    }
    if (node.id !== rootDependencyId) {
      totalDependencies++;
    }
  }

  for (const op of operations) {
    if (op.blastScore >= 70) {
      criticalOperations++;
    }
  }

  const summary: BlastRadiusSummary = {
    dependenciesAffected: totalDependencies,
    protocolsAffected: affectedProtocols.size,
    operationsAffected: operations.length,
    criticalOperations,
  };

  const complete = truncatedReason === undefined;

  return {
    root: {
      id: rootDependencyId,
      dependencyType: rootDependencyType,
      healthState: rootHealthState,
      severity: rootSeverity,
    },
    summary,
    operations,
    graph: {
      nodes: Array.from(visitedNodes.values()),
      edges: Array.from(visitedEdges.values()),
    },
    meta: {
      complete,
      truncatedReason,
      computedAt: now ?? new Date().toISOString(),
      trustPolicyVersion: String(trustPolicy.version),
      graphFingerprint,
      stale: false,
    },
  };
}
