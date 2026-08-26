import { createHash } from "node:crypto";
import type {
  EvidenceHash,
  HealthObservation,
  HealthState,
  RpcTargetConfig,
} from "@blastradius/schemas";
import { createPublicClient, http } from "viem";
import type {
  MonitorObservationOptions,
  MonitorPlugin,
  RawObservation,
} from "../pipeline/types.js";
import { sanitizeRpcUrl } from "./sequencer.js";

export interface RpcEndpointResult {
  id: string;
  url: string;
  success: boolean;
  blockNumber?: number;
  latencyMs?: number;
  error?: string;
}

/**
 * Production monitor for multi-provider RPC health and endpoint clusters.
 *
 * Implements methodology: rpc-provider-v1
 * - Samples all configured RPC providers concurrently.
 * - Computes endpoint availability, average latency, and block height agreement.
 * - Represents provider coverage explicitly without failing the chain on 1 provider drop.
 */
export class RpcMonitor implements MonitorPlugin<RpcTargetConfig> {
  readonly type = "rpc" as const;

  async observe(
    target: RpcTargetConfig,
    options?: MonitorObservationOptions,
  ): Promise<RawObservation> {
    const timeoutMs = options?.timeoutMs ?? 3000;
    const nowSec = options?.nowSec ?? Math.floor(Date.now() / 1000);

    const providerPromises = target.providers.map((p) =>
      this.sampleEndpoint(p.id, p.url, timeoutMs),
    );

    const results = await Promise.all(providerPromises);
    const successful = results.filter((r) => r.success && r.blockNumber !== undefined);

    const totalProviders = target.providers.length;
    const respondingProviders = successful.length;

    // Case 1: Complete failure across all providers
    if (respondingProviders === 0) {
      const measurements: Record<string, string | number | boolean> = {
        totalProviders,
        respondingProviders: 0,
        availabilityBps: 0,
        blockAgreement: false,
      };

      const evidence = this.createEvidence(target, results, measurements, nowSec);

      return {
        state: "unavailable",
        severity: 100,
        confidenceBps: 10000,
        observedAt: nowSec,
        measurements,
        evidence,
      };
    }

    const availabilityBps = Math.min(
      10000,
      Math.max(0, Math.round((respondingProviders / totalProviders) * 10000)),
    );

    const totalLatency = successful.reduce((acc, r) => acc + (r.latencyMs ?? 0), 0);
    const avgLatencyMs = Math.round(totalLatency / respondingProviders);
    const maxLatencyMs = Math.max(...successful.map((r) => r.latencyMs ?? 0));

    const headBlock = Math.max(...successful.map((r) => r.blockNumber ?? 0));
    const minBlock = Math.min(...successful.map((r) => r.blockNumber ?? headBlock));
    const headLag = headBlock - minBlock;
    const blockAgreement = headLag <= 2;

    const measurements: Record<string, string | number | boolean> = {
      totalProviders,
      respondingProviders,
      availabilityBps,
      avgLatencyMs,
      maxLatencyMs,
      headBlock,
      headLag,
      blockAgreement,
      latencyThresholdMs: target.latencyThresholdMs,
    };

    const { state, severity, confidenceBps } = this.deriveHealth(
      target,
      respondingProviders,
      availabilityBps,
      avgLatencyMs,
      headLag,
      blockAgreement,
    );

    const evidence = this.createEvidence(target, results, measurements, nowSec);

    return {
      state,
      severity,
      confidenceBps,
      observedAt: nowSec,
      observedBlock: headBlock,
      measurements,
      evidence,
    };
  }

  normalize(target: RpcTargetConfig, raw: RawObservation): HealthObservation {
    return {
      dependencyId: target.dependencyId,
      dependencyType: "rpc",
      chainId: target.chainId,
      state: raw.state,
      severity: raw.severity,
      confidenceBps: raw.confidenceBps,
      observedAt: raw.observedAt,
      observedBlock: raw.observedBlock,
      methodId: target.methodId ?? "rpc-provider-v1",
      methodVersion: target.methodVersion ?? 1,
      measurements: raw.measurements,
      evidence: raw.evidence,
    };
  }

  private deriveHealth(
    target: RpcTargetConfig,
    respondingProviders: number,
    availabilityBps: number,
    avgLatencyMs: number,
    headLag: number,
    blockAgreement: boolean,
  ): { state: HealthState; severity: number; confidenceBps: number } {
    if (respondingProviders === 0) {
      return { state: "unavailable", severity: 100, confidenceBps: 10000 };
    }

    if (availabilityBps < 5000) {
      return { state: "critical", severity: 80, confidenceBps: 9000 };
    }

    const thresholdMs = target.latencyThresholdMs;

    if (avgLatencyMs > thresholdMs * 2 || headLag > 5 || !blockAgreement) {
      return { state: "degraded", severity: 65, confidenceBps: 8500 };
    }

    if (avgLatencyMs > thresholdMs || availabilityBps < 10000) {
      return { state: "watch", severity: 30, confidenceBps: 9500 };
    }

    return { state: "healthy", severity: 0, confidenceBps: 10000 };
  }

  private async sampleEndpoint(
    id: string,
    rawUrl: string,
    timeoutMs: number,
  ): Promise<RpcEndpointResult> {
    const sanitizedUrl = sanitizeRpcUrl(rawUrl);
    const start = Date.now();

    try {
      const client = createPublicClient({
        transport: http(rawUrl, { timeout: timeoutMs }),
      });

      const blockNumber = await client.getBlockNumber();
      return {
        id,
        url: sanitizedUrl,
        success: true,
        blockNumber: Number(blockNumber),
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      return {
        id,
        url: sanitizedUrl,
        success: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  private createEvidence(
    target: RpcTargetConfig,
    results: RpcEndpointResult[],
    measurements: Record<string, string | number | boolean>,
    observedAt: number,
  ): EvidenceHash {
    const payload = {
      targetId: target.targetId,
      dependencyId: target.dependencyId,
      chainId: target.chainId,
      observedAt,
      measurements,
      providers: results.map((r) => ({
        id: r.id,
        url: r.url,
        success: r.success,
        blockNumber: r.blockNumber,
        latencyMs: r.latencyMs,
        error: r.error,
      })),
    };

    const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");

    return {
      algorithm: "sha256",
      hash,
    };
  }
}
