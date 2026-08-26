import type { ArkivReader } from "@blastradius/arkiv";
import type { ArkivEntityRecord } from "@blastradius/schemas";

export interface InspectResult {
  found: boolean;
  key: string;
  creator?: string;
  expiresInSec?: number;
  attributes?: Record<string, unknown>;
  payload?: unknown;
}

/**
 * Inspects a published Arkiv entity by entity key.
 */
export async function inspectEntity(
  reader: ArkivReader,
  entityKey: string,
): Promise<InspectResult> {
  const entity: ArkivEntityRecord | null = await reader.getEntity(entityKey);

  if (!entity) {
    return {
      found: false,
      key: entityKey,
    };
  }

  return {
    found: true,
    key: entityKey,
    creator: entity.metadata.creator,
    expiresInSec: entity.metadata.expiresAtBlock,
    attributes: entity.attributes,
    payload: entity.payload,
  };
}
