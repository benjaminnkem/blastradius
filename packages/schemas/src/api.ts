import { z } from "zod";
import {
  AgreementStateSchema,
  ChainIdSchema,
  DependencyTypeSchema,
  HealthStateSchema,
  SemanticIdSchema,
  SeveritySchema,
} from "./common.js";
import { ArkivEntityKindSchema, ArkivNormalizedMetadataSchema } from "./entities/arkiv.js";
import { MonitorMethodRecordSchema } from "./entities/monitor-method.js";
import { ProtocolResponseRecordSchema } from "./entities/protocol-response.js";
import { AffectedOperationSchema, BlastRadiusSummarySchema, GraphNodeSchema } from "./graph.js";
import { HealthConsensusSchema } from "./monitoring.js";
import { PublisherClassificationSchema } from "./trust.js";

export const API_ERROR_CODES = [
  "ARKIV_QUERY_UNAVAILABLE",
  "ARKIV_WRITE_REJECTED",
  "ARKIV_WRITE_UNKNOWN",
  "DEPENDENCY_NOT_FOUND",
  "PROTOCOL_NOT_FOUND",
  "METHOD_NOT_FOUND",
  "ENTITY_NOT_FOUND",
  "INVALID_REQUEST",
  "RATE_LIMIT_EXCEEDED",
  "UNTRUSTED_PUBLISHER",
  "GRAPH_DEADLINE_EXCEEDED",
  "GRAPH_LIMIT_EXCEEDED",
  "SERVICE_UNAVAILABLE",
  "INTERNAL_ERROR",
] as const;

export const ApiErrorCodeSchema = z.enum(API_ERROR_CODES);
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

export const ApiErrorDetailsSchema = z.object({
  code: ApiErrorCodeSchema,
  message: z.string().min(1),
  retryable: z.boolean().default(false),
  requestId: z.string().min(1),
  details: z.unknown().optional(),
});
export type ApiErrorDetails = z.infer<typeof ApiErrorDetailsSchema>;

export const ApiErrorEnvelopeSchema = z.object({
  error: ApiErrorDetailsSchema,
});
export type ApiErrorEnvelope = z.infer<typeof ApiErrorEnvelopeSchema>;

export const PaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200, "Maximum page size is 200").default(50),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginationResponseSchema = z.object({
  nextCursor: z.string().nullable(),
  total: z.number().int().min(0).optional(),
});
export type PaginationResponse = z.infer<typeof PaginationResponseSchema>;

export const IncidentItemSchema = z.object({
  dependency: z.object({
    id: SemanticIdSchema,
    type: DependencyTypeSchema,
    label: z.string().min(1),
    chainId: ChainIdSchema.optional(),
  }),
  health: z.object({
    aggregateState: HealthStateSchema,
    aggregateSeverity: SeveritySchema.nullable(),
    agreement: AgreementStateSchema,
    activeTrustedCreators: z.number().int().min(0),
    byState: z.record(HealthStateSchema, z.number().int().min(0)),
  }),
  exposure: z.object({
    protocolsAffected: z.number().int().min(0),
    operationsAffected: z.number().int().min(0),
    criticalOperations: z.number().int().min(0),
    complete: z.boolean(),
  }),
  computedAt: z.string().datetime(),
});
export type IncidentItem = z.infer<typeof IncidentItemSchema>;

export const IncidentListResponseSchema = z.object({
  data: z.array(IncidentItemSchema),
  page: PaginationResponseSchema,
});
export type IncidentListResponse = z.infer<typeof IncidentListResponseSchema>;

export const DependencyDetailResponseSchema = z.object({
  dependency: GraphNodeSchema,
  health: HealthConsensusSchema,
  responses: z.array(ProtocolResponseRecordSchema),
  methods: z.array(MonitorMethodRecordSchema),
  directExposure: BlastRadiusSummarySchema,
});
export type DependencyDetailResponse = z.infer<typeof DependencyDetailResponseSchema>;

export const ProtocolExposureIncidentSchema = z.object({
  rootDependencyId: SemanticIdSchema,
  rootDependencyType: DependencyTypeSchema,
  rootSeverity: SeveritySchema.nullable(),
  operations: z.array(AffectedOperationSchema),
});
export type ProtocolExposureIncident = z.infer<typeof ProtocolExposureIncidentSchema>;

export const ProtocolExposureResponseSchema = z.object({
  protocolId: z.string().min(1),
  incidents: z.array(ProtocolExposureIncidentSchema),
  summary: BlastRadiusSummarySchema,
  computedAt: z.string().datetime(),
});
export type ProtocolExposureResponse = z.infer<typeof ProtocolExposureResponseSchema>;

export const ProofResponseSchema = z.object({
  entityKey: z.string(),
  kind: ArkivEntityKindSchema,
  metadata: ArkivNormalizedMetadataSchema,
  attributes: z.record(z.string(), z.unknown()),
  payload: z.unknown(),
  trust: PublisherClassificationSchema,
});
export type ProofResponse = z.infer<typeof ProofResponseSchema>;
