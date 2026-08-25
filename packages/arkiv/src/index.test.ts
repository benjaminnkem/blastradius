import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ARKIV_ADAPTER_STATUS,
  IMPLEMENTATION_PHASE,
  isArkivAdapterImplemented,
  PACKAGE_NAME,
} from "./index.js";

const here = dirname(fileURLToPath(import.meta.url));

describe("@blastradius/arkiv", () => {
  it("exports Phase 2 implemented adapter status", () => {
    expect(PACKAGE_NAME).toBe("@blastradius/arkiv");
    expect(IMPLEMENTATION_PHASE).toBe(2);
    expect(ARKIV_ADAPTER_STATUS).toBe("implemented");
    expect(isArkivAdapterImplemented()).toBe(true);
  });

  it("does not import retired or implicit chain constants in any source file", () => {
    const sourceFiles = [
      "index.ts",
      "client.ts",
      "reader.ts",
      "writer.ts",
      "attributes.ts",
      "historical.ts",
      "errors.ts",
    ];

    for (const file of sourceFiles) {
      const source = readFileSync(join(here, file), "utf8");
      expect(source).not.toMatch(/from ["']@arkiv-network\/sdk\/chains["']/);
      expect(source).not.toContain("braga");
      expect(source).not.toContain("cheesecake");
      expect(source).not.toContain("kaolin");
    }
  });
});
