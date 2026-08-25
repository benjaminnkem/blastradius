import { createHash } from "node:crypto";
import type { HealthAssertionRecord, HealthObservation } from "@blastradius/schemas";

export interface GenerateObservationIdParams {
  dependencyId: string;
  methodId: string;
  methodVersion: number;
  observedAt: number;
  measurements: Record<string, string | number | boolean>;
}

export interface HealthAssertionLookupReader {
  listHealthAssertions(filter: {
    dependency_id: string;
  }): Promise<{ items: readonly HealthAssertionRecord[] }>;
}

/**
 * Computes a deterministic observation ID for idempotency and timeout reconciliation.
 */
export function generateObservationId(params: GenerateObservationIdParams): string {
  const sortedMeasurements = Object.keys(params.measurements)
    .sort()
    .reduce<Record<string, string | number | boolean>>((acc, key) => {
      acc[key] = params.measurements[key]!;
      return acc;
    }, {});

  const canonicalObj = {
    dependencyId: params.dependencyId,
    methodId: params.methodId,
    methodVersion: params.methodVersion,
    observedAt: params.observedAt,
    measurements: sortedMeasurements,
  };

  const hash = createHash("sha256").update(JSON.stringify(canonicalObj)).digest("hex");

  return `sha256:${hash}`;
}

/**
 * Creates observation ID directly from a normalized HealthObservation.
 */
export function getObservationIdFromObservation(obs: HealthObservation): string {
  return generateObservationId({
    dependencyId: obs.dependencyId,
    methodId: obs.methodId,
    methodVersion: obs.methodVersion,
    observedAt: obs.observedAt,
    measurements: obs.measurements,
  });
}

/**
 * Reconciles an Arkiv write whose outcome was unknown (e.g. timeout on receipt).
 * Queries Arkiv to verify if the entity was already written on-chain before retrying.
 */
export async function reconcileUnknownPublication(
  reader: HealthAssertionLookupReader,
  dependencyId: string,
  observationId: string,
): Promise<HealthAssertionRecord | null> {
  const result = await reader.listHealthAssertions({
    dependency_id: dependencyId,
  });

  const matching = result.items.find((item) => item.attributes.observation_id === observationId);

  return matching ?? null;
}
