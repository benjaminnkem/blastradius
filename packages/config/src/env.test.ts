import { describe, expect, it } from "vitest";
import { ConfigError, DEFAULT_PROJECT_NAMESPACE, loadEnv } from "./env";

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
});
