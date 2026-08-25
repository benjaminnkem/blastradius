import { z } from "zod";
import {
  BpsSchema,
  ChainIdSchema,
  DependencyTypeSchema,
  EdgeStateSchema,
  EvmAddressSchema,
  HealthStateSchema,
  PositiveVersionSchema,
  SemanticIdSchema,
  SeveritySchema,
} from "./common.js";

export const GraphNodeSchema = z.object({
  id: SemanticIdSchema,
  type: DependencyTypeSchema,
  label: z.string().min(1).max(256),
  chainId: ChainIdSchema.optional(),
  protocolId: z.string().max(128).optional(),
  healthState: HealthStateSchema.default("unknown"),
  severity: SeveritySchema.nullable().default(null),
});
export type GraphNode = z.infer<typeof GraphNodeSchema>;

export const GraphEdgeSchema = z.object({
  id: z.string().min(1).max(256),
  from: SemanticIdSchema, // dependent_id
  to: SemanticIdSchema, // dependency_id
  dependentId: SemanticIdSchema,
  dependencyId: SemanticIdSchema,
  dependentType: DependencyTypeSchema,
  dependencyType: DependencyTypeSchema,
  criticalityBps: BpsSchema,
  propagationBps: BpsSchema,
  version: PositiveVersionSchema,
  state: EdgeStateSchema,
  creator: EvmAddressSchema.optional(),
});
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;

export const AffectedOperationSchema = z.object({
  operationId: SemanticIdSchema,
  protocolId: z.string().min(1).max(128),
  operation: z.string().min(1).max(128),
  blastScore: SeveritySchema,
  pathCount: z.number().int().min(1),
  topPaths: z.array(z.array(SemanticIdSchema)).min(1),
  primaryPath: z.array(SemanticIdSchema).optional(),
});
export type AffectedOperation = z.infer<typeof AffectedOperationSchema>;

export const BlastRadiusSummarySchema = z.object({
  dependenciesAffected: z.number().int().min(0),
  protocolsAffected: z.number().int().min(0),
  operationsAffected: z.number().int().min(0),
  criticalOperations: z.number().int().min(0),
});
export type BlastRadiusSummary = z.infer<typeof BlastRadiusSummarySchema>;

export const TruncationReasonSchema = z.enum([
  "max_depth",
  "max_nodes",
  "max_edges",
  "max_paths",
  "deadline",
  "max_pages",
  "max_records",
]);
export type TruncationReason = z.infer<typeof TruncationReasonSchema>;

export const BlastRadiusMetaSchema = z.object({
  complete: z.boolean(),
  truncatedReason: TruncationReasonSchema.optional(),
  computedAt: z.string().datetime(),
  trustPolicyVersion: z.string().min(1),
  graphFingerprint: z.string().min(1),
  stale: z.boolean().default(false),
  staleAgeSec: z.number().int().min(0).optional(),
});
export type BlastRadiusMeta = z.infer<typeof BlastRadiusMetaSchema>;

export const BlastRadiusResultSchema = z.object({
  root: z.object({
    id: SemanticIdSchema,
    dependencyType: DependencyTypeSchema,
    healthState: HealthStateSchema,
    severity: SeveritySchema.nullable(),
  }),
  summary: BlastRadiusSummarySchema,
  operations: z.array(AffectedOperationSchema),
  graph: z.object({
    nodes: z.array(GraphNodeSchema),
    edges: z.array(GraphEdgeSchema),
  }),
  meta: BlastRadiusMetaSchema,
});
export type BlastRadiusResult = z.infer<typeof BlastRadiusResultSchema>;

export const GraphLimitsSchema = z.object({
  maxDepth: z.number().int().positive().default(10),
  maxNodes: z.number().int().positive().default(1000),
  maxEdges: z.number().int().positive().default(2000),
  maxPaths: z.number().int().positive().default(50),
  topPathsPerOperation: z.number().int().positive().default(3),
  deadlineMs: z.number().int().positive().default(5000),
});
export type GraphLimits = z.infer<typeof GraphLimitsSchema>;

export function createBoundedResultSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    complete: z.boolean(),
    truncatedReason: TruncationReasonSchema.optional(),
  });
}
