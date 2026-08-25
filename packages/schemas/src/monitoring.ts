import { z } from "zod";
import {
  AgreementStateSchema,
  BpsSchema,
  ChainIdSchema,
  DependencyTypeSchema,
  EvmAddressSchema,
  HealthStateSchema,
  PositiveVersionSchema,
  SemanticIdSchema,
  SeveritySchema,
  UnixTimestampSchema,
} from "./common.js";
import { EvidenceHashSchema } from "./evidence.js";

export const HealthObservationSchema = z.object({
  dependencyId: SemanticIdSchema,
  dependencyType: DependencyTypeSchema,
  chainId: ChainIdSchema.optional(),
  state: HealthStateSchema,
  severity: SeveritySchema,
  confidenceBps: BpsSchema,
  observedAt: UnixTimestampSchema,
  observedBlock: z.number().int().positive().optional(),
  methodId: z.string().min(1).max(128),
  methodVersion: PositiveVersionSchema,
  measurements: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])),
  evidence: EvidenceHashSchema.optional(),
});
export type HealthObservation = z.infer<typeof HealthObservationSchema>;

export const ResolvedCreatorObservationSchema = z.object({
  creator: EvmAddressSchema,
  publisherId: z.string().optional(),
  observationId: z.string(),
  state: HealthStateSchema,
  severity: SeveritySchema,
  confidenceBps: BpsSchema,
  observedAt: UnixTimestampSchema,
  observedBlock: z.number().int().positive().optional(),
  methodId: z.string(),
  methodVersion: PositiveVersionSchema,
  entityKey: z.string(),
  expiresAtBlock: z.number().int().positive(),
});
export type ResolvedCreatorObservation = z.infer<typeof ResolvedCreatorObservationSchema>;

export const HealthConsensusSchema = z.object({
  dependencyId: SemanticIdSchema,
  dependencyType: DependencyTypeSchema,
  aggregateState: HealthStateSchema,
  aggregateSeverity: SeveritySchema.nullable(),
  coverage: z.object({
    activeTrustedCreators: z.number().int().min(0),
    expectedTrustedCreators: z.number().int().min(0).optional(),
    minimumRequired: z.number().int().min(1),
  }),
  agreement: AgreementStateSchema,
  byState: z.record(HealthStateSchema, z.number().int().min(0)),
  observations: z.array(ResolvedCreatorObservationSchema),
  computedAt: z.string().datetime({ message: "computedAt must be ISO-8601 string" }),
});
export type HealthConsensus = z.infer<typeof HealthConsensusSchema>;

// Monitor Target Configurations
export const SequencerTargetConfigSchema = z.object({
  type: z.literal("sequencer"),
  targetId: z.string().min(1).max(128),
  dependencyId: SemanticIdSchema,
  chainId: ChainIdSchema,
  methodId: z.string().min(1).max(128).default("sequencer-health-v1"),
  methodVersion: PositiveVersionSchema.default(1),
  rpcUrls: z.array(z.string().url()).min(1, "At least one RPC URL is required"),
  thresholds: z
    .object({
      warningSafeLagSec: z.number().int().positive().default(120),
      criticalSafeLagSec: z.number().int().positive().default(600),
      maxBlockGapSec: z.number().int().positive().default(60),
    })
    .default({
      warningSafeLagSec: 120,
      criticalSafeLagSec: 600,
      maxBlockGapSec: 60,
    }),
  sampleIntervalSec: z.number().int().positive().default(30),
  enabled: z.boolean().default(true),
});
export type SequencerTargetConfig = z.infer<typeof SequencerTargetConfigSchema>;

export const OracleTargetConfigSchema = z.object({
  type: z.literal("oracle"),
  targetId: z.string().min(1).max(128),
  dependencyId: SemanticIdSchema,
  chainId: ChainIdSchema,
  feedAddress: EvmAddressSchema,
  feedDecimals: z.number().int().min(0).max(36).default(8),
  heartbeatSec: z.number().int().positive(),
  deviationBps: BpsSchema.optional(),
  methodId: z.string().min(1).max(128).default("chainlink-feed-v1"),
  methodVersion: PositiveVersionSchema.default(1),
  rpcUrls: z.array(z.string().url()).min(1),
  secondarySourceUrl: z.string().url().optional(),
  sampleIntervalSec: z.number().int().positive().default(30),
  enabled: z.boolean().default(true),
});
export type OracleTargetConfig = z.infer<typeof OracleTargetConfigSchema>;

export const RpcTargetConfigSchema = z.object({
  type: z.literal("rpc"),
  targetId: z.string().min(1).max(128),
  dependencyId: SemanticIdSchema,
  chainId: ChainIdSchema,
  providers: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        url: z.string().url(),
        weight: z.number().int().positive().default(1),
      }),
    )
    .min(1, "At least one RPC provider is required"),
  methodId: z.string().min(1).max(128).default("rpc-provider-v1"),
  methodVersion: PositiveVersionSchema.default(1),
  latencyThresholdMs: z.number().int().positive().default(2000),
  sampleIntervalSec: z.number().int().positive().default(15),
  enabled: z.boolean().default(true),
});
export type RpcTargetConfig = z.infer<typeof RpcTargetConfigSchema>;

export const MonitorTargetConfigSchema = z.discriminatedUnion("type", [
  SequencerTargetConfigSchema,
  OracleTargetConfigSchema,
  RpcTargetConfigSchema,
]);
export type MonitorTargetConfig = z.infer<typeof MonitorTargetConfigSchema>;

export const MonitorTargetsFileSchema = z.object({
  version: PositiveVersionSchema.default(1),
  targets: z
    .array(MonitorTargetConfigSchema)
    .min(1, "Monitor targets file must declare at least one target"),
});
export type MonitorTargetsFile = z.infer<typeof MonitorTargetsFileSchema>;
