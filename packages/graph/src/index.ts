/**
 * Graph Engine: Edge version resolution, reverse adjacency indexing,
 * cycle-safe blast-radius traversal, exposure propagation, and fingerprinting.
 */

export const PACKAGE_NAME = "@blastradius/graph" as const;
export const IMPLEMENTATION_PHASE = 3 as const;

export * from "./edges.js";
export * from "./index_builder.js";
export * from "./fingerprint.js";
export * from "./traversal.js";
