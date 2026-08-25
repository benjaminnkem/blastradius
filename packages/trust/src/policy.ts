import { createHash } from "node:crypto";
import { type TrustPolicy, TrustPolicySchema } from "@blastradius/schemas";

/**
 * Validates a raw object as a canonical TrustPolicy.
 */
export function validateTrustPolicy(policy: unknown): TrustPolicy {
  return TrustPolicySchema.parse(policy);
}

/**
 * Computes a deterministic SHA-256 checksum for a TrustPolicy.
 * Invariant: Sorts publishers deterministically before hashing.
 */
export function computeTrustPolicyChecksum(policy: TrustPolicy): string {
  const normalizedPublishers = [...policy.publishers]
    .map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address.toLowerCase(),
      roles: [...p.roles].sort(),
      enabled: p.enabled,
      scopes: {
        dependencyTypes: p.scopes?.dependencyTypes
          ? [...p.scopes.dependencyTypes].sort()
          : undefined,
        dependencies: p.scopes?.dependencies ? [...p.scopes.dependencies].sort() : undefined,
        methods: p.scopes?.methods ? [...p.scopes.methods].sort() : undefined,
        protocols: p.scopes?.protocols ? [...p.scopes.protocols].sort() : undefined,
        chains: p.scopes?.chains ? [...p.scopes.chains].sort((a, b) => a - b) : undefined,
      },
    }))
    .sort((a, b) => a.address.localeCompare(b.address));

  const canonicalObj = {
    version: policy.version,
    policyId: policy.policyId,
    quorum: {
      minMonitors: policy.quorum.minMonitors,
      agreementThresholdBps: policy.quorum.agreementThresholdBps,
      tieBreakerRule: policy.quorum.tieBreakerRule,
    },
    publishers: normalizedPublishers,
  };

  return createHash("sha256").update(JSON.stringify(canonicalObj)).digest("hex");
}
