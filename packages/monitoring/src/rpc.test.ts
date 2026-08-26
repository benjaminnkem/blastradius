import { describe, expect, it, vi } from "vitest";
import type { RpcTargetConfig } from "@blastradius/schemas";
import { RpcMonitor } from "./monitors/rpc.js";

describe("RpcMonitor (rpc-provider-v1)", () => {
  const target: RpcTargetConfig = {
    type: "rpc",
    targetId: "base-mainnet-rpc-cluster",
    dependencyId: "rpc:base:8453",
    chainId: 8453,
    providers: [
      { id: "base-official", url: "https://mainnet.base.org", weight: 1 },
      { id: "llamarpc", url: "https://base.llamarpc.com", weight: 1 },
    ],
    methodId: "rpc-provider-v1",
    methodVersion: 1,
    latencyThresholdMs: 1500,
    sampleIntervalSec: 15,
    enabled: true,
  };

  it("evaluates healthy state when all providers respond with agreeing blocks and low latency", async () => {
    const monitor = new RpcMonitor();
    const nowSec = 1700000000;

    vi.spyOn(
      monitor as unknown as { sampleEndpoint: (...args: unknown[]) => unknown },
      "sampleEndpoint",
    )
      .mockResolvedValueOnce({
        id: "base-official",
        url: "https://mainnet.base.org",
        success: true,
        blockNumber: 1000000,
        latencyMs: 120,
      })
      .mockResolvedValueOnce({
        id: "llamarpc",
        url: "https://base.llamarpc.com",
        success: true,
        blockNumber: 1000001,
        latencyMs: 140,
      });

    const raw = await monitor.observe(target, { nowSec });
    expect(raw.state).toBe("healthy");
    expect(raw.severity).toBe(0);
    expect(raw.confidenceBps).toBe(10000);
    expect(raw.measurements.respondingProviders).toBe(2);
    expect(raw.measurements.availabilityBps).toBe(10000);
    expect(raw.measurements.blockAgreement).toBe(true);
    expect(raw.evidence?.hash).toHaveLength(64);
  });

  it("evaluates watch state when 1 of 2 providers drops but remaining provider is healthy", async () => {
    const monitor = new RpcMonitor();
    const nowSec = 1700000000;

    vi.spyOn(
      monitor as unknown as { sampleEndpoint: (...args: unknown[]) => unknown },
      "sampleEndpoint",
    )
      .mockResolvedValueOnce({
        id: "base-official",
        url: "https://mainnet.base.org",
        success: true,
        blockNumber: 1000000,
        latencyMs: 120,
      })
      .mockResolvedValueOnce({
        id: "llamarpc",
        url: "https://base.llamarpc.com",
        success: false,
        error: "Gateway timeout",
      });

    const raw = await monitor.observe(target, { nowSec });
    expect(raw.state).toBe("watch");
    expect(raw.severity).toBe(30);
    expect(raw.measurements.respondingProviders).toBe(1);
    expect(raw.measurements.availabilityBps).toBe(5000);
  });

  it("evaluates degraded state when latency exceeds 2x threshold", async () => {
    const monitor = new RpcMonitor();
    const nowSec = 1700000000;

    vi.spyOn(
      monitor as unknown as { sampleEndpoint: (...args: unknown[]) => unknown },
      "sampleEndpoint",
    )
      .mockResolvedValueOnce({
        id: "base-official",
        url: "https://mainnet.base.org",
        success: true,
        blockNumber: 1000000,
        latencyMs: 3500, // > 3000ms (2x 1500ms threshold)
      })
      .mockResolvedValueOnce({
        id: "llamarpc",
        url: "https://base.llamarpc.com",
        success: true,
        blockNumber: 1000000,
        latencyMs: 3200,
      });

    const raw = await monitor.observe(target, { nowSec });
    expect(raw.state).toBe("degraded");
    expect(raw.severity).toBe(65);
  });

  it("evaluates unavailable state when all providers fail", async () => {
    const monitor = new RpcMonitor();
    const nowSec = 1700000000;

    vi.spyOn(
      monitor as unknown as { sampleEndpoint: (...args: unknown[]) => unknown },
      "sampleEndpoint",
    )
      .mockResolvedValueOnce({
        id: "base-official",
        url: "https://mainnet.base.org",
        success: false,
        error: "Connection refused",
      })
      .mockResolvedValueOnce({
        id: "llamarpc",
        url: "https://base.llamarpc.com",
        success: false,
        error: "Timeout",
      });

    const raw = await monitor.observe(target, { nowSec });
    expect(raw.state).toBe("unavailable");
    expect(raw.severity).toBe(100);
  });
});
