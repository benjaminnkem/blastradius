import { createHash } from "node:crypto";
import type {
  EvidenceHash,
  HealthObservation,
  HealthState,
  SequencerTargetConfig,
} from "@blastradius/schemas";
import { createPublicClient, http } from "viem";
import type { MonitorPlugin, RawObservation } from "../pipeline/types.js";

export interface ProviderBlockResult {
  url: string;
  success: boolean;
  latestBlockNumber?: number;
  latestBlockTimestamp?: number;
  safeBlockNumber?: number;
  safeBlockTimestamp?: number;
  finalizedBlockNumber?: number;
  latencyMs?: number;
  error?: string;
}

export interface SequencerObservationOptions {
  timeoutMs?: number;
  nowSec?: number;
}

/**
 * Sanitizes an RPC URL by stripping basic auth credentials and query parameters.
 */
export function sanitizeRpcUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.username = "";
    url.password = "";
    url.search = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return rawUrl.replace(/\/\/[^@]+@/, "//").split("?")[0]!;
  }
}

/**
 * Production monitor for EVM / L2 Rollup Sequencers (e.g. Base chain ID 8453).
 *
 * Implements methodology: sequencer-health-v1
 * - Concurrently samples all configured RPC endpoints with explicit per-request timeout.
 * - Computes block gap (wall clock vs head) and safe head lag.
 * - Checks provider consensus and agreement.
 * - Derives deterministic health state, severity, and confidence basis points.
 */
export class SequencerMonitor implements MonitorPlugin<SequencerTargetConfig> {
  readonly type = "sequencer" as const;

  async observe(
    target: SequencerTargetConfig,
    options?: SequencerObservationOptions,
  ): Promise<RawObservation> {
    const timeoutMs = options?.timeoutMs ?? 3000;
    const nowSec = options?.nowSec ?? Math.floor(Date.now() / 1000);

    const providerPromises = target.rpcUrls.map((rpcUrl) =>
      this.sampleProvider(rpcUrl, target.chainId, timeoutMs),
    );

    const providerResults = await Promise.all(providerPromises);
    const successfulProviders = providerResults.filter((p) => p.success);
    const providerCount = successfulProviders.length;

    // Case 1: Complete provider failure / timeout on all endpoints
    if (providerCount === 0) {
      const measurements: Record<string, string | number | boolean> = {
        providerCount: 0,
        providerAgreement: false,
        totalConfiguredProviders: target.rpcUrls.length,
      };

      const evidence = this.createEvidence(target, providerResults, measurements, nowSec);

      return {
        state: "unavailable",
        severity: 100,
        confidenceBps: 10000,
        observedAt: nowSec,
        measurements,
        evidence,
      };
    }

    // Case 2: At least one provider responded
    const headBlock = Math.max(...successfulProviders.map((p) => p.latestBlockNumber ?? 0));
    const providerWithHead = successfulProviders.find((p) => p.latestBlockNumber === headBlock);
    const headTimestamp = providerWithHead?.latestBlockTimestamp ?? nowSec;

    const safeBlock = Math.max(
      ...successfulProviders.map((p) => p.safeBlockNumber ?? p.latestBlockNumber ?? 0),
    );
    const providerWithSafe =
      successfulProviders.find((p) => p.safeBlockNumber === safeBlock) ?? providerWithHead;
    const safeTimestamp = providerWithSafe?.safeBlockTimestamp ?? headTimestamp;

    const finalizedBlock = Math.max(
      ...successfulProviders.map((p) => p.finalizedBlockNumber ?? safeBlock),
    );

    const minBlock = Math.min(...successfulProviders.map((p) => p.latestBlockNumber ?? headBlock));
    const providerAgreement = headBlock - minBlock <= 2;

    const blockGapSec = Math.max(0, nowSec - headTimestamp);
    const safeLagSec = Math.max(0, headTimestamp - safeTimestamp);

    const totalLatency = successfulProviders.reduce((acc, p) => acc + (p.latencyMs ?? 0), 0);
    const avgLatencyMs = Math.round(totalLatency / providerCount);

    const measurements: Record<string, string | number | boolean> = {
      headBlock,
      headTimestamp,
      safeBlock,
      safeTimestamp,
      finalizedBlock,
      blockGapSec,
      safeLagSec,
      providerCount,
      providerAgreement,
      latencyMs: avgLatencyMs,
    };

    // Calculate state, severity, confidence according to sequencer-health-v1 methodology
    const { state, severity, confidenceBps } = this.deriveHealth(
      target,
      blockGapSec,
      safeLagSec,
      providerCount,
      providerAgreement,
    );

    const evidence = this.createEvidence(target, providerResults, measurements, nowSec);

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

  normalize(target: SequencerTargetConfig, raw: RawObservation): HealthObservation {
    return {
      dependencyId: target.dependencyId,
      dependencyType: "sequencer",
      chainId: target.chainId,
      state: raw.state,
      severity: raw.severity,
      confidenceBps: raw.confidenceBps,
      observedAt: raw.observedAt,
      observedBlock: raw.observedBlock,
      methodId: target.methodId ?? "sequencer-health-v1",
      methodVersion: target.methodVersion ?? 1,
      measurements: raw.measurements,
      evidence: raw.evidence,
    };
  }

  private deriveHealth(
    target: SequencerTargetConfig,
    blockGapSec: number,
    safeLagSec: number,
    providerCount: number,
    providerAgreement: boolean,
  ): { state: HealthState; severity: number; confidenceBps: number } {
    const thresholds = target.thresholds ?? {
      warningSafeLagSec: 120,
      criticalSafeLagSec: 600,
      maxBlockGapSec: 60,
    };

    if (blockGapSec > thresholds.maxBlockGapSec) {
      const severity = Math.min(100, Math.max(80, 80 + Math.round((blockGapSec - 60) / 3)));
      const confidenceBps = providerCount > 1 && providerAgreement ? 10000 : 7000;
      return { state: "critical", severity, confidenceBps };
    }

    if (safeLagSec > thresholds.criticalSafeLagSec) {
      const severity = Math.min(100, Math.max(80, 80 + Math.round((safeLagSec - 600) / 30)));
      return { state: "critical", severity, confidenceBps: 9000 };
    }

    if (
      blockGapSec > 15 ||
      safeLagSec > thresholds.warningSafeLagSec ||
      (!providerAgreement && providerCount > 1)
    ) {
      const severity = Math.max(60, Math.min(79, Math.round(blockGapSec * 2)));
      const confidenceBps = providerCount > 1 ? 9000 : 6000;
      return { state: "degraded", severity, confidenceBps };
    }

    if (blockGapSec > 8) {
      return { state: "watch", severity: 30, confidenceBps: 10000 };
    }

    return {
      state: "healthy",
      severity: 0,
      confidenceBps: providerCount > 1 ? 10000 : 8000,
    };
  }

  private async sampleProvider(
    rpcUrl: string,
    chainId: number,
    timeoutMs: number,
  ): Promise<ProviderBlockResult> {
    const sanitizedUrl = sanitizeRpcUrl(rpcUrl);
    const start = Date.now();

    try {
      const client = createPublicClient({
        transport: http(rpcUrl, { timeout: timeoutMs }),
      });

      const latestBlock = await client.getBlock({ blockTag: "latest" });
      const latencyMs = Date.now() - start;

      let safeBlockNumber: number | undefined;
      let safeBlockTimestamp: number | undefined;
      try {
        const safeBlock = await client.getBlock({ blockTag: "safe" });
        safeBlockNumber = Number(safeBlock.number);
        safeBlockTimestamp = Number(safeBlock.timestamp);
      } catch {
        // Safe tag may not be implemented on some non-rollup RPC nodes
      }

      let finalizedBlockNumber: number | undefined;
      try {
        const finalizedBlock = await client.getBlock({ blockTag: "finalized" });
        finalizedBlockNumber = Number(finalizedBlock.number);
      } catch {
        // Finalized tag may not be implemented
      }

      return {
        url: sanitizedUrl,
        success: true,
        latestBlockNumber: Number(latestBlock.number),
        latestBlockTimestamp: Number(latestBlock.timestamp),
        safeBlockNumber,
        safeBlockTimestamp,
        finalizedBlockNumber,
        latencyMs,
      };
    } catch (err) {
      return {
        url: sanitizedUrl,
        success: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  private createEvidence(
    target: SequencerTargetConfig,
    providerResults: ProviderBlockResult[],
    measurements: Record<string, string | number | boolean>,
    observedAt: number,
  ): EvidenceHash {
    const evidencePayload = {
      targetId: target.targetId,
      dependencyId: target.dependencyId,
      chainId: target.chainId,
      observedAt,
      measurements,
      providers: providerResults.map((p) => ({
        url: p.url,
        success: p.success,
        latestBlockNumber: p.latestBlockNumber,
        latencyMs: p.latencyMs,
        error: p.error,
      })),
    };

    const hash = createHash("sha256").update(JSON.stringify(evidencePayload)).digest("hex");

    return {
      algorithm: "sha256",
      hash,
    };
  }
}
