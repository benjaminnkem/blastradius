import { describe, expect, it } from "vitest";
import {
  HealthConsensusSchema,
  HealthObservationSchema,
  MonitorTargetConfigSchema,
  OracleTargetConfigSchema,
  RpcTargetConfigSchema,
  SequencerTargetConfigSchema,
} from "./monitoring.js";

describe("Monitoring Schemas", () => {
  describe("HealthObservationSchema", () => {
    it("parses valid health observation", () => {
      const observation = {
        dependencyId: "sequencer:base",
        dependencyType: "sequencer",
        state: "degraded",
        severity: 75,
        confidenceBps: 9000,
        observedAt: 1787365120,
        methodId: "sequencer-health-v1",
        methodVersion: 1,
        measurements: {
          safeLagSec: 320,
        },
      };
      const parsed = HealthObservationSchema.parse(observation);
      expect(parsed.dependencyId).toBe("sequencer:base");
      expect(parsed.severity).toBe(75);
    });
  });

  describe("HealthConsensusSchema", () => {
    it("parses valid consensus result", () => {
      const consensus = {
        dependencyId: "sequencer:base",
        dependencyType: "sequencer",
        aggregateState: "critical",
        aggregateSeverity: 91,
        coverage: {
          activeTrustedCreators: 3,
          minimumRequired: 2,
        },
        agreement: "majority",
        byState: {
          critical: 2,
          healthy: 1,
          degraded: 0,
          watch: 0,
          unknown: 0,
          unavailable: 0,
        },
        observations: [
          {
            creator: "0x1111111111111111111111111111111111111111",
            observationId: "obs-1",
            state: "critical",
            severity: 91,
            confidenceBps: 9500,
            observedAt: 1787365120,
            methodId: "sequencer-health-v1",
            methodVersion: 1,
            entityKey: "key-1",
            expiresAtBlock: 1000100,
          },
        ],
        computedAt: "2026-08-25T12:00:00.000Z",
      };
      const parsed = HealthConsensusSchema.parse(consensus);
      expect(parsed.agreement).toBe("majority");
      expect(parsed.coverage.activeTrustedCreators).toBe(3);
    });
  });

  describe("MonitorTargetConfigSchema (discriminated union)", () => {
    it("parses sequencer target config", () => {
      const config = {
        type: "sequencer",
        targetId: "base-mainnet-sequencer",
        dependencyId: "sequencer:base",
        chainId: 8453,
        rpcUrls: ["https://base.llamarpc.com"],
      };
      const parsed = SequencerTargetConfigSchema.parse(config);
      expect(parsed.type).toBe("sequencer");
      expect(parsed.methodId).toBe("sequencer-health-v1");
    });

    it("parses oracle target config", () => {
      const config = {
        type: "oracle",
        targetId: "base-eth-usd-feed",
        dependencyId: "oracle:chainlink:base:eth-usd",
        chainId: 8453,
        feedAddress: "0x71041dddad3595f9cef3dccf156597b71c782d68",
        heartbeatSec: 3600,
        rpcUrls: ["https://base.llamarpc.com"],
      };
      const parsed = OracleTargetConfigSchema.parse(config);
      expect(parsed.type).toBe("oracle");
      expect(parsed.feedDecimals).toBe(8);
    });

    it("parses rpc target config", () => {
      const config = {
        type: "rpc",
        targetId: "base-rpc-cluster",
        dependencyId: "rpc:base:cluster",
        chainId: 8453,
        providers: [
          { id: "provider-a", url: "https://rpc1.example.org" },
          { id: "provider-b", url: "https://rpc2.example.org" },
        ],
      };
      const parsed = RpcTargetConfigSchema.parse(config);
      expect(parsed.type).toBe("rpc");
      expect(parsed.providers.length).toBe(2);
    });

    it("correctly discriminates via MonitorTargetConfigSchema", () => {
      const seq = MonitorTargetConfigSchema.parse({
        type: "sequencer",
        targetId: "target-1",
        dependencyId: "sequencer:base",
        chainId: 8453,
        rpcUrls: ["https://base.llamarpc.com"],
      });
      expect(seq.type).toBe("sequencer");
    });
  });
});
