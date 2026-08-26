import {
  monitorObservationDurationMs,
  monitorObservationsTotal,
  monitorPublicationDurationMs,
  monitorPublicationErrorsTotal,
  monitorPublicationsTotal,
} from "@blastradius/observability";
import type {
  HealthAssertionAttributes,
  HealthAssertionPayload,
  HealthAssertionWriteInput,
  HealthObservation,
  MonitorTargetConfig,
} from "@blastradius/schemas";
import { decidePublication } from "../pipeline/decision.js";
import { getObservationIdFromObservation } from "../pipeline/idempotency.js";
import type {
  LastPublicationRecord,
  MonitorObservationOptions,
  MonitorPlugin,
  PublicationDecision,
} from "../pipeline/types.js";

export interface ArkivHealthWriter {
  publishHealthAssertion(
    input: HealthAssertionWriteInput,
  ): Promise<{ key: string; txHash?: string }>;
}

export interface MonitorRunnerOptions extends MonitorObservationOptions {
  healthAssertionTtlSec?: number;
}

export interface MonitorCycleResult {
  observation: HealthObservation;
  observationId: string;
  decision: PublicationDecision;
  publishedKey?: string;
}

/**
 * Orchestrates an end-to-end monitor observation cycle:
 * observe -> normalize -> decide publication -> publish to Arkiv -> update state -> record metrics.
 */
export class MonitorRunner<TConfig extends MonitorTargetConfig = MonitorTargetConfig> {
  private lastPublication: LastPublicationRecord | null = null;

  constructor(
    readonly target: TConfig,
    readonly plugin: MonitorPlugin<TConfig>,
    readonly writer?: ArkivHealthWriter,
  ) {}

  getLastPublication(): LastPublicationRecord | null {
    return this.lastPublication;
  }

  setLastPublication(record: LastPublicationRecord | null): void {
    this.lastPublication = record;
  }

  async runCycle(options?: MonitorRunnerOptions): Promise<MonitorCycleResult> {
    const obsStart = Date.now();

    // 1. Observe and Normalize
    const raw = await this.plugin.observe(this.target, options);
    const observation = this.plugin.normalize(this.target, raw);
    const observationId = getObservationIdFromObservation(observation);

    const obsDuration = Date.now() - obsStart;
    monitorObservationDurationMs.observe(obsDuration, {
      dependency_type: observation.dependencyType,
    });
    monitorObservationsTotal.inc({
      dependency_type: observation.dependencyType,
      state: observation.state,
    });

    // 2. Decide Publication
    const decision = decidePublication({
      currentObservation: observation,
      lastPublication: this.lastPublication,
      nowSec: observation.observedAt,
    });

    let publishedKey: string | undefined;

    // 3. Publish to Arkiv if required
    if (decision.shouldPublish && this.writer) {
      const pubStart = Date.now();
      try {
        const attributes: HealthAssertionAttributes = {
          project: "blastradius-v1",
          kind: "health_assertion",
          observation_id: observationId,
          dependency_id: observation.dependencyId,
          dependency_type: observation.dependencyType,
          chain_id: observation.chainId,
          state: observation.state,
          severity: observation.severity,
          confidence_bps: observation.confidenceBps,
          observed_at: observation.observedAt,
          observed_block: observation.observedBlock,
          method_id: observation.methodId,
          method_version: observation.methodVersion,
        };

        const payload: HealthAssertionPayload = {
          summary: `Sequencer ${observation.state} observation for ${observation.dependencyId}`,
          measurements: observation.measurements,
          evidence: observation.evidence,
        };

        const writeInput: HealthAssertionWriteInput = {
          attributes,
          payload,
          expiresInSec: options?.healthAssertionTtlSec ?? 300,
        };

        const writeResult = await this.writer.publishHealthAssertion(writeInput);
        publishedKey = writeResult.key;

        this.lastPublication = {
          observationId,
          state: observation.state,
          severity: observation.severity,
          publishedAtSec: observation.observedAt,
          entityKey: publishedKey,
        };

        const pubDuration = Date.now() - pubStart;
        monitorPublicationDurationMs.observe(pubDuration, { kind: "health_assertion" });
        monitorPublicationsTotal.inc({
          kind: "health_assertion",
          reason: decision.reason,
        });
      } catch (err) {
        monitorPublicationErrorsTotal.inc({
          kind: "health_assertion",
          error_code: err instanceof Error ? err.name : "UNKNOWN_ERROR",
        });
        throw err;
      }
    }

    return {
      observation,
      observationId,
      decision,
      publishedKey,
    };
  }
}
