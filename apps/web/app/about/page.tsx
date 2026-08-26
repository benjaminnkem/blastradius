import Link from "next/link";
import { BracketButton } from "../../components/ui/bracket-button";
import { Pane } from "../../components/ui/pane";
import { TerminalShell } from "../../components/ui/terminal-shell";

export default function AboutPage() {
  return (
    <TerminalShell>
      {/* Header */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-[#79a879]">
          <Link href="/system" className="hover:text-[#33ff00]">
            [SYSTEM_CONSOLE]
          </Link>
          <span>/</span>
          <span>SYSTEM_ARCHITECTURE</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[#33ff00] font-bold">&gt;</span>
          <h1 className="text-xl sm:text-2xl font-bold font-mono uppercase text-[#33ff00] text-glow-green">
            System Architecture &amp; Invariants
          </h1>
        </div>
      </section>

      {/* Core Thesis & Design */}
      <Pane title="THE_BLASTRADIUS_THESIS">
        <div className="flex flex-col gap-3 font-mono text-xs text-[#79a879] leading-relaxed">
          <p>
            DeFi protocols do not exist in isolation. Modern on-chain financial applications rely on
            complex, interdependent layers of rollup sequencers, cross-chain messaging bridges,
            oracle price aggregators, and RPC node clusters.
          </p>
          <p>
            BlastRadius is the first decentralized platform designed to compute the authoritative
            blast radius of infrastructure disruptions in real time, attesting ephemeral health
            telemetry onto Arkiv and evaluating consensus with creator-attributed quorum rules.
          </p>
        </div>
      </Pane>

      {/* Non-Negotiable Invariants */}
      <Pane title="NON_NEGOTIABLE_INVARIANTS" status="FORMAL_SPEC">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-4 border border-[#1f521f] bg-[#0a0a0a]">
            <div className="text-[#33ff00] font-bold mb-1">[01] CLAIM != TRUTH</div>
            <p className="text-[#79a879]">
              Arkiv creator provenance establishes who published a claim, not whether the claim is
              objectively correct. Quorum consensus is evaluated across independent monitors.
            </p>
          </div>

          <div className="p-4 border border-[#1f521f] bg-[#0a0a0a]">
            <div className="text-[#33ff00] font-bold mb-1">[02] CREATOR-BASED QUORUM</div>
            <p className="text-[#79a879]">
              One creator posting N entities counts as exactly one active observer vote. Sybil
              resistance is maintained via strict address deduplication and configured trust scopes.
            </p>
          </div>

          <div className="p-4 border border-[#1f521f] bg-[#0a0a0a]">
            <div className="text-[#33ff00] font-bold mb-1">[03] FAIL-CLOSED UNCERTAINTY</div>
            <p className="text-[#79a879]">
              Missing, expired, or unverified telemetry never defaults to healthy. Unobserved
              dependencies explicitly fail closed to <span className="text-[#ff3333]">UNKNOWN</span>{" "}
              or <span className="text-[#ff3333]">UNAVAILABLE</span>.
            </p>
          </div>

          <div className="p-4 border border-[#1f521f] bg-[#0a0a0a]">
            <div className="text-[#33ff00] font-bold mb-1">[04] OFF HOT PATH</div>
            <p className="text-[#79a879]">
              BlastRadius is an observability and risk intelligence engine. It does not hold
              protocol keys, pause contracts, or execute on-chain transactions directly.
            </p>
          </div>
        </div>
      </Pane>

      <div className="flex justify-end">
        <Link href="/system">
          <BracketButton variant="primary">Launch System Console</BracketButton>
        </Link>
      </div>
    </TerminalShell>
  );
}
