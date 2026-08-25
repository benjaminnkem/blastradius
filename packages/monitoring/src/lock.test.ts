import { describe, expect, it, vi } from "vitest";
import type { Redis } from "ioredis";
import { acquireLock, releaseLock, withLock } from "./redis/lock.js";

describe("Distributed Locking Primitives", () => {
  it("acquires lock successfully when key does not exist", async () => {
    const mockRedis = {
      set: vi.fn().mockResolvedValue("OK"),
    } as unknown as Redis;

    const token = await acquireLock(mockRedis, "lock:sequencer:base", 5000, "my-token");
    expect(token).toBe("my-token");
    expect(mockRedis.set).toHaveBeenCalledWith("lock:sequencer:base", "my-token", "PX", 5000, "NX");
  });

  it("returns null when lock is already held", async () => {
    const mockRedis = {
      set: vi.fn().mockResolvedValue(null),
    } as unknown as Redis;

    const token = await acquireLock(mockRedis, "lock:sequencer:base", 5000);
    expect(token).toBeNull();
  });

  it("releases lock via Lua script only if token matches", async () => {
    const mockRedis = {
      eval: vi.fn().mockResolvedValue(1),
    } as unknown as Redis;

    const released = await releaseLock(mockRedis, "lock:sequencer:base", "token-abc");
    expect(released).toBe(true);
    expect(mockRedis.eval).toHaveBeenCalled();
  });

  it("executes withLock and releases lock upon completion", async () => {
    const mockRedis = {
      set: vi.fn().mockResolvedValue("OK"),
      eval: vi.fn().mockResolvedValue(1),
    } as unknown as Redis;

    const result = await withLock(mockRedis, "lock:test", 5000, async (token) => {
      expect(typeof token).toBe("string");
      return "executed";
    });

    expect(result).toBe("executed");
    expect(mockRedis.eval).toHaveBeenCalled();
  });
});
