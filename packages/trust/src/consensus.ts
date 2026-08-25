import type {
  AgreementState,
  DependencyType,
  HealthAssertionRecord,
  HealthConsensus,
  HealthState,
  ResolvedCreatorObservation,
  TrustPolicy,
} from "@blastradius/schemas";
import { classifyPublisher, type ScopeCheckTarget } from "./classification.js";

export interface ResolveHealthConsensusInput {
  dependencyId: string;
  dependencyType: DependencyType;
  assertions: readonly HealthAssertionRecord[];
  policy: TrustPolicy;
  chainId?: number;
  nowSec?: number;
  maxAgeSec?: number;
  computedAt?: string;
}

const HEALTH_STATE_SEVERITY_ORDER: Record<HealthState, number> = {
  critical: 6,
  degraded: 5,
  unavailable: 4,
  watch: 3,
  unknown: 2,
  healthy: 1,
};

/**
 * Resolves a collection of HealthAssertion records into an authoritative consensus health state.
 *
 * Invariants:
 * 1. Quorum is creator-based. 1 creator posting N assertions = 1 active observer vote.
 * 2. Creators must be trusted for the target scope in the active TrustPolicy.
 * 3. Never default missing/insufficient observations to healthy (fails closed to 'unknown' / 'insufficient').
 * 4. Ties are broken conservatively by worst-case state.
 */
export function resolveHealthConsensus(input: ResolveHealthConsensusInput): HealthConsensus {
  const {
    dependencyId,
    dependencyType,
    assertions,
    policy,
    chainId,
    nowSec,
    maxAgeSec = 600,
    computedAt = new Date().toISOString(),
  } = input;

  const targetScope: ScopeCheckTarget = {
    dependencyId,
    dependencyType,
    chainId,
  };

  // 1. Calculate total eligible monitor count in scope
  const eligibleMonitors = policy.publishers.filter((p) => {
    if (!p.enabled || !p.roles.includes("monitor")) return false;
    const classification = classifyPublisher(p.address, "monitor", targetScope, policy);
    return classification.trusted;
  });
  const expectedTrustedCreators = eligibleMonitors.length;
  const minimumRequired = policy.quorum?.minMonitors ?? 1;

  // 2. Group assertions by normalized creator
  const assertionsByCreator = new Map<string, HealthAssertionRecord[]>();

  for (const assertion of assertions) {
    if (assertion.attributes.dependency_id !== dependencyId) {
      continue;
    }

    const creator = assertion.metadata.creator.toLowerCase();

    // Check classification
    const classification = classifyPublisher(creator, "monitor", targetScope, policy);
    if (!classification.trusted) {
      continue;
    }

    // Check expiration / age if nowSec is provided
    if (nowSec !== undefined) {
      const observedAt = assertion.attributes.observed_at;
      if (observedAt < nowSec - maxAgeSec || observedAt > nowSec + 60) {
        // Assertion is too old or from the future
        continue;
      }
    }

    const existing = assertionsByCreator.get(creator) ?? [];
    existing.push(assertion);
    assertionsByCreator.set(creator, existing);
  }

  // 3. For each creator, select their single newest valid assertion
  const observations: ResolvedCreatorObservation[] = [];

  for (const [creator, creatorAssertions] of assertionsByCreator.entries()) {
    // Sort newest first by observed_at descending, then createdAtBlock descending
    const sorted = [...creatorAssertions].sort((a, b) => {
      const timeDiff = b.attributes.observed_at - a.attributes.observed_at;
      if (timeDiff !== 0) return timeDiff;
      return (b.metadata.createdAtBlock ?? 0) - (a.metadata.createdAtBlock ?? 0);
    });

    const newest = sorted[0];
    if (newest) {
      const publisher = eligibleMonitors.find((p) => p.address.toLowerCase() === creator);
      observations.push({
        creator: creator as `0x${string}`,
        publisherId: publisher?.id,
        observationId: newest.attributes.observation_id,
        state: newest.attributes.state,
        severity: newest.attributes.severity,
        confidenceBps: newest.attributes.confidence_bps,
        observedAt: newest.attributes.observed_at,
        observedBlock: newest.attributes.observed_block,
        methodId: newest.attributes.method_id,
        methodVersion: newest.attributes.method_version,
        entityKey: newest.metadata.key,
        expiresAtBlock: newest.metadata.expiresAtBlock,
      });
    }
  }

  const activeTrustedCreators = observations.length;
  const quorumMet = activeTrustedCreators >= minimumRequired;

  // 4. Compute distribution
  const byState: Record<HealthState, number> = {
    healthy: 0,
    watch: 0,
    degraded: 0,
    critical: 0,
    unknown: 0,
    unavailable: 0,
  };

  for (const obs of observations) {
    byState[obs.state] = (byState[obs.state] ?? 0) + 1;
  }

  // 5. Handle insufficient quorum
  if (!quorumMet || activeTrustedCreators === 0) {
    return {
      dependencyId,
      dependencyType,
      aggregateState: "unknown",
      aggregateSeverity: null,
      coverage: {
        activeTrustedCreators,
        expectedTrustedCreators,
        minimumRequired,
      },
      agreement: "insufficient",
      byState,
      observations,
      computedAt,
    };
  }

  // 6. Find state with max votes and check for ties
  let maxVotes = 0;
  let candidates: HealthState[] = [];

  for (const [state, count] of Object.entries(byState) as [HealthState, number][]) {
    if (count > maxVotes) {
      maxVotes = count;
      candidates = [state];
    } else if (count === maxVotes && count > 0) {
      candidates.push(state);
    }
  }

  // Break ties using conservative worst-case order
  candidates.sort((a, b) => HEALTH_STATE_SEVERITY_ORDER[b] - HEALTH_STATE_SEVERITY_ORDER[a]);
  const aggregateState = candidates[0] ?? "unknown";

  const agreementBps = Math.min(
    10000,
    Math.max(0, Math.round((maxVotes / activeTrustedCreators) * 10000)),
  );

  const agreementThresholdBps = policy.quorum?.agreementThresholdBps ?? 6600;

  let agreement: AgreementState;
  if (agreementBps === 10000) {
    agreement = "unanimous";
  } else if (agreementBps >= agreementThresholdBps) {
    agreement = "majority";
  } else {
    agreement = "split";
  }

  // 7. Calculate aggregate severity for winning state
  const winningObservations = observations.filter(
    (o) => o.state === aggregateState && o.severity !== null,
  );

  let aggregateSeverity: number | null = null;
  if (winningObservations.length > 0) {
    const severities = winningObservations.map((o) => o.severity);
    aggregateSeverity = Math.max(...severities);
  }

  return {
    dependencyId,
    dependencyType,
    aggregateState,
    aggregateSeverity,
    coverage: {
      activeTrustedCreators,
      expectedTrustedCreators,
      minimumRequired,
    },
    agreement,
    byState,
    observations,
    computedAt,
  };
}
