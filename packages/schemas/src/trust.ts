import { z } from "zod";
import {
  ChainIdSchema,
  DependencyTypeSchema,
  EvmAddressSchema,
  PositiveVersionSchema,
  PublisherRoleSchema,
  SemanticIdSchema,
} from "./common.js";

export const PublisherScopeSchema = z.object({
  dependencyTypes: z.array(DependencyTypeSchema).optional(),
  dependencies: z.array(SemanticIdSchema).optional(),
  methods: z.array(z.string().min(1).max(128)).optional(),
  protocols: z.array(z.string().min(1).max(128)).optional(),
  chains: z.array(ChainIdSchema).optional(),
});
export type PublisherScope = z.infer<typeof PublisherScopeSchema>;

export const TrustPublisherSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(128).optional(),
  address: EvmAddressSchema,
  roles: z.array(PublisherRoleSchema).min(1, "Publisher must have at least one assigned role"),
  scopes: PublisherScopeSchema.default({}),
  enabled: z.boolean().default(true),
});
export type TrustPublisher = z.infer<typeof TrustPublisherSchema>;

export const TrustPolicySchema = z.object({
  version: PositiveVersionSchema,
  policyId: z.string().min(1).max(128),
  publishers: z
    .array(TrustPublisherSchema)
    .min(1, "Trust policy must declare at least one publisher"),
  checksum: z.string().max(128).optional(),
});
export type TrustPolicy = z.infer<typeof TrustPolicySchema>;

export const PublisherClassificationSchema = z.object({
  trusted: z.boolean(),
  address: EvmAddressSchema,
  publisherId: z.string().optional(),
  roles: z.array(PublisherRoleSchema),
  reason: z.string().optional(),
});
export type PublisherClassification = z.infer<typeof PublisherClassificationSchema>;
