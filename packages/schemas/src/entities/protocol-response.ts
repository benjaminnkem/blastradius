import { z } from "zod";
import {
  ChainIdSchema,
  PositiveVersionSchema,
  ProjectNamespaceSchema,
  SemanticIdSchema,
  SeveritySchema,
  UnixTimestampSchema,
} from "../common.js";
import { FallbackInfoSchema } from "../evidence.js";
import { ArkivNormalizedMetadataSchema } from "./arkiv.js";

export const ProtocolResponseAttributesSchema = z.object({
  project: ProjectNamespaceSchema,
  kind: z.literal("protocol_response"),
  protocol_id: z.string().min(1).max(128),
  dependency_id: SemanticIdSchema,
  chain_id: ChainIdSchema.optional(),
  action: z.string().min(1).max(128),
  severity: SeveritySchema.optional(),
  policy_version: PositiveVersionSchema,
  response_at: UnixTimestampSchema,
});

export type ProtocolResponseAttributes = z.infer<typeof ProtocolResponseAttributesSchema>;

export const ProtocolResponsePayloadSchema = z.object({
  message: z.string().min(1).max(2048),
  affectedOperations: z.array(z.string().min(1).max(128)).max(50).optional(),
  fallback: FallbackInfoSchema.optional(),
  reference: z.string().url().max(2048).optional(),
});

export type ProtocolResponsePayload = z.infer<typeof ProtocolResponsePayloadSchema>;

export const ProtocolResponseRecordSchema = z.object({
  metadata: ArkivNormalizedMetadataSchema,
  attributes: ProtocolResponseAttributesSchema,
  payload: ProtocolResponsePayloadSchema,
});

export type ProtocolResponseRecord = z.infer<typeof ProtocolResponseRecordSchema>;

export const ProtocolResponseWriteInputSchema = z.object({
  attributes: ProtocolResponseAttributesSchema,
  payload: ProtocolResponsePayloadSchema,
  expiresInSec: z
    .number()
    .int()
    .positive()
    .min(3600, "TTL must be at least 1 hour")
    .max(604800, "TTL must not exceed 7 days")
    .default(86400), // 24 hours default
});

export type ProtocolResponseWriteInput = z.infer<typeof ProtocolResponseWriteInputSchema>;
