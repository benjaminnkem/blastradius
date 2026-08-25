import { describe, expect, it } from "vitest";
import { ApiErrorEnvelopeSchema, IncidentItemSchema, PaginationQuerySchema } from "./api.js";

describe("API Schemas", () => {
  describe("ApiErrorEnvelopeSchema", () => {
    it("parses valid typed error envelopes", () => {
      const envelope = {
        error: {
          code: "ARKIV_QUERY_UNAVAILABLE",
          message: "Could not fetch current health assertions from Arkiv.",
          retryable: true,
          requestId: "req-12345",
        },
      };
      const parsed = ApiErrorEnvelopeSchema.parse(envelope);
      expect(parsed.error.code).toBe("ARKIV_QUERY_UNAVAILABLE");
      expect(parsed.error.retryable).toBe(true);
    });

    it("rejects unknown error codes", () => {
      expect(() =>
        ApiErrorEnvelopeSchema.parse({
          error: {
            code: "UNKNOWN_CUSTOM_ERROR",
            message: "failure",
            requestId: "123",
          },
        }),
      ).toThrow();
    });
  });

  describe("PaginationQuerySchema", () => {
    it("applies defaults and bounds", () => {
      expect(PaginationQuerySchema.parse({}).limit).toBe(50);
      expect(PaginationQuerySchema.parse({ limit: 100 }).limit).toBe(100);
      expect(() => PaginationQuerySchema.parse({ limit: 250 })).toThrow(/Maximum page size is 200/);
    });
  });

  describe("IncidentItemSchema", () => {
    it("parses valid incident summary item", () => {
      const item = {
        dependency: {
          id: "sequencer:base",
          type: "sequencer",
          label: "Base Sequencer",
        },
        health: {
          aggregateState: "critical",
          aggregateSeverity: 91,
          agreement: "majority",
          activeTrustedCreators: 3,
          byState: {
            critical: 2,
            healthy: 1,
            degraded: 0,
            watch: 0,
            unknown: 0,
            unavailable: 0,
          },
        },
        exposure: {
          protocolsAffected: 9,
          operationsAffected: 37,
          criticalOperations: 11,
          complete: true,
        },
        computedAt: "2026-08-25T12:00:00.000Z",
      };
      const parsed = IncidentItemSchema.parse(item);
      expect(parsed.dependency.id).toBe("sequencer:base");
      expect(parsed.exposure.operationsAffected).toBe(37);
    });
  });
});
