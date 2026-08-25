import { randomUUID } from "node:crypto";
import type { Redis } from "ioredis";

const RELEASE_LOCK_LUA = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

/**
 * Attempts to acquire an atomic distributed lock in Redis with a TTL.
 * Returns the ownerToken if acquired, or null if lock is currently held.
 */
export async function acquireLock(
  redis: Redis,
  lockKey: string,
  ttlMs: number,
  ownerToken: string = randomUUID(),
): Promise<string | null> {
  const result = await redis.set(lockKey, ownerToken, "PX", ttlMs, "NX");
  return result === "OK" ? ownerToken : null;
}

/**
 * Releases a distributed lock in Redis atomically using a Lua script.
 * Only releases if the stored token matches the caller's ownerToken.
 */
export async function releaseLock(
  redis: Redis,
  lockKey: string,
  ownerToken: string,
): Promise<boolean> {
  const result = await redis.eval(RELEASE_LOCK_LUA, 1, lockKey, ownerToken);
  return result === 1;
}

/**
 * Executes an async function protected by a distributed lock.
 * Ensures the lock is released in a finally block if acquired.
 */
export async function withLock<T>(
  redis: Redis,
  lockKey: string,
  ttlMs: number,
  fn: (token: string) => Promise<T>,
): Promise<T | null> {
  const token = await acquireLock(redis, lockKey, ttlMs);
  if (!token) {
    return null;
  }

  try {
    return await fn(token);
  } finally {
    await releaseLock(redis, lockKey, token).catch(() => {
      // Ignore release error if lock already expired
    });
  }
}
