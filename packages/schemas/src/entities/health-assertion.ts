import { z } from "zod";
import {
  BpsSchema,
  ChainIdSchema,
  DependencyTypeSchema,
  HealthStateSchema,
  PositiveVersionSchema,
  ProjectNamespaceSchema,
  SemanticIdSchema,
  SeveritySchema,
  UnixTimestampSchema,
} from "../common.js";
import { EvidenceHashSchema } from "../evidence.js";
import { ArkivNormalizedMetadataSchema } from "./arkiv.js";

export const HealthAssertionAttributesSchema = z.object({
  project: ProjectNamespaceSchema,
  kind: z.literal("health_assertion"),
  observation_id: z.string().min(3).max(256),
  dependency_id: SemanticIdSchema,
  dependency_type: DependencyTypeSchema,
  chain_id: ChainIdSchema.optional(),
  state: HealthStateSchema,
  severity: SeveritySchema,
  confidence_bps: BpsSchema,
  observed_at: UnixTimestampSchema,
  observed_block: z.number().int().positive().optional(),
  method_id: z.string().min(1).max(128),
  method_version: PositiveVersionSchema,

  // Optional method-specific indexed integer attributes
  safe_lag_sec: z.number().int().min(0).optional(),
  block_gap_sec: z.number().int().min(0).optional(),
  provider_count: z.number().int().min(0).optional(),
  latency_ms: z.number().int().min(0).optional(),
  staleness_sec: z.number().int().min(0).optional(),
});

export type HealthAssertionAttributes = z.infer<typeof HealthAssertionAttributesSchema>;

export const HealthAssertionPayloadSchema = z.object({
  summary: z.string().min(1).max(1024),
  measurements: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])),
  evidence: EvidenceHashSchema.optional(),
  providerAgreement: z
    .object({
      agreeing: z.number().int().min(0),
      total: z.number().int().min(0),
    })
    .optional(),
});

export type HealthAssertionPayload = z.infer<typeof HealthAssertionPayloadSchema>;

export const HealthAssertionRecordSchema = z.object({
  metadata: ArkivNormalizedMetadataSchema,
  attributes: HealthAssertionAttributesSchema,
  payload: HealthAssertionPayloadSchema,
});

export type HealthAssertionRecord = z.infer<typeof HealthAssertionRecordSchema>;

export const HealthAssertionWriteInputSchema = z.object({
  attributes: HealthAssertionAttributesSchema,
  payload: HealthAssertionPayloadSchema,
  expiresInSec: z
    .number()
    .int("TTL must be integer seconds")
    .positive("TTL must be positive")
    .max(
      3600,
      "HealthAssertion TTL must not exceed 1 hour (designed for ~300s ephemeral assertions)",
    )
    .default(300),
});

export type HealthAssertionWriteInput = z.infer<typeof HealthAssertionWriteInputSchema>;
