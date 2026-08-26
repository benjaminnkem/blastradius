import { createHash } from "node:crypto";
import type {
  EvidenceHash,
  HealthObservation,
  HealthState,
  OracleTargetConfig,
} from "@blastradius/schemas";
import { createPublicClient, formatUnits, http } from "viem";
import type {
  MonitorObservationOptions,
  MonitorPlugin,
  RawObservation,
} from "../pipeline/types.js";
import { sanitizeRpcUrl } from "./sequencer.js";

export const AGGREGATOR_V3_ABI = [
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface OracleProviderResult {
  url: string;
  success: boolean;
  roundId?: bigint;
  answer?: bigint;
  updatedAt?: bigint;
  answeredInRound?: bigint;
  decimals?: number;
  latencyMs?: number;
  error?: string;
}

/**
 * Production monitor for Chainlink AggregatorV3 price feeds.
 *
 * Implements methodology: chainlink-feed-v1
 * - Reads on-chain latestRoundData() and decimals() via viem across redundant RPC endpoints.
 * - Verifies round progression and non-zero/non-negative price.
 * - Measures staleness against official configured heartbeat.
 * - Derives deterministic health state and evidence hash.
 */
export class OracleMonitor implements MonitorPlugin<OracleTargetConfig> {
  readonly type = "oracle" as const;

  async observe(
    target: OracleTargetConfig,
    options?: MonitorObservationOptions,
  ): Promise<RawObservation> {
    const timeoutMs = options?.timeoutMs ?? 3000;
    const nowSec = options?.nowSec ?? Math.floor(Date.now() / 1000);

    const providerPromises = target.rpcUrls.map((rpcUrl) =>
      this.sampleProvider(rpcUrl, target, timeoutMs),
    );

    const providerResults = await Promise.all(providerPromises);
    const successful = providerResults.filter((p) => p.success && p.roundId !== undefined);

    // Case 1: Complete RPC failure across all configured endpoints
    if (successful.length === 0) {
      const measurements: Record<string, string | number | boolean> = {
        providerCount: 0,
        feedAddress: target.feedAddress,
        heartbeatSec: target.heartbeatSec,
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

    // Pick newest valid result among successful providers
    const newest = successful.reduce((prev, curr) =>
      (curr.updatedAt ?? 0n) >= (prev.updatedAt ?? 0n) ? curr : prev,
    );

    const roundId = newest.roundId!;
    const rawAnswer = newest.answer!;
    const updatedAt = Number(newest.updatedAt ?? 0n);
    const answeredInRound = newest.answeredInRound!;
    const decimals = newest.decimals ?? target.feedDecimals;

    const formattedAnswer = formatUnits(rawAnswer, decimals);
    const stalenessSec = Math.max(0, nowSec - updatedAt);
    const isHeartbeatViolated = stalenessSec > target.heartbeatSec;
    const isRoundValid = answeredInRound >= roundId && updatedAt > 0 && rawAnswer > 0n;

    const totalLatency = successful.reduce((acc, p) => acc + (p.latencyMs ?? 0), 0);
    const avgLatencyMs = Math.round(totalLatency / successful.length);

    const measurements: Record<string, string | number | boolean> = {
      feedAddress: target.feedAddress,
      roundId: roundId.toString(),
      answeredInRound: answeredInRound.toString(),
      rawAnswer: rawAnswer.toString(),
      formattedAnswer,
      updatedAt,
      stalenessSec,
      heartbeatSec: target.heartbeatSec,
      isHeartbeatViolated,
      isRoundValid,
      providerCount: successful.length,
      latencyMs: avgLatencyMs,
    };

    const { state, severity, confidenceBps } = this.deriveHealth(
      target,
      isRoundValid,
      rawAnswer,
      updatedAt,
      stalenessSec,
    );

    const evidence = this.createEvidence(target, providerResults, measurements, nowSec);

    return {
      state,
      severity,
      confidenceBps,
      observedAt: nowSec,
      measurements,
      evidence,
    };
  }

  normalize(target: OracleTargetConfig, raw: RawObservation): HealthObservation {
    return {
      dependencyId: target.dependencyId,
      dependencyType: "oracle",
      chainId: target.chainId,
      state: raw.state,
      severity: raw.severity,
      confidenceBps: raw.confidenceBps,
      observedAt: raw.observedAt,
      methodId: target.methodId ?? "chainlink-feed-v1",
      methodVersion: target.methodVersion ?? 1,
      measurements: raw.measurements,
      evidence: raw.evidence,
    };
  }

  private deriveHealth(
    target: OracleTargetConfig,
    isRoundValid: boolean,
    rawAnswer: bigint,
    updatedAt: number,
    stalenessSec: number,
  ): { state: HealthState; severity: number; confidenceBps: number } {
    if (!isRoundValid || rawAnswer <= 0n || updatedAt === 0) {
      return { state: "critical", severity: 100, confidenceBps: 10000 };
    }

    const hb = target.heartbeatSec;

    if (stalenessSec > hb * 2) {
      const extra = Math.min(20, Math.round(((stalenessSec - hb * 2) / hb) * 20));
      return {
        state: "critical",
        severity: Math.min(100, 80 + extra),
        confidenceBps: 9500,
      };
    }

    if (stalenessSec > hb) {
      const extra = Math.min(19, Math.round(((stalenessSec - hb) / hb) * 20));
      return {
        state: "degraded",
        severity: Math.max(60, 60 + extra),
        confidenceBps: 9000,
      };
    }

    if (stalenessSec > hb * 0.85) {
      return { state: "watch", severity: 30, confidenceBps: 10000 };
    }

    return { state: "healthy", severity: 0, confidenceBps: 10000 };
  }

  private async sampleProvider(
    rpcUrl: string,
    target: OracleTargetConfig,
    timeoutMs: number,
  ): Promise<OracleProviderResult> {
    const sanitizedUrl = sanitizeRpcUrl(rpcUrl);
    const start = Date.now();

    try {
      const client = createPublicClient({
        transport: http(rpcUrl, { timeout: timeoutMs }),
      });

      const roundData = await client.readContract({
        address: target.feedAddress as `0x${string}`,
        abi: AGGREGATOR_V3_ABI,
        functionName: "latestRoundData",
      });

      const [roundId, answer, , updatedAt, answeredInRound] = roundData;

      return {
        url: sanitizedUrl,
        success: true,
        roundId,
        answer,
        updatedAt,
        answeredInRound,
        decimals: target.feedDecimals,
        latencyMs: Date.now() - start,
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
    target: OracleTargetConfig,
    providerResults: OracleProviderResult[],
    measurements: Record<string, string | number | boolean>,
    observedAt: number,
  ): EvidenceHash {
    const payload = {
      targetId: target.targetId,
      dependencyId: target.dependencyId,
      chainId: target.chainId,
      feedAddress: target.feedAddress,
      observedAt,
      measurements,
      providers: providerResults.map((p) => ({
        url: p.url,
        success: p.success,
        latencyMs: p.latencyMs,
        error: p.error,
      })),
    };

    const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");

    return {
      algorithm: "sha256",
      hash,
    };
  }
}
