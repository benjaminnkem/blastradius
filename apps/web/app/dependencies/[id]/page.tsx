import Link from "next/link";
import { BracketButton } from "../../../components/ui/bracket-button";
import { MetricBar } from "../../../components/ui/metric-bar";
import { Pane } from "../../../components/ui/pane";
import { StatusTag } from "../../../components/ui/status-tag";
import { TerminalShell } from "../../../components/ui/terminal-shell";

interface DependencyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DependencyDetailPage({ params }: DependencyPageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const depType = decodedId.split(":")[0] ?? "dependency";

  return (
    <TerminalShell>
      {/* Breadcrumb Header */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-[#79a879]">
          <Link href="/system" className="hover:text-[#33ff00]">
            [SYSTEM_CONSOLE]
          </Link>
          <span>/</span>
          <span>DEPENDENCY_INSPECTOR</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[#33ff00] font-bold">&gt;</span>
              <h1 className="text-xl sm:text-2xl font-bold font-mono uppercase text-[#33ff00] text-glow-green">
                Node // {decodedId}
              </h1>
            </div>
            <p className="font-mono text-xs text-[#79a879] mt-1">
              Type: <strong className="text-[#c8d2c8] uppercase">[{depType}]</strong> | Chain ID:{" "}
              <strong className="text-[#c8d2c8]">8453</strong>
            </p>
          </div>
          <StatusTag status="healthy" />
        </div>
      </section>

      {/* Consensus & Observer Quorum */}
      <Pane title="ACTIVE_CONSENSUS_STATE" status="QUORUM: 2/2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs p-4 border border-[#1f521f] bg-[#0a120a]">
          <div>
            <span className="text-[#79a879] text-[10px]">CONSENSUS_STATE:</span>
            <div className="font-bold text-[#33ff00] text-sm mt-0.5">HEALTHY</div>
          </div>
          <div>
            <span className="text-[#79a879] text-[10px]">AGREEMENT_LEVEL:</span>
            <div className="font-bold text-[#33ff00] text-sm mt-0.5">UNANIMOUS (100%)</div>
          </div>
          <div>
            <span className="text-[#79a879] text-[10px]">MONITOR_METHOD:</span>
            <div className="mt-0.5">
              <Link
                href="/methods/sequencer-health-v1"
                className="text-[#33ff00] underline decoration-[#1f521f]"
              >
                sequencer-health-v1
              </Link>
            </div>
          </div>
        </div>
      </Pane>

      {/* Downstream Blast Radius Summary */}
      <Pane title="DOWNSTREAM_BLAST_RADIUS_IMPACT" status="CYCLE_SAFE_TRAVERSAL">
        <div className="flex flex-col gap-4 font-mono text-xs">
          <p className="text-[#79a879]">
            If this node degrades, the following downstream operations and vaults are directly
            exposed:
          </p>

          <div className="p-4 border border-[#1f521f] bg-[#0a0a0a] flex flex-col gap-3">
            <MetricBar value={100} label="aave:vault:usdc (Criticality 100%)" variant="primary" />
            <MetricBar value={100} label="aave:vault:weth (Criticality 100%)" variant="primary" />
            <MetricBar value={100} label="aave:operation:borrow (Propagated)" variant="primary" />
            <MetricBar
              value={100}
              label="aave:operation:liquidation (Propagated)"
              variant="primary"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Link href={`/incidents/${encodeURIComponent(decodedId)}`}>
              <BracketButton variant="secondary">Simulate Incident Traversal</BracketButton>
            </Link>
          </div>
        </div>
      </Pane>
    </TerminalShell>
  );
}
