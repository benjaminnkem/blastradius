import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROJECT_NAMESPACE,
  getApiRuntimeConfig,
  loadEnv,
  loadTrustPolicy,
} from "./index.js";

describe("@blastradius/config", () => {
  it("re-exports env, runtime, and loaders", () => {
    expect(DEFAULT_PROJECT_NAMESPACE).toBe("blastradius-v1");
    expect(loadEnv({}).API_PORT).toBe(3001);
    expect(getApiRuntimeConfig).toBeDefined();
    expect(loadTrustPolicy).toBeDefined();
  });
});
