import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ARKIV_ADAPTER_STATUS,
  IMPLEMENTATION_PHASE,
  isArkivAdapterImplemented,
  PACKAGE_NAME,
} from "./index";

const here = dirname(fileURLToPath(import.meta.url));

describe("@blastradius/arkiv", () => {
  it("does not claim an implemented adapter in phase 0", () => {
    expect(PACKAGE_NAME).toBe("@blastradius/arkiv");
    expect(IMPLEMENTATION_PHASE).toBe(0);
    expect(ARKIV_ADAPTER_STATUS).toBe("not_implemented");
    expect(isArkivAdapterImplemented()).toBe(false);
  });

  it("does not import retired or implicit chain constants", () => {
    const source = readFileSync(join(here, "index.ts"), "utf8");
    expect(source).not.toMatch(/from ["']@arkiv-network\/sdk\/chains["']/);
    expect(source).not.toContain("braga");
    expect(source).not.toContain("cheesecake");
    expect(source).not.toContain("kaolin");
  });
});
