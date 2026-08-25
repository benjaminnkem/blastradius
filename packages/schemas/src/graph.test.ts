import { describe, expect, it } from "vitest";
import { BlastRadiusResultSchema, GraphLimitsSchema, createBoundedResultSchema } from "./graph.js";

describe("Graph & Blast Radius Schemas", () => {
  it("parses valid BlastRadiusResult", () => {
    const result = {
      root: {
        id: "sequencer:base",
        dependencyType: "sequencer",
        healthState: "critical",
        severity: 91,
      },
      summary: {
        dependenciesAffected: 13,
        protocolsAffected: 9,
        operationsAffected: 37,
        criticalOperations: 11,
      },
      operations: [
        {
          operationId: "operation:aave-v3:base:weth-usdc:borrow",
          protocolId: "aave-v3",
          operation: "borrow",
          blastScore: 88,
          pathCount: 2,
          topPaths: [
            [
              "sequencer:base",
              "chain:base",
              "oracle:chainlink:base:eth-usd",
              "operation:aave-v3:base:weth-usdc:borrow",
            ],
          ],
        },
      ],
      graph: {
        nodes: [
          {
            id: "sequencer:base",
            type: "sequencer",
            label: "Base Sequencer",
            healthState: "critical",
            severity: 91,
          },
        ],
        edges: [
          {
            id: "edge-1",
            from: "chain:base",
            to: "sequencer:base",
            dependentId: "chain:base",
            dependencyId: "sequencer:base",
            dependentType: "chain_environment",
            dependencyType: "sequencer",
            criticalityBps: 10000,
            propagationBps: 10000,
            version: 1,
            state: "active",
          },
        ],
      },
      meta: {
        complete: true,
        computedAt: "2026-08-25T12:00:00.000Z",
        trustPolicyVersion: "1",
        graphFingerprint: "fp-12345",
      },
    };

    const parsed = BlastRadiusResultSchema.parse(result);
    expect(parsed.summary.protocolsAffected).toBe(9);
    expect(parsed.operations.length).toBe(1);
    expect(parsed.meta.complete).toBe(true);
  });

  it("applies default values for GraphLimitsSchema", () => {
    const limits = GraphLimitsSchema.parse({});
    expect(limits.maxDepth).toBe(10);
    expect(limits.maxNodes).toBe(1000);
    expect(limits.maxEdges).toBe(2000);
    expect(limits.deadlineMs).toBe(5000);
  });

  it("validates bounded results with truncation", () => {
    const boundedSchema = createBoundedResultSchema(GraphLimitsSchema);
    const result = boundedSchema.parse({
      items: [{}],
      complete: false,
      truncatedReason: "deadline",
    });
    expect(result.complete).toBe(false);
    expect(result.truncatedReason).toBe("deadline");
  });
});
