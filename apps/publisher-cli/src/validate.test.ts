import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { validateDeclarations } from "./commands/validate.js";

describe("Publisher CLI: validate command", () => {
  it("successfully validates repository config declarations", () => {
    // Look for repo root config
    const rootConfig = resolve(process.cwd(), "../../config");
    const localConfig = resolve(process.cwd(), "config");
    const configDir = existsSync(rootConfig) ? rootConfig : localConfig;

    const result = validateDeclarations(configDir);

    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
    expect(result.fileCount).toBeGreaterThanOrEqual(5);
  });
});
