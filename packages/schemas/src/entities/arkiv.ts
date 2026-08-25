import { z } from "zod";
import { EvmAddressSchema, ProjectNamespaceSchema, UnixTimestampSchema } from "../common.js";

export const ARKIV_ENTITY_KINDS = [
  "dependency_edge",
  "health_assertion",
  "monitor_method",
  "protocol_response",
] as const;

export const ArkivEntityKindSchema = z.enum(ARKIV_ENTITY_KINDS);
export type ArkivEntityKind = z.infer<typeof ArkivEntityKindSchema>;

export const ArkivNormalizedMetadataSchema = z.object({
  key: z.string().min(1, "Arkiv entity key must not be empty"),
  creator: EvmAddressSchema,
  owner: EvmAddressSchema,
  createdAtBlock: z.number().int().positive("Created at block must be positive"),
  expiresAtBlock: z.number().int().positive("Expires at block must be positive"),
  createdAtTime: UnixTimestampSchema.optional(),
  expiresAtTime: UnixTimestampSchema.optional(),
});
export type ArkivNormalizedMetadata = z.infer<typeof ArkivNormalizedMetadataSchema>;

export interface ArkivEntityRecord<
  TAttributes extends Record<string, unknown> = Record<string, unknown>,
  TPayload = unknown,
> {
  metadata: ArkivNormalizedMetadata;
  attributes: TAttributes;
  payload: TPayload;
}

export const BaseArkivAttributesSchema = z.object({
  project: ProjectNamespaceSchema,
  kind: ArkivEntityKindSchema,
});
export type BaseArkivAttributes = z.infer<typeof BaseArkivAttributesSchema>;
