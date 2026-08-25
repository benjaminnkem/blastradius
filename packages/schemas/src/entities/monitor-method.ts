import { z } from "zod";
import { DependencyTypeSchema, PositiveVersionSchema, ProjectNamespaceSchema } from "../common.js";
import { ArkivNormalizedMetadataSchema } from "./arkiv.js";

export const MonitorMethodAttributesSchema = z.object({
  project: ProjectNamespaceSchema,
  kind: z.literal("monitor_method"),
  method_id: z.string().min(1).max(128),
  dependency_type: DependencyTypeSchema,
  version: PositiveVersionSchema,
  min_sources: z.number().int().min(1).max(100),
  sample_interval_sec: z.number().int().min(1).max(3600),
});

export type MonitorMethodAttributes = z.infer<typeof MonitorMethodAttributesSchema>;

export const MonitorMethodPayloadSchema = z.object({
  name: z.string().min(1).max(256),
  description: z.string().min(1).max(2048),
  checks: z.array(z.string().min(1).max(256)).min(1).max(50),
  thresholds: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])),
  limitations: z.array(z.string().min(1).max(512)).max(50).optional(),
  source: z.string().max(1024).optional(),
});

export type MonitorMethodPayload = z.infer<typeof MonitorMethodPayloadSchema>;

export const MonitorMethodRecordSchema = z.object({
  metadata: ArkivNormalizedMetadataSchema,
  attributes: MonitorMethodAttributesSchema,
  payload: MonitorMethodPayloadSchema,
});

export type MonitorMethodRecord = z.infer<typeof MonitorMethodRecordSchema>;

export const MonitorMethodWriteInputSchema = z.object({
  attributes: MonitorMethodAttributesSchema,
  payload: MonitorMethodPayloadSchema,
  expiresInSec: z.number().int().positive().min(60).default(2592000), // ~30 days
});

export type MonitorMethodWriteInput = z.infer<typeof MonitorMethodWriteInputSchema>;
