/**
 * Monitoring Platform Foundation:
 * Redis connectivity, atomic distributed locking, BullMQ worker queues,
 * publication cadence decision engine, and deterministic idempotency.
 */

export const PACKAGE_NAME = "@blastradius/monitoring" as const;
export const IMPLEMENTATION_PHASE = 4 as const;

export * from "./redis/client.js";
export * from "./redis/lock.js";
export * from "./pipeline/types.js";
export * from "./pipeline/decision.js";
export * from "./pipeline/idempotency.js";
export * from "./queues/monitor.queue.js";
