import { describe, expect, it, vi } from "vitest";
import type { SequencerTargetConfig } from "@blastradius/schemas";
import { SequencerMonitor } from "./monitors/sequencer.js";
import { type ArkivHealthWriter, MonitorRunner } from "./runner/monitor-runner.js";

describe("MonitorRunner Orchestration", () => {
  const target: SequencerTargetConfig = {
    type: "sequencer",
    targetId: "base-mainnet-sequencer",
    dependencyId: "sequencer:base",
    chainId: 8453,
    methodId: "sequencer-health-v1",
    methodVersion: 1,
    rpcUrls: ["https://mainnet.base.org"],
    thresholds: {
      warningSafeLagSec: 120,
      criticalSafeLagSec: 600,
      maxBlockGapSec: 60,
    },
    sampleIntervalSec: 15,
    enabled: true,
  };

  it("publishes to Arkiv on initial cycle and skips redundant publication on immediate next cycle", async () => {
    const plugin = new SequencerMonitor();
    const mockWriter: ArkivHealthWriter = {
      publishHealthAssertion: vi
        .fn()
        .mockResolvedValue({ key: "0xentity-123", txHash: "0xtx-123" }),
    };

    const runner = new MonitorRunner(target, plugin, mockWriter);

    const spy = vi
      .spyOn(
        plugin as unknown as { sampleProvider: (...args: unknown[]) => unknown },
        "sampleProvider",
      )
      .mockResolvedValueOnce({
        url: "https://mainnet.base.org",
        success: true,
        latestBlockNumber: 1000000,
        latestBlockTimestamp: 1700000098,
        safeBlockNumber: 999980,
        safeBlockTimestamp: 1700000050,
        latencyMs: 100,
      })
      .mockResolvedValueOnce({
        url: "https://mainnet.base.org",
        success: true,
        latestBlockNumber: 1000005,
        latestBlockTimestamp: 1700000108, // block progressed concurrently with time
        safeBlockNumber: 999985,
        safeBlockTimestamp: 1700000060,
        latencyMs: 100,
      });

    // Cycle 1: initial publication
    const result1 = await runner.runCycle({ nowSec: 1700000100 });
    expect(result1.decision.shouldPublish).toBe(true);
    expect(result1.decision.reason).toBe("initial_publication");
    expect(result1.publishedKey).toBe("0xentity-123");
    expect(mockWriter.publishHealthAssertion).toHaveBeenCalledTimes(1);

    // Cycle 2: 10 seconds later, block progressed normally, same healthy state -> skips unchanged
    const result2 = await runner.runCycle({ nowSec: 1700000110 });
    expect(result2.decision.shouldPublish).toBe(false);
    expect(result2.decision.reason).toBe("skip_unchanged");
    expect(mockWriter.publishHealthAssertion).toHaveBeenCalledTimes(1); // not called again

    spy.mockRestore();
  });
});
