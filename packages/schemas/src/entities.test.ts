import { describe, expect, it } from "vitest";
import {
  ArkivNormalizedMetadataSchema,
  DependencyEdgeAttributesSchema,
  DependencyEdgePayloadSchema,
  DependencyEdgeWriteInputSchema,
  HealthAssertionAttributesSchema,
  HealthAssertionPayloadSchema,
  HealthAssertionWriteInputSchema,
  MonitorMethodAttributesSchema,
  MonitorMethodPayloadSchema,
  ProtocolResponseAttributesSchema,
  ProtocolResponsePayloadSchema,
} from "./index.js";

describe("Arkiv Entity Schemas", () => {
  const sampleMetadata = {
    key: "0xdeadbeef",
    creator: "0x1111111111111111111111111111111111111111",
    owner: "0x2222222222222222222222222222222222222222",
    createdAtBlock: 1000000,
    expiresAtBlock: 1001000,
  };

  describe("ArkivNormalizedMetadataSchema", () => {
    it("parses valid Arkiv metadata", () => {
      const parsed = ArkivNormalizedMetadataSchema.parse(sampleMetadata);
      expect(parsed.creator).toBe("0x1111111111111111111111111111111111111111");
      expect(parsed.owner).toBe("0x2222222222222222222222222222222222222222");
    });
  });

  describe("DependencyEdgeSchema", () => {
    const validEdgeAttributes = {
      project: "blastradius-v1",
      kind: "dependency_edge",
      edge_id: "protocol-a:borrow->chainlink:eth-usd",
      dependent_id: "operation:protocol-a:base:borrow",
      dependent_type: "operation",
      dependency_id: "oracle:chainlink:base:eth-usd",
      dependency_type: "oracle",
      protocol_id: "protocol-a",
      criticality_bps: 9500,
      propagation_bps: 10000,
      version: 1,
      state: "active",
      effective_at: 1787365120,
      source_kind: "curator",
    };

    const validEdgePayload = {
      name: "Protocol A borrow depends on ETH/USD oracle",
      description: "Borrow health requires the configured price feed.",
      failureMode: "Borrowing may become unsafe when price is stale.",
      fallback: { exists: false },
      evidence: [
        {
          type: "official_docs",
          url: "https://example.org/docs",
          description: "Official dependency documentation",
        },
      ],
    };

    it("parses valid dependency edge attributes and payload", () => {
      expect(DependencyEdgeAttributesSchema.parse(validEdgeAttributes)).toBeDefined();
      expect(DependencyEdgePayloadSchema.parse(validEdgePayload)).toBeDefined();
    });

    it("rejects self-referencing dependency edges", () => {
      const selfRef = {
        ...validEdgeAttributes,
        dependent_id: "oracle:chainlink:base:eth-usd",
        dependency_id: "oracle:chainlink:base:eth-usd",
      };
      expect(() => DependencyEdgeAttributesSchema.parse(selfRef)).toThrow(
        /Self-referencing dependency edges are forbidden/,
      );
    });

    it("rejects edges without evidence", () => {
      const noEvidence = {
        ...validEdgePayload,
        evidence: [],
      };
      expect(() => DependencyEdgePayloadSchema.parse(noEvidence)).toThrow();
    });

    it("validates write input with TTL", () => {
      const writeInput = {
        attributes: validEdgeAttributes,
        payload: validEdgePayload,
      };
      const parsed = DependencyEdgeWriteInputSchema.parse(writeInput);
      expect(parsed.expiresInSec).toBe(2592000); // 30 days default
    });
  });

  describe("HealthAssertionSchema", () => {
    const validAssertionAttributes = {
      project: "blastradius-v1",
      kind: "health_assertion",
      observation_id: "sha256:abcd1234abcd",
      dependency_id: "sequencer:base",
      dependency_type: "sequencer",
      chain_id: 8453,
      state: "critical",
      severity: 91,
      confidence_bps: 9700,
      observed_at: 1787365120,
      observed_block: 34711289,
      method_id: "sequencer-health-v1",
      method_version: 1,
      safe_lag_sec: 612,
    };

    const validAssertionPayload = {
      summary: "Safe head has stalled.",
      measurements: {
        unsafeHead: 34711289,
        safeHead: 34710871,
        lagSec: 612,
      },
    };

    it("parses valid health assertion attributes and payload", () => {
      expect(HealthAssertionAttributesSchema.parse(validAssertionAttributes)).toBeDefined();
      expect(HealthAssertionPayloadSchema.parse(validAssertionPayload)).toBeDefined();
    });

    it("rejects out-of-range severity in health assertion", () => {
      expect(() =>
        HealthAssertionAttributesSchema.parse({
          ...validAssertionAttributes,
          severity: 105,
        }),
      ).toThrow();
    });

    it("enforces short TTL upper bound (< 1h)", () => {
      const input = {
        attributes: validAssertionAttributes,
        payload: validAssertionPayload,
        expiresInSec: 7200, // 2 hours -> should fail
      };
      expect(() => HealthAssertionWriteInputSchema.parse(input)).toThrow(/must not exceed 1 hour/);
    });
  });

  describe("MonitorMethodSchema", () => {
    it("parses valid monitor method attributes and payload", () => {
      const attrs = {
        project: "blastradius-v1",
        kind: "monitor_method",
        method_id: "sequencer-health-v1",
        dependency_type: "sequencer",
        version: 1,
        min_sources: 2,
        sample_interval_sec: 30,
      };
      const payload = {
        name: "Sequencer progression monitor",
        description: "Compares safe head progression across RPCs",
        checks: ["safe head lag", "provider agreement"],
        thresholds: {
          warningLag: 120,
          criticalLag: 600,
        },
      };

      expect(MonitorMethodAttributesSchema.parse(attrs)).toBeDefined();
      expect(MonitorMethodPayloadSchema.parse(payload)).toBeDefined();
    });
  });

  describe("ProtocolResponseSchema", () => {
    it("parses valid protocol response", () => {
      const attrs = {
        project: "blastradius-v1",
        kind: "protocol_response",
        protocol_id: "protocol-a",
        dependency_id: "sequencer:base",
        action: "disable_deposits",
        severity: 90,
        policy_version: 1,
        response_at: 1787365188,
      };
      const payload = {
        message: "Deposits temporarily paused in UI.",
        affectedOperations: ["deposit"],
      };

      expect(ProtocolResponseAttributesSchema.parse(attrs)).toBeDefined();
      expect(ProtocolResponsePayloadSchema.parse(payload)).toBeDefined();
    });
  });
});
