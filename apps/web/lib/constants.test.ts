import { describe, expect, it } from "vitest";
import { APP_NAME, SCAFFOLD_NOTICE, SCAFFOLD_PHASE } from "./constants";

describe("web scaffold copy", () => {
  it("does not present invented live metrics", () => {
    expect(APP_NAME).toBe("BlastRadius");
    expect(SCAFFOLD_PHASE).toBe(0);
    expect(SCAFFOLD_NOTICE.toLowerCase()).toContain("not implemented");
    expect(SCAFFOLD_NOTICE).not.toMatch(/\d+\s+(protocols|operations|incidents)/i);
  });
});
