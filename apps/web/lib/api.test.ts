import { describe, expect, it, vi } from "vitest";
import { getDependency, getIncidents, getMethod, getProof, getProtocolExposure } from "./api";

describe("Web API Client", () => {
  it("fetches incidents and returns data envelope", async () => {
    const mockData = {
      incidents: [],
      totalCount: 0,
      graphFingerprint: "fp-1234",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockData,
        requestId: "req-1",
        timestamp: 1700000000,
      }),
    });

    const result = await getIncidents();
    expect(result).toEqual(mockData);
  });

  it("handles fetch failure by failing closed to null (no fake healthy data)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network offline"));

    const result = await getDependency("sequencer:base");
    expect(result).toBeNull();
  });

  it("calls getProtocolExposure with encoded id", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { protocolId: "aave-v3", totalOperations: 2, operations: [] },
      }),
    });

    const result = await getProtocolExposure("aave-v3");
    expect(result?.protocolId).toBe("aave-v3");
  });

  it("calls getProof with entity key", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { metadata: { key: "0x123" } },
      }),
    });

    const result = await getProof("0x123");
    expect(result?.metadata.key).toBe("0x123");
  });

  it("calls getMethod with method id", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { methodId: "sequencer-health-v1", version: 1 },
      }),
    });

    const result = await getMethod("sequencer-health-v1");
    expect(result?.methodId).toBe("sequencer-health-v1");
  });
});
