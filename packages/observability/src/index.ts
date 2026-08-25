/**
 * Observability Foundation: Structured logging with secret redaction and Prometheus metrics registry.
 */

export const PACKAGE_NAME = "@blastradius/observability" as const;
export const IMPLEMENTATION_PHASE = 4 as const;

export * from "./logger.js";
export * from "./metrics.js";
