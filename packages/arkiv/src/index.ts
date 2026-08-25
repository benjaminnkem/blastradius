/**
 * Real Arkiv Integration Boundary.
 *
 * Implements public/wallet client construction from runtime config,
 * normalized entity readers with bounded cursor pagination,
 * typed writers for all four domain entity types, hard guards against
 * HealthAssertion extension, and typed domain error mapping.
 */

export const PACKAGE_NAME = "@blastradius/arkiv" as const;
export const ARKIV_ADAPTER_STATUS = "implemented" as const;
export const IMPLEMENTATION_PHASE = 2 as const;

/**
 * Returns true now that the Phase 2 adapter is implemented.
 */
export function isArkivAdapterImplemented(): true {
  return true;
}

export * from "./errors.js";
export * from "./client.js";
export * from "./attributes.js";
export * from "./reader.js";
export * from "./writer.js";
export * from "./historical.js";
