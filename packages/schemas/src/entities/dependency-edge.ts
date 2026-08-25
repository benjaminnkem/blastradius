import { z } from "zod";
import {
  BpsSchema,
  ChainIdSchema,
  DependencyTypeSchema,
  EdgeStateSchema,
  PositiveVersionSchema,
  ProjectNamespaceSchema,
  SemanticIdSchema,
  SourceKindSchema,
  UnixTimestampSchema,
} from "../common.js";
import {
  ContractReferenceSchema,
  EvidenceReferenceSchema,
  FallbackInfoSchema,
} from "../evidence.js";
import { ArkivNormalizedMetadataSchema } from "./arkiv.js";

export const DependencyEdgeAttributesSchema = z
  .object({
    project: ProjectNamespaceSchema,
    kind: z.literal("dependency_edge"),
    edge_id: z.string().min(3).max(256),
    dependent_id: SemanticIdSchema,
    dependent_type: DependencyTypeSchema,
    dependency_id: SemanticIdSchema,
    dependency_type: DependencyTypeSchema,
    protocol_id: z.string().min(1).max(128).optional(),
    operation: z.string().min(1).max(128).optional(),
    chain_id: ChainIdSchema.optional(),
    criticality_bps: BpsSchema,
    propagation_bps: BpsSchema,
    version: PositiveVersionSchema,
    state: EdgeStateSchema,
    effective_at: UnixTimestampSchema,
    source_kind: SourceKindSchema,
  })
  .refine((data) => data.dependent_id !== data.dependency_id, {
    message:
      "Self-referencing dependency edges are forbidden: dependent_id and dependency_id must differ",
    path: ["dependent_id"],
  });

export type DependencyEdgeAttributes = z.infer<typeof DependencyEdgeAttributesSchema>;

export const DependencyEdgePayloadSchema = z.object({
  name: z.string().min(1).max(256),
  description: z.string().min(1).max(2048),
  failureMode: z.string().min(1).max(2048),
  fallback: FallbackInfoSchema.default({ exists: false }),
  evidence: z
    .array(EvidenceReferenceSchema)
    .min(1, "At least one evidence reference is required for a dependency edge")
    .max(20, "Evidence references cannot exceed 20 items"),
  contractReferences: z.array(ContractReferenceSchema).max(20).optional(),
  declaredByLabel: z.string().max(128).optional(),
});

export type DependencyEdgePayload = z.infer<typeof DependencyEdgePayloadSchema>;

export const DependencyEdgeRecordSchema = z.object({
  metadata: ArkivNormalizedMetadataSchema,
  attributes: DependencyEdgeAttributesSchema,
  payload: DependencyEdgePayloadSchema,
});

export type DependencyEdgeRecord = z.infer<typeof DependencyEdgeRecordSchema>;

export const DependencyEdgeWriteInputSchema = z.object({
  attributes: DependencyEdgeAttributesSchema,
  payload: DependencyEdgePayloadSchema,
  expiresInSec: z
    .number()
    .int()
    .positive()
    .min(60, "TTL must be at least 60 seconds")
    .default(2592000), // ~30 days default
});

export type DependencyEdgeWriteInput = z.infer<typeof DependencyEdgeWriteInputSchema>;
