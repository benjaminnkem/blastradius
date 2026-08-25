import type { HealthObservation } from "@blastradius/schemas";
import type { LastPublicationRecord, PublicationDecision } from "./types.js";

export interface DecidePublicationParams {
  currentObservation: HealthObservation;
  lastPublication?: LastPublicationRecord | null;
  healthyCadenceSec?: number; // e.g. 200s (before 300s TTL expires)
  degradedCadenceSec?: number; // e.g. 60s
  severityChangeThreshold?: number; // e.g. 10 points
  nowSec?: number;
}

/**
 * Evaluates whether a new observation warrants publishing a fresh HealthAssertion entity to Arkiv.
 *
 * Invariants:
 * 1. Immediate publication on material state change (e.g. healthy -> degraded).
 * 2. Frequent publication when degraded or critical (degradedCadenceSec, default 60s).
 * 3. Regular heartbeat publication when healthy before ephemeral assertion TTL expires (default 200s for 300s TTL).
 * 4. Skips redundant publication when health state is unchanged within cadence window.
 */
export function decidePublication(params: DecidePublicationParams): PublicationDecision {
  const {
    currentObservation,
    lastPublication,
    healthyCadenceSec = 200,
    degradedCadenceSec = 60,
    severityChangeThreshold = 10,
    nowSec = Math.floor(Date.now() / 1000),
  } = params;

  if (!lastPublication) {
    return { shouldPublish: true, reason: "initial_publication" };
  }

  // 1. Immediate publication on health state transition
  if (currentObservation.state !== lastPublication.state) {
    return { shouldPublish: true, reason: "immediate_state_change" };
  }

  // 2. Immediate publication on significant severity delta
  if (
    lastPublication.severity !== null &&
    Math.abs(currentObservation.severity - lastPublication.severity) >= severityChangeThreshold
  ) {
    return { shouldPublish: true, reason: "immediate_state_change" };
  }

  const elapsedSec = nowSec - lastPublication.publishedAtSec;

  // 3. Degraded / Critical cadence
  if (
    currentObservation.state === "degraded" ||
    currentObservation.state === "critical" ||
    currentObservation.state === "watch"
  ) {
    if (elapsedSec >= degradedCadenceSec) {
      return { shouldPublish: true, reason: "degraded_cadence" };
    }
  }

  // 4. Regular healthy renewal cadence (to refresh ephemeral assertion before expiration)
  if (currentObservation.state === "healthy") {
    if (elapsedSec >= healthyCadenceSec) {
      return { shouldPublish: true, reason: "regular_cadence" };
    }
  }

  return { shouldPublish: false, reason: "skip_unchanged" };
}
