import type { RedisRuntimeConfig } from "@blastradius/config";
import { Redis, type RedisOptions } from "ioredis";

/**
 * Creates a configured ioredis client instance from validated RedisRuntimeConfig.
 * Invariant: Redis is for transient worker coordination and queues only, never authoritative data.
 */
export function createRedisClient(
  config: RedisRuntimeConfig,
  options?: Partial<RedisOptions>,
): Redis {
  const isTls = config.url.startsWith("rediss://");

  const redisOptions: RedisOptions = {
    tls: isTls ? { rejectUnauthorized: config.tlsRejectUnauthorized } : undefined,
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: true,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
    ...options,
  };

  return new Redis(config.url, redisOptions);
}

/**
 * Checks Redis reachability for health probes.
 */
export async function pingRedis(redis: Redis, timeoutMs: number = 2000): Promise<boolean> {
  try {
    const pingPromise = redis.ping();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Redis ping timed out")), timeoutMs),
    );
    const result = await Promise.race([pingPromise, timeoutPromise]);
    return result === "PONG";
  } catch {
    return false;
  }
}
