import { describe, expect, it } from "vitest";
import {
  DependencyDeclarationFileSchema,
  MonitorMethodDeclarationFileSchema,
} from "./declarations.js";

describe("Declaration File Schemas", () => {
  describe("DependencyDeclarationFileSchema", () => {
    it("parses valid YAML-compatible declaration", () => {
      const decl = {
        schemaVersion: 1,
        edgeId: "aave-v3-base-weth-borrow->chainlink-base-eth-usd",
        dependent: {
          id: "operation:aave-v3:base:weth:borrow",
          type: "operation",
        },
        dependency: {
          id: "oracle:chainlink:base:eth-usd",
          type: "oracle",
        },
        protocolId: "aave-v3",
        chainId: 8453,
        criticalityBps: 9500,
        propagationBps: 10000,
        sourceKind: "curator",
        evidence: [
          {
            type: "official_docs",
            url: "https://docs.aave.com",
            description: "Official oracle dependency documentation",
          },
        ],
      };

      const parsed = DependencyDeclarationFileSchema.parse(decl);
      expect(parsed.criticalityBps).toBe(9500);
      expect(parsed.sourceKind).toBe("curator");
    });

    it("rejects self-referencing declaration", () => {
      const selfRef = {
        schemaVersion: 1,
        edgeId: "self-ref",
        dependent: {
          id: "oracle:chainlink:base:eth-usd",
          type: "oracle",
        },
        dependency: {
          id: "oracle:chainlink:base:eth-usd",
          type: "oracle",
        },
        criticalityBps: 10000,
        propagationBps: 10000,
        evidence: [
          {
            type: "official_docs",
            description: "Doc",
          },
        ],
      };
      expect(() => DependencyDeclarationFileSchema.parse(selfRef)).toThrow(
        /dependent.id and dependency.id must differ/,
      );
    });
  });

  describe("MonitorMethodDeclarationFileSchema", () => {
    it("parses valid monitor method declaration", () => {
      const method = {
        schemaVersion: 1,
        methodId: "sequencer-health-v1",
        dependencyType: "sequencer",
        name: "Sequencer safe-head progression monitor",
        description: "Compares safe head progression across providers",
        checks: ["safe head lag", "finalized lag", "provider agreement"],
        thresholds: {
          warningSafeLagSeconds: 120,
          criticalSafeLagSeconds: 600,
        },
      };

      const parsed = MonitorMethodDeclarationFileSchema.parse(method);
      expect(parsed.methodId).toBe("sequencer-health-v1");
      expect(parsed.minSources).toBe(2); // default
      expect(parsed.sampleIntervalSec).toBe(30); // default
    });
  });
});
