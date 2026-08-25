import { describe, expect, it } from "vitest";
import type { HealthObservation } from "@blastradius/schemas";
import { decidePublication } from "./pipeline/decision.js";
import type { LastPublicationRecord } from "./pipeline/types.js";

describe("decidePublication Cadence Engine", () => {
  const baseObservation: HealthObservation = {
    dependencyId: "sequencer:base",
    dependencyType: "sequencer",
    state: "healthy",
    severity: 0,
    confidenceBps: 10000,
    observedAt: 1000,
    methodId: "sequencer-health-v1",
    methodVersion: 1,
    measurements: { lagSec: 5 },
  };

  it("publishes on initial observation when no prior publication exists", () => {
    const decision = decidePublication({
      currentObservation: baseObservation,
      lastPublication: null,
    });
    expect(decision.shouldPublish).toBe(true);
    expect(decision.reason).toBe("initial_publication");
  });

  it("immediately publishes on health state transition (healthy -> degraded)", () => {
    const lastPub: LastPublicationRecord = {
      observationId: "obs-1",
      state: "healthy",
      severity: 0,
      publishedAtSec: 1000,
    };

    const decision = decidePublication({
      currentObservation: {
        ...baseObservation,
        state: "degraded",
        severity: 50,
      },
      lastPublication: lastPub,
      nowSec: 1010, // only 10s elapsed
    });

    expect(decision.shouldPublish).toBe(true);
    expect(decision.reason).toBe("immediate_state_change");
  });

  it("immediately publishes on significant severity delta within same state", () => {
    const lastPub: LastPublicationRecord = {
      observationId: "obs-1",
      state: "degraded",
      severity: 40,
      publishedAtSec: 1000,
    };

    const decision = decidePublication({
      currentObservation: {
        ...baseObservation,
        state: "degraded",
        severity: 65, // delta = 25 >= 10
      },
      lastPublication: lastPub,
      nowSec: 1015,
      severityChangeThreshold: 10,
    });

    expect(decision.shouldPublish).toBe(true);
    expect(decision.reason).toBe("immediate_state_change");
  });

  it("publishes degraded cadence after degradedCadenceSec has elapsed", () => {
    const lastPub: LastPublicationRecord = {
      observationId: "obs-1",
      state: "degraded",
      severity: 50,
      publishedAtSec: 1000,
    };

    const decision = decidePublication({
      currentObservation: {
        ...baseObservation,
        state: "degraded",
        severity: 50,
      },
      lastPublication: lastPub,
      degradedCadenceSec: 60,
      nowSec: 1065, // 65s elapsed
    });

    expect(decision.shouldPublish).toBe(true);
    expect(decision.reason).toBe("degraded_cadence");
  });

  it("publishes regular healthy renewal cadence before ephemeral assertion TTL expires", () => {
    const lastPub: LastPublicationRecord = {
      observationId: "obs-1",
      state: "healthy",
      severity: 0,
      publishedAtSec: 1000,
    };

    const decision = decidePublication({
      currentObservation: baseObservation,
      lastPublication: lastPub,
      healthyCadenceSec: 200,
      nowSec: 1205, // 205s elapsed
    });

    expect(decision.shouldPublish).toBe(true);
    expect(decision.reason).toBe("regular_cadence");
  });

  it("skips publication when state and severity are unchanged within window", () => {
    const lastPub: LastPublicationRecord = {
      observationId: "obs-1",
      state: "healthy",
      severity: 0,
      publishedAtSec: 1000,
    };

    const decision = decidePublication({
      currentObservation: baseObservation,
      lastPublication: lastPub,
      healthyCadenceSec: 200,
      nowSec: 1050, // only 50s elapsed
    });

    expect(decision.shouldPublish).toBe(false);
    expect(decision.reason).toBe("skip_unchanged");
  });
});
