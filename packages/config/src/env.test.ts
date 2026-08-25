import { describe, expect, it } from "vitest";
import { ConfigError, DEFAULT_PROJECT_NAMESPACE, loadEnv } from "./env.js";
import {
  getApiRuntimeConfig,
  getArkivRuntimeConfig,
  getGraphLimitsConfig,
  getRedisRuntimeConfig,
  getWorkerRuntimeConfig,
} from "./runtime.js";

describe("loadEnv", () => {
  it("defaults the project namespace and does not invent Arkiv endpoints", () => {
    const env = loadEnv({});
    expect(env.BLASTRADIUS_PROJECT).toBe(DEFAULT_PROJECT_NAMESPACE);
    expect(env.NODE_ENV).toBe("development");
    expect(env.ARKIV_RPC_URL).toBeUndefined();
    expect(env.ARKIV_CHAIN_ID).toBeUndefined();
    expect(env.REDIS_URL).toBeUndefined();
  });

  it("rejects invalid NODE_ENV", () => {
    expect(() => loadEnv({ NODE_ENV: "staging" })).toThrow(ConfigError);
  });

  it("rejects a private-key-shaped default sneaking in as project id", () => {
    expect(() => loadEnv({ BLASTRADIUS_PROJECT: "0xabc" })).toThrow(ConfigError);
  });

  it("requires Arkiv RPC and chain ID together", () => {
    expect(() => loadEnv({ ARKIV_RPC_URL: "https://example.invalid/rpc" })).toThrow(
      /ARKIV_CHAIN_ID is required/,
    );
    expect(() => loadEnv({ ARKIV_CHAIN_ID: "1" })).toThrow(/ARKIV_RPC_URL is required/);
  });

  it("accepts paired Arkiv runtime values without defaulting a network name", () => {
    const env = loadEnv({
      ARKIV_RPC_URL: "https://example.invalid/rpc",
      ARKIV_CHAIN_ID: "7733102",
    });
    expect(env.ARKIV_RPC_URL).toBe("https://example.invalid/rpc");
    expect(env.ARKIV_CHAIN_ID).toBe(7733102);
    expect(env.ARKIV_NETWORK_NAME).toBeUndefined();
  });

  it("treats empty optional strings as unset", () => {
    const env = loadEnv({ ARKIV_RPC_URL: "", REDIS_URL: "" });
    expect(env.ARKIV_RPC_URL).toBeUndefined();
    expect(env.REDIS_URL).toBeUndefined();
  });

  it("validates private keys strictly when provided", () => {
    const validKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const env = loadEnv({
      ARKIV_MONITOR_PRIVATE_KEY: validKey,
    });
    expect(env.ARKIV_MONITOR_PRIVATE_KEY).toBe(validKey);

    expect(() => loadEnv({ ARKIV_MONITOR_PRIVATE_KEY: "0xinvalid" })).toThrow(ConfigError);
  });

  it("applies canonical defaults for graph, API, worker, and Arkiv limits", () => {
    const env = loadEnv({});
    expect(env.ARKIV_QUERY_PAGE_SIZE).toBe(100);
    expect(env.ARKIV_QUERY_MAX_PAGES).toBe(20);
    expect(env.ARKIV_HEALTH_ASSERTION_TTL_SEC).toBe(300);
    expect(env.MONITOR_WORKER_CONCURRENCY).toBe(5);
    expect(env.GRAPH_MAX_DEPTH).toBe(10);
    expect(env.GRAPH_MAX_NODES).toBe(1000);
    expect(env.API_PORT).toBe(3001);
    expect(env.MONITOR_HEALTH_PORT).toBe(3002);
  });

  it("constructs typed runtime configs accurately", () => {
    const env = loadEnv({
      ARKIV_RPC_URL: "https://rpc.example.org",
      ARKIV_CHAIN_ID: "8453",
      REDIS_URL: "redis://127.0.0.1:6379",
    });

    const arkivConfig = getArkivRuntimeConfig(env);
    expect(arkivConfig).not.toBeNull();
    expect(arkivConfig?.chainId).toBe(8453);

    const redisConfig = getRedisRuntimeConfig(env);
    expect(redisConfig).not.toBeNull();
    expect(redisConfig?.url).toBe("redis://127.0.0.1:6379");

    const apiConfig = getApiRuntimeConfig(env);
    expect(apiConfig.port).toBe(3001);
    expect(apiConfig.corsOrigins).toEqual(["*"]);

    const graphLimits = getGraphLimitsConfig(env);
    expect(graphLimits.maxDepth).toBe(10);

    const workerConfig = getWorkerRuntimeConfig(env);
    expect(workerConfig.concurrency).toBe(5);
  });
});
