import { describe, expect, it } from "vitest";
import { CLI_STATUS, formatStatus } from "./status";

describe("publisher CLI status", () => {
  it("does not look like a successful write", () => {
    expect(CLI_STATUS.writes).toBe("disabled");
    expect(formatStatus()).toContain("not implemented");
    expect(formatStatus()).not.toMatch(/published|entity key|txHash/i);
  });
});
