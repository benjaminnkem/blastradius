import { describe, expect, it, vi } from "vitest";
import type { SequencerTargetConfig } from "@blastradius/schemas";
import { sanitizeRpcUrl, SequencerMonitor } from "./monitors/sequencer.js";

describe("SequencerMonitor (Base sequencer-health-v1)", () => {
  const target: SequencerTargetConfig = {
    type: "sequencer",
    targetId: "base-mainnet-sequencer",
    dependencyId: "sequencer:base",
    chainId: 8453,
    methodId: "sequencer-health-v1",
    methodVersion: 1,
    rpcUrls: ["https://mainnet.base.org", "https://base.llamarpc.com"],
    thresholds: {
      warningSafeLagSec: 120,
      criticalSafeLagSec: 600,
      maxBlockGapSec: 60,
    },
    sampleIntervalSec: 15,
    enabled: true,
  };

  it("sanitizes RPC URLs by stripping credentials and query parameters", () => {
    expect(sanitizeRpcUrl("https://user:secret@mainnet.base.org/v1?token=123")).toBe(
      "https://mainnet.base.org/v1",
    );
    expect(sanitizeRpcUrl("https://mainnet.base.org/")).toBe("https://mainnet.base.org");
  });

  it("evaluates healthy state when block progression is within normal bounds", async () => {
    const monitor = new SequencerMonitor();
    const nowSec = 1700000100;

    vi.spyOn(
      monitor as unknown as { sampleProvider: (...args: unknown[]) => unknown },
      "sampleProvider",
    )
      .mockResolvedValueOnce({
        url: "https://mainnet.base.org",
        success: true,
        latestBlockNumber: 1000000,
        latestBlockTimestamp: 1700000098, // 2s gap
        safeBlockNumber: 999980,
        safeBlockTimestamp: 1700000050, // 48s lag
        latencyMs: 120,
      })
      .mockResolvedValueOnce({
        url: "https://base.llamarpc.com",
        success: true,
        latestBlockNumber: 1000000,
        latestBlockTimestamp: 1700000098,
        safeBlockNumber: 999980,
        safeBlockTimestamp: 1700000050,
        latencyMs: 150,
      });

    const raw = await monitor.observe(target, { nowSec });
    expect(raw.state).toBe("healthy");
    expect(raw.severity).toBe(0);
    expect(raw.confidenceBps).toBe(10000);
    expect(raw.measurements.blockGapSec).toBe(2);
    expect(raw.measurements.safeLagSec).toBe(48);
    expect(raw.measurements.providerAgreement).toBe(true);

    const norm = monitor.normalize(target, raw);
    expect(norm.state).toBe("healthy");
    expect(norm.methodId).toBe("sequencer-health-v1");
    expect(norm.evidence?.hash).toHaveLength(64);
  });

  it("evaluates degraded state on high safe lag (> 120s)", async () => {
    const monitor = new SequencerMonitor();
    const nowSec = 1700000100;

    vi.spyOn(
      monitor as unknown as { sampleProvider: (...args: unknown[]) => unknown },
      "sampleProvider",
    ).mockResolvedValueOnce({
      url: "https://mainnet.base.org",
      success: true,
      latestBlockNumber: 1000000,
      latestBlockTimestamp: 1700000098, // 2s gap
      safeBlockNumber: 999900,
      safeBlockTimestamp: 1700000098 - 150, // 150s lag (> 120s threshold)
      latencyMs: 120,
    });

    const raw = await monitor.observe(target, { nowSec });
    expect(raw.state).toBe("degraded");
    expect(raw.severity).toBeGreaterThanOrEqual(60);
  });

  it("evaluates critical state when sequencer is stalled (> 60s gap)", async () => {
    const monitor = new SequencerMonitor();
    const nowSec = 1700000100;

    vi.spyOn(
      monitor as unknown as { sampleProvider: (...args: unknown[]) => unknown },
      "sampleProvider",
    ).mockResolvedValueOnce({
      url: "https://mainnet.base.org",
      success: true,
      latestBlockNumber: 1000000,
      latestBlockTimestamp: 1700000000, // 100s gap (> 60s max gap)
      safeBlockNumber: 999900,
      safeBlockTimestamp: 1699999900,
      latencyMs: 120,
    });

    const raw = await monitor.observe(target, { nowSec });
    expect(raw.state).toBe("critical");
    expect(raw.severity).toBeGreaterThanOrEqual(80);
  });

  it("evaluates unavailable state when all RPC providers fail or timeout", async () => {
    const monitor = new SequencerMonitor();
    const nowSec = 1700000100;

    vi.spyOn(
      monitor as unknown as { sampleProvider: (...args: unknown[]) => unknown },
      "sampleProvider",
    )
      .mockResolvedValueOnce({
        url: "https://mainnet.base.org",
        success: false,
        error: "Timeout",
      })
      .mockResolvedValueOnce({
        url: "https://base.llamarpc.com",
        success: false,
        error: "Connection refused",
      });

    const raw = await monitor.observe(target, { nowSec });
    expect(raw.state).toBe("unavailable");
    expect(raw.severity).toBe(100);
    expect(raw.confidenceBps).toBe(10000);
    expect(raw.measurements.providerCount).toBe(0);
  });
});
