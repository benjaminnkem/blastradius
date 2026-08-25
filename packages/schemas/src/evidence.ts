import { z } from "zod";
import { ChainIdSchema, EvmAddressSchema, UnixTimestampSchema } from "./common.js";

export const EVIDENCE_TYPES = [
  "official_docs",
  "official_contract",
  "official_repository",
  "protocol_governance",
  "official_status_page",
  "verified_operator_statement",
  "monitoring_observation",
] as const;

export const EvidenceTypeSchema = z.enum(EVIDENCE_TYPES);
export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;

export const EvidenceReferenceSchema = z.object({
  type: EvidenceTypeSchema,
  url: z.string().url("Evidence URL must be a valid URL").max(2048).optional(),
  chainId: ChainIdSchema.optional(),
  address: EvmAddressSchema.optional(),
  description: z.string().min(1).max(2048),
  contentHash: z.string().max(128).optional(),
  capturedAt: UnixTimestampSchema.optional(),
});
export type EvidenceReference = z.infer<typeof EvidenceReferenceSchema>;

export const ContractReferenceSchema = z.object({
  chainId: ChainIdSchema,
  address: EvmAddressSchema,
  role: z.string().min(1).max(128),
});
export type ContractReference = z.infer<typeof ContractReferenceSchema>;

export const EvidenceHashSchema = z.object({
  algorithm: z.enum(["sha256", "keccak256"]),
  hash: z.string().regex(/^0x[a-fA-F0-9]+$|^sha256:[a-fA-F0-9]+$/, "Invalid hash format"),
});
export type EvidenceHash = z.infer<typeof EvidenceHashSchema>;

export const FallbackInfoSchema = z.object({
  exists: z.boolean(),
  description: z.string().max(1024).nullable().optional(),
  fallbackId: z.string().max(256).nullable().optional(),
});
export type FallbackInfo = z.infer<typeof FallbackInfoSchema>;
