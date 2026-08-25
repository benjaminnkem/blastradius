import { describe, expect, it } from "vitest";
import {
  ArkivEntityNotFoundError,
  ArkivError,
  ArkivHistoricalQueryNotSupportedError,
  ArkivQueryUnavailableError,
  ArkivWriteRejectedError,
  ArkivWriteUnknownError,
  HealthAssertionCannotBeExtendedError,
} from "./errors.js";

describe("Arkiv Error Hierarchy", () => {
  it("marks query errors as retryable", () => {
    const err = new ArkivQueryUnavailableError("RPC unreachable");
    expect(err).toBeInstanceOf(ArkivError);
    expect(err.code).toBe("ARKIV_QUERY_UNAVAILABLE");
    expect(err.retryable).toBe(true);
  });

  it("marks write rejection as non-retryable", () => {
    const err = new ArkivWriteRejectedError("Invalid signature");
    expect(err).toBeInstanceOf(ArkivError);
    expect(err.code).toBe("ARKIV_WRITE_REJECTED");
    expect(err.retryable).toBe(false);
  });

  it("marks write unknown broadcast errors as retryable with reconciliation", () => {
    const err = new ArkivWriteUnknownError("Timeout waiting for receipt", {
      txHash: "0x123",
    });
    expect(err.code).toBe("ARKIV_WRITE_UNKNOWN");
    expect(err.retryable).toBe(true);
    expect(err.txHash).toBe("0x123");
  });

  it("correctly identifies domain invariant violation for HealthAssertion extension", () => {
    const err = new HealthAssertionCannotBeExtendedError("0xkey");
    expect(err.code).toBe("HEALTH_ASSERTION_CANNOT_BE_EXTENDED");
    expect(err.retryable).toBe(false);
  });

  it("formats entity not found error", () => {
    const err = new ArkivEntityNotFoundError("0xmissing");
    expect(err.code).toBe("ARKIV_ENTITY_NOT_FOUND");
    expect(err.entityKey).toBe("0xmissing");
  });

  it("formats historical query not supported error", () => {
    const err = new ArkivHistoricalQueryNotSupportedError(100);
    expect(err.code).toBe("ARKIV_HISTORICAL_QUERY_NOT_SUPPORTED");
  });
});
