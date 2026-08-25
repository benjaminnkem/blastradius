import { z } from "zod";
import {
  BpsSchema,
  ChainIdSchema,
  DependencyTypeSchema,
  PositiveVersionSchema,
  SemanticIdSchema,
  SourceKindSchema,
} from "./common.js";
import {
  ContractReferenceSchema,
  EvidenceReferenceSchema,
  FallbackInfoSchema,
} from "./evidence.js";

export const DependencyDeclarationFileSchema = z
  .object({
    schemaVersion: PositiveVersionSchema.default(1),
    edgeId: z.string().min(3).max(256),
    dependent: z.object({
      id: SemanticIdSchema,
      type: DependencyTypeSchema,
    }),
    dependency: z.object({
      id: SemanticIdSchema,
      type: DependencyTypeSchema,
    }),
    protocolId: z.string().min(1).max(128).optional(),
    operation: z.string().min(1).max(128).optional(),
    chainId: ChainIdSchema.optional(),
    criticalityBps: BpsSchema,
    propagationBps: BpsSchema,
    sourceKind: SourceKindSchema.default("curator"),
    evidence: z
      .array(EvidenceReferenceSchema)
      .min(1, "At least one evidence reference is required in a declaration file")
      .max(20),
    contractReferences: z.array(ContractReferenceSchema).max(20).optional(),
    name: z.string().min(1).max(256).optional(),
    description: z.string().min(1).max(2048).optional(),
    failureMode: z.string().min(1).max(2048).optional(),
    fallback: FallbackInfoSchema.optional(),
    declaredByLabel: z.string().max(128).optional(),
  })
  .refine((data) => data.dependent.id !== data.dependency.id, {
    message:
      "Declaration cannot declare self-referencing dependency: dependent.id and dependency.id must differ",
    path: ["dependent", "id"],
  });

export type DependencyDeclarationFile = z.infer<typeof DependencyDeclarationFileSchema>;

export const MonitorMethodDeclarationFileSchema = z.object({
  schemaVersion: PositiveVersionSchema.default(1),
  methodId: z.string().min(1).max(128),
  dependencyType: DependencyTypeSchema,
  version: PositiveVersionSchema.default(1),
  name: z.string().min(1).max(256),
  description: z.string().min(1).max(2048),
  minSources: z.number().int().min(1).max(100).default(2),
  sampleIntervalSec: z.number().int().min(1).max(3600).default(30),
  checks: z.array(z.string().min(1).max(256)).min(1).max(50),
  thresholds: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])),
  limitations: z.array(z.string().min(1).max(512)).max(50).optional(),
  source: z.string().max(1024).optional(),
});

export type MonitorMethodDeclarationFile = z.infer<typeof MonitorMethodDeclarationFileSchema>;
