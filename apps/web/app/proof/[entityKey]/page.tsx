import Link from "next/link";
import { BracketButton } from "../../../components/ui/bracket-button";
import { Pane } from "../../../components/ui/pane";
import { StatusTag } from "../../../components/ui/status-tag";
import { TerminalShell } from "../../../components/ui/terminal-shell";

interface ProofPageProps {
  params: Promise<{
    entityKey: string;
  }>;
}

export default async function ProofDetailPage({ params }: ProofPageProps) {
  const { entityKey } = await params;
  const decodedKey = decodeURIComponent(entityKey);

  const sampleMetadata = {
    key: decodedKey,
    creator: "0x1111111111111111111111111111111111111111",
    owner: "0x1111111111111111111111111111111111111111",
    createdAtBlock: 24910281,
    expiresAtBlock: 24910381,
    project: "blastradius-v1",
    kind: "health_assertion",
  };

  const samplePayload = {
    observationId: "obs-base-sequencer-1700000000",
    dependencyId: "sequencer:base",
    dependencyType: "sequencer",
    chainId: 8453,
    state: "healthy",
    severity: 0,
    confidenceBps: 10000,
    observedAt: 1700000000,
    methodId: "sequencer-health-v1",
    methodVersion: 1,
    checks: {
      headProgression: { passed: true, unsafeHead: 34711289, blockGapSec: 2 },
      safeLag: { passed: true, safeLagSec: 12 },
      providerAgreement: { passed: true, agreeingProviders: 3, totalProviders: 3 },
    },
  };

  return (
    <TerminalShell>
      {/* Header */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-[#79a879]">
          <Link href="/system" className="hover:text-[#33ff00]">
            [SYSTEM_CONSOLE]
          </Link>
          <span>/</span>
          <span>ARKIV_PROOF_INSPECTOR</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[#33ff00] font-bold">&gt;</span>
              <h1 className="text-xl sm:text-2xl font-bold font-mono uppercase text-[#33ff00] text-glow-green">
                Provenance // Arkiv Entity
              </h1>
            </div>
            <p className="font-mono text-xs text-[#79a879] mt-1 break-all">
              Key: <strong className="text-[#c8d2c8]">{decodedKey}</strong>
            </p>
          </div>
          <StatusTag status="healthy" label="[VERIFIED] SIGNED" />
        </div>
      </section>

      {/* Trust & Creator Provenance */}
      <Pane title="CREATOR_PROVENANCE_&amp;_TRUST_CLASSIFICATION" status="TRUSTED_PUBLISHER">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs p-4 border border-[#1f521f] bg-[#0a120a]">
          <div>
            <span className="text-[#79a879] text-[10px]">CREATOR_ADDRESS:</span>
            <div className="font-bold text-[#33ff00] text-xs mt-0.5 break-all">
              {sampleMetadata.creator}
            </div>
          </div>
          <div>
            <span className="text-[#79a879] text-[10px]">ROLE_CLASSIFICATION:</span>
            <div className="font-bold text-[#33ff00] text-xs mt-0.5">MONITOR / CURATOR</div>
          </div>
          <div>
            <span className="text-[#79a879] text-[10px]">CREATED_BLOCK:</span>
            <div className="font-bold text-[#c8d2c8] text-xs mt-0.5">
              #{sampleMetadata.createdAtBlock}
            </div>
          </div>
          <div>
            <span className="text-[#79a879] text-[10px]">EXPIRATION_BLOCK:</span>
            <div className="font-bold text-[#ffb000] text-xs mt-0.5">
              #{sampleMetadata.expiresAtBlock}
            </div>
          </div>
        </div>
      </Pane>

      {/* Raw Payload JSON */}
      <Pane title="ON_CHAIN_ATTRIBUTES_&amp;_PAYLOAD" status="JSON_SCHEMA_VALID">
        <pre className="p-4 border border-[#1f521f] bg-[#050805] text-[#33ff00] font-mono text-xs overflow-x-auto">
          {JSON.stringify(samplePayload, null, 2)}
        </pre>
      </Pane>

      <div className="flex justify-end">
        <Link href="/system">
          <BracketButton variant="ghost">Back to System Overview</BracketButton>
        </Link>
      </div>
    </TerminalShell>
  );
}
