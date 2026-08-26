import { describe, expect, it, vi } from "vitest";
import { ArkivService } from "../arkiv/arkiv.service.js";
import { GraphService } from "../graph/graph.service.js";
import { TrustService } from "../trust/trust.service.js";
import { IncidentsController } from "./incidents.controller.js";

describe("IncidentsController", () => {
  it("returns active incidents when health assertions indicate degraded state", async () => {
    const arkivService = new ArkivService();
    const trustService = new TrustService();
    trustService.onModuleInit();
    const graphService = new GraphService(arkivService, trustService);

    const nowSec = Math.floor(Date.now() / 1000);

    vi.spyOn(arkivService, "listHealthAssertions").mockResolvedValue({
      items: [
        {
          metadata: {
            key: "0xassertion-1",
            creator: "0x1111111111111111111111111111111111111111",
            owner: "0x1111111111111111111111111111111111111111",
            createdAtBlock: 1,
            expiresAtBlock: 1000,
          },
          attributes: {
            project: "blastradius-v1",
            kind: "health_assertion",
            observation_id: "obs-1",
            dependency_id: "sequencer:base",
            dependency_type: "sequencer",
            chain_id: 8453,
            state: "critical",
            severity: 90,
            confidence_bps: 10000,
            observed_at: nowSec,
            method_id: "sequencer-health-v1",
            method_version: 1,
          },
          payload: { summary: "Sequencer stalled" },
        },
        {
          metadata: {
            key: "0xassertion-2",
            creator: "0x2222222222222222222222222222222222222222",
            owner: "0x2222222222222222222222222222222222222222",
            createdAtBlock: 1,
            expiresAtBlock: 1000,
          },
          attributes: {
            project: "blastradius-v1",
            kind: "health_assertion",
            observation_id: "obs-2",
            dependency_id: "sequencer:base",
            dependency_type: "sequencer",
            chain_id: 8453,
            state: "critical",
            severity: 90,
            confidence_bps: 10000,
            observed_at: nowSec,
            method_id: "sequencer-health-v1",
            method_version: 1,
          },
          payload: { summary: "Sequencer stalled" },
        },
      ],
      complete: true,
    });

    const controller = new IncidentsController(arkivService, trustService, graphService);
    const result = await controller.getIncidents();

    expect(result.totalCount).toBe(1);
    expect(result.incidents[0]?.dependencyId).toBe("sequencer:base");
    expect(result.incidents[0]?.consensusState).toBe("critical");
    expect(result.incidents[0]?.consensusSeverity).toBe(90);
  });
});
