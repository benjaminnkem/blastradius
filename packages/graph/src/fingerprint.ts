import { createHash } from "node:crypto";
import type { ResolvedEdge } from "./edges.js";

/**
 * Computes a deterministic cryptographic fingerprint of the active dependency graph.
 * Used for cache keys and proof verifiability.
 */
export function computeGraphFingerprint(
  edges: readonly ResolvedEdge[],
  policyVersion: number | string,
): string {
  const canonicalEdges = [...edges]
    .map((e) => ({
      dependentId: e.dependentId,
      dependencyId: e.dependencyId,
      version: e.version,
      state: e.state,
      criticalityBps: e.criticalityBps,
      propagationBps: e.propagationBps,
      publisherAddress: e.publisherAddress,
      publisherRole: e.publisherRole,
      entityKey: e.entityKey,
    }))
    .sort((a, b) => {
      const keyA = `${a.dependentId}:${a.dependencyId}:${a.version}`;
      const keyB = `${b.dependentId}:${b.dependencyId}:${b.version}`;
      return keyA.localeCompare(keyB);
    });

  const payload = {
    policyVersion: String(policyVersion),
    edges: canonicalEdges,
  };

  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}
