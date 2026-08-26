import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadTrustPolicyFile } from "@blastradius/config";
import type {
  DependencyType,
  HealthAssertionRecord,
  HealthConsensus,
  TrustPolicy,
} from "@blastradius/schemas";
import { resolveHealthConsensus } from "@blastradius/trust";
import { Injectable, type OnModuleInit } from "@nestjs/common";

@Injectable()
export class TrustService implements OnModuleInit {
  private trustPolicy: TrustPolicy = {
    version: 1,
    policyId: "blastradius-trust-v1",
    quorum: {
      minMonitors: 2,
      agreementThresholdBps: 6600,
      tieBreakerRule: "worst_case",
    },
    publishers: [
      {
        id: "official-curator",
        name: "BlastRadius Core Curator",
        address: "0x1111111111111111111111111111111111111111",
        roles: ["curator", "monitor"],
        enabled: true,
        scopes: { chains: [8453, 1] },
      },
      {
        id: "secondary-monitor",
        name: "Independent Monitor Node",
        address: "0x2222222222222222222222222222222222222222",
        roles: ["monitor"],
        enabled: true,
        scopes: { chains: [8453] },
      },
    ],
  };

  onModuleInit(): void {
    const candidates = [
      resolve(process.cwd(), "config/trust/trust-policy.yaml"),
      resolve(process.cwd(), "../../config/trust/trust-policy.yaml"),
      resolve(process.cwd(), "../config/trust/trust-policy.yaml"),
    ];
    const policyPath = candidates.find((p) => existsSync(p));

    if (policyPath) {
      try {
        this.trustPolicy = loadTrustPolicyFile(policyPath);
      } catch {
        // Fallback to default configured publishers
      }
    }
  }

  getTrustPolicy(): TrustPolicy {
    return this.trustPolicy;
  }

  setTrustPolicy(policy: TrustPolicy): void {
    this.trustPolicy = policy;
  }

  resolveConsensus(
    target: { dependencyId: string; dependencyType: string; chainId?: number },
    assertions: readonly HealthAssertionRecord[],
    nowSec?: number,
  ): HealthConsensus {
    const depType = (target.dependencyType || "sequencer") as DependencyType;

    return resolveHealthConsensus({
      dependencyId: target.dependencyId,
      dependencyType: depType,
      chainId: target.chainId,
      assertions,
      policy: this.trustPolicy,
      nowSec,
    });
  }
}
