import { describe, expect, it } from "vitest";
import { ArkivHistoricalQueryNotSupportedError } from "./errors.js";
import { isHistoricalQuerySupported, listHealthAssertionsAtBlock } from "./historical.js";

describe("Arkiv Historical Query Feature Gate", () => {
  it("reports historical querying as disabled / feature-gated", () => {
    expect(isHistoricalQuerySupported()).toBe(false);
  });

  it("throws ArkivHistoricalQueryNotSupportedError when invoked", () => {
    expect(() => listHealthAssertionsAtBlock(1234567)).toThrow(
      ArkivHistoricalQueryNotSupportedError,
    );
  });
});
