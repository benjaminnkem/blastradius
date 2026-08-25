/**
 * Trust Engine: fail-closed publisher classification, policy checksumming,
 * and creator-based health consensus resolution.
 */

export const PACKAGE_NAME = "@blastradius/trust" as const;
export const IMPLEMENTATION_PHASE = 3 as const;

export * from "./policy.js";
export * from "./classification.js";
export * from "./consensus.js";
