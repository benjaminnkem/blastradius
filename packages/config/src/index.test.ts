import { describe, expect, it } from "vitest";
import { DEFAULT_PROJECT_NAMESPACE, loadEnv } from "./index";

describe("@blastradius/config", () => {
  it("re-exports the env skeleton", () => {
    expect(DEFAULT_PROJECT_NAMESPACE).toBe("blastradius-v1");
    expect(loadEnv({}).API_PORT).toBe(3001);
  });
});
