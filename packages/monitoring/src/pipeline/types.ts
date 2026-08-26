import type {
  EvidenceHash,
  HealthObservation,
  HealthState,
  MonitorTargetConfig,
} from "@blastradius/schemas";

export type PublicationReason =
  | "initial_publication"
  | "immediate_state_change"
  | "degraded_cadence"
  | "regular_cadence"
  | "skip_unchanged"
  | "insufficient_coverage";

export interface PublicationDecision {
  shouldPublish: boolean;
  reason: PublicationReason;
}

export interface LastPublicationRecord {
  observationId: string;
  state: HealthState;
  severity: number | null;
  publishedAtSec: number;
  entityKey?: string;
}

export interface RawObservation {
  state: HealthState;
  severity: number;
  confidenceBps: number;
  observedAt: number;
  observedBlock?: number;
  measurements: Record<string, string | number | boolean>;
  evidence?: EvidenceHash;
}

export interface MonitorObservationOptions {
  timeoutMs?: number;
  nowSec?: number;
  [key: string]: unknown;
}

export interface MonitorPlugin<TConfig extends MonitorTargetConfig = MonitorTargetConfig> {
  readonly type: TConfig["type"];
  observe(target: TConfig, options?: MonitorObservationOptions): Promise<RawObservation>;
  normalize(target: TConfig, raw: RawObservation): HealthObservation;
}
