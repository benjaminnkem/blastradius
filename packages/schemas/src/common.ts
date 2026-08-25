import { z } from "zod";

export const DEPENDENCY_TYPES = [
  "sequencer",
  "oracle",
  "rpc",
  "bridge",
  "keeper",
  "data_availability",
  "cross_chain_messaging",
  "stablecoin_issuer",
  "proof_system",
  "relayer",
  "chain_environment",
  "oracle_adapter",
  "protocol",
  "market",
  "vault",
  "operation",
] as const;

export const DependencyTypeSchema = z.enum(DEPENDENCY_TYPES);
export type DependencyType = z.infer<typeof DependencyTypeSchema>;

export const HEALTH_STATES = [
  "healthy",
  "watch",
  "degraded",
  "critical",
  "unknown",
  "unavailable",
] as const;

export const HealthStateSchema = z.enum(HEALTH_STATES);
export type HealthState = z.infer<typeof HealthStateSchema>;

export const PUBLISHER_ROLES = ["monitor", "curator", "protocol"] as const;
export const PublisherRoleSchema = z.enum(PUBLISHER_ROLES);
export type PublisherRole = z.infer<typeof PublisherRoleSchema>;

export const SOURCE_KINDS = ["curator", "protocol"] as const;
export const SourceKindSchema = z.enum(SOURCE_KINDS);
export type SourceKind = z.infer<typeof SourceKindSchema>;

export const EDGE_STATES = ["active", "removed"] as const;
export const EdgeStateSchema = z.enum(EDGE_STATES);
export type EdgeState = z.infer<typeof EdgeStateSchema>;

export const AGREEMENT_STATES = [
  "unanimous",
  "majority",
  "split",
  "insufficient",
  "unavailable",
] as const;

export const AgreementStateSchema = z.enum(AGREEMENT_STATES);
export type AgreementState = z.infer<typeof AgreementStateSchema>;

export const SEMANTIC_ID_REGEX = /^[a-z0-9]+(:[a-z0-9-]+)+$/;

export const SemanticIdSchema = z
  .string()
  .min(3, "Semantic ID must be at least 3 characters")
  .max(256, "Semantic ID must not exceed 256 characters")
  .regex(
    SEMANTIC_ID_REGEX,
    "Semantic ID must be lowercase alphanumeric, colon-separated segments (e.g. sequencer:base, oracle:chainlink:base:eth-usd)",
  );
export type SemanticId = z.infer<typeof SemanticIdSchema>;

export const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export const EvmAddressSchema = z
  .string()
  .regex(EVM_ADDRESS_REGEX, "Must be a valid 40-hex-character EVM address with 0x prefix")
  .transform((val) => val.toLowerCase() as `0x${string}`);
export type EvmAddress = z.infer<typeof EvmAddressSchema>;

export const BpsSchema = z
  .number()
  .int("Basis points must be an integer")
  .min(0, "Basis points must be at least 0")
  .max(10000, "Basis points must not exceed 10000 (100%)");
export type Bps = z.infer<typeof BpsSchema>;

export const SeveritySchema = z
  .number()
  .int("Severity must be an integer")
  .min(0, "Severity must be at least 0")
  .max(100, "Severity must not exceed 100");
export type Severity = z.infer<typeof SeveritySchema>;

export const PositiveVersionSchema = z
  .number()
  .int("Version must be an integer")
  .min(1, "Version must be at least 1");
export type PositiveVersion = z.infer<typeof PositiveVersionSchema>;

export const ChainIdSchema = z
  .number()
  .int("Chain ID must be an integer")
  .positive("Chain ID must be positive");
export type ChainId = z.infer<typeof ChainIdSchema>;

// Unix timestamp in seconds (sanity bounds: between 2023-11-01 and 2050-01-01)
export const MIN_UNIX_TIMESTAMP_SEC = 1700000000;
export const MAX_UNIX_TIMESTAMP_SEC = 2524608000;

export const UnixTimestampSchema = z
  .number()
  .int("Timestamp must be integer seconds")
  .min(MIN_UNIX_TIMESTAMP_SEC, "Timestamp is too far in the past (before Nov 2023)")
  .max(MAX_UNIX_TIMESTAMP_SEC, "Timestamp is too far in the future (after 2050)");
export type UnixTimestamp = z.infer<typeof UnixTimestampSchema>;

export const PROJECT_NAMESPACE_REGEX = /^[a-z0-9-]+$/;

export const ProjectNamespaceSchema = z
  .string()
  .min(1, "Project namespace must not be empty")
  .max(64, "Project namespace must not exceed 64 characters")
  .regex(PROJECT_NAMESPACE_REGEX, "Project namespace must be lowercase alphanumeric with hyphens")
  .refine((v) => !v.startsWith("0x"), {
    message:
      "Project namespace must not start with '0x' — check that a private key or address was not accidentally used",
  });
export type ProjectNamespace = z.infer<typeof ProjectNamespaceSchema>;
