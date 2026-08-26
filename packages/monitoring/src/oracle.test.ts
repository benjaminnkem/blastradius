import { describe, expect, it, vi } from "vitest";
import type { OracleTargetConfig } from "@blastradius/schemas";
import { OracleMonitor } from "./monitors/oracle.js";

describe("OracleMonitor (Chainlink chainlink-feed-v1)", () => {
  const target: OracleTargetConfig = {
    type: "oracle",
    targetId: "base-mainnet-chainlink-eth-usd",
    dependencyId: "chainlink:eth-usd:8453",
    chainId: 8453,
    feedAddress: "0x71041dddad35715f681426aae1010a2669acb4aa",
    feedDecimals: 8,
    heartbeatSec: 1200,
    deviationBps: 50,
    methodId: "chainlink-feed-v1",
    methodVersion: 1,
    rpcUrls: ["https://mainnet.base.org"],
    sampleIntervalSec: 30,
    enabled: true,
  };

  it("evaluates healthy state when price is positive and within heartbeat", async () => {
    const monitor = new OracleMonitor();
    const nowSec = 1700000500;

    vi.spyOn(
      monitor as unknown as { sampleProvider: (...args: unknown[]) => unknown },
      "sampleProvider",
    ).mockResolvedValueOnce({
      url: "https://mainnet.base.org",
      success: true,
      roundId: 100n,
      answer: 350000000000n, // $3,500.00
      updatedAt: 1700000400n, // 100s staleness (< 1200s heartbeat)
      answeredInRound: 100n,
      decimals: 8,
      latencyMs: 80,
    });

    const raw = await monitor.observe(target, { nowSec });
    expect(raw.state).toBe("healthy");
    expect(raw.severity).toBe(0);
    expect(raw.confidenceBps).toBe(10000);
    expect(raw.measurements.formattedAnswer).toBe("3500");
    expect(raw.measurements.stalenessSec).toBe(100);
    expect(raw.measurements.isHeartbeatViolated).toBe(false);
    expect(raw.evidence?.hash).toHaveLength(64);
  });

  it("evaluates degraded state when staleness exceeds heartbeat (1200s)", async () => {
    const monitor = new OracleMonitor();
    const nowSec = 1700002000; // 1500s elapsed since update at 1700000500

    vi.spyOn(
      monitor as unknown as { sampleProvider: (...args: unknown[]) => unknown },
      "sampleProvider",
    ).mockResolvedValueOnce({
      url: "https://mainnet.base.org",
      success: true,
      roundId: 100n,
      answer: 350000000000n,
      updatedAt: 1700000500n,
      answeredInRound: 100n,
      decimals: 8,
      latencyMs: 80,
    });

    const raw = await monitor.observe(target, { nowSec });
    expect(raw.state).toBe("degraded");
    expect(raw.severity).toBeGreaterThanOrEqual(60);
    expect(raw.measurements.isHeartbeatViolated).toBe(true);
  });

  it("evaluates critical state on excessive staleness (> 2x heartbeat)", async () => {
    const monitor = new OracleMonitor();
    const nowSec = 1700003500; // 3000s elapsed (> 2400s)

    vi.spyOn(
      monitor as unknown as { sampleProvider: (...args: unknown[]) => unknown },
      "sampleProvider",
    ).mockResolvedValueOnce({
      url: "https://mainnet.base.org",
      success: true,
      roundId: 100n,
      answer: 350000000000n,
      updatedAt: 1700000500n,
      answeredInRound: 100n,
      decimals: 8,
      latencyMs: 80,
    });

    const raw = await monitor.observe(target, { nowSec });
    expect(raw.state).toBe("critical");
    expect(raw.severity).toBeGreaterThanOrEqual(80);
  });

  it("evaluates critical state when answer is <= 0 or round is invalid", async () => {
    const monitor = new OracleMonitor();
    const nowSec = 1700000500;

    vi.spyOn(
      monitor as unknown as { sampleProvider: (...args: unknown[]) => unknown },
      "sampleProvider",
    ).mockResolvedValueOnce({
      url: "https://mainnet.base.org",
      success: true,
      roundId: 100n,
      answer: 0n, // Invalid 0 price
      updatedAt: 1700000400n,
      answeredInRound: 100n,
      decimals: 8,
    });

    const raw = await monitor.observe(target, { nowSec });
    expect(raw.state).toBe("critical");
    expect(raw.severity).toBe(100);
  });

  it("evaluates unavailable state when all RPC providers fail", async () => {
    const monitor = new OracleMonitor();
    const nowSec = 1700000500;

    vi.spyOn(
      monitor as unknown as { sampleProvider: (...args: unknown[]) => unknown },
      "sampleProvider",
    ).mockResolvedValueOnce({
      url: "https://mainnet.base.org",
      success: false,
      error: "Contract call reverted",
    });

    const raw = await monitor.observe(target, { nowSec });
    expect(raw.state).toBe("unavailable");
    expect(raw.severity).toBe(100);
  });
});
