import Link from "next/link";
import { DependencyPath } from "../../../components/ui/dependency-path";
import { MetricBar } from "../../../components/ui/metric-bar";
import { Pane } from "../../../components/ui/pane";
import { StatusTag } from "../../../components/ui/status-tag";
import { TerminalShell } from "../../../components/ui/terminal-shell";

interface IncidentPageProps {
  params: Promise<{
    dependency: string;
  }>;
}

export default async function IncidentDetailPage({ params }: IncidentPageProps) {
  const { dependency } = await params;
  const decodedDependency = decodeURIComponent(dependency);

  const sampleNodes = [
    {
      id: decodedDependency,
      type: "sequencer",
      label: decodedDependency,
      status: "critical",
      criticalityBps: 10000,
      propagationBps: 10000,
    },
    {
      id: "aave:vault:usdc",
      type: "vault",
      label: "Aave v3 USDC Vault",
      status: "critical",
      criticalityBps: 10000,
      propagationBps: 10000,
    },
    {
      id: "aave:operation:borrow",
      type: "operation",
      label: "USDC Borrow Operation",
      status: "critical",
    },
  ];

  return (
    <TerminalShell>
      {/* Header */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-[#79a879]">
          <Link href="/system" className="hover:text-[#33ff00]">
            [SYSTEM_CONSOLE]
          </Link>
          <span>/</span>
          <span>INCIDENT_INVESTIGATION</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[#ff3333] font-bold">&gt;</span>
              <h1 className="text-xl sm:text-2xl font-bold font-mono uppercase text-[#ff3333] text-glow-red">
                Incident // {decodedDependency}
              </h1>
            </div>
            <p className="font-mono text-xs text-[#79a879] mt-1">
              Authoritative quorum consensus and reverse blast radius exposure calculation.
            </p>
          </div>
          <StatusTag status="critical" label="[CRITICAL] STALLED" />
        </div>
      </section>

      {/* 1. WHAT IS WRONG? */}
      <Pane title="01 // WHAT_IS_WRONG" variant="danger">
        <div className="flex flex-col gap-4 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-[#ff3333]/40 bg-[#1f0a0a]">
            <div>
              <span className="text-[#79a879] text-[10px]">ROOT_DEPENDENCY:</span>
              <div className="font-bold text-[#c8d2c8] text-sm mt-0.5">{decodedDependency}</div>
            </div>
            <div>
              <span className="text-[#79a879] text-[10px]">CONSENSUS_STATE:</span>
              <div className="font-bold text-[#ff3333] text-sm mt-0.5">CRITICAL</div>
            </div>
            <div>
              <span className="text-[#79a879] text-[10px]">AGGREGATE_SEVERITY:</span>
              <div className="font-bold text-[#ff3333] text-sm mt-0.5">90 / 100</div>
            </div>
            <div>
              <span className="text-[#79a879] text-[10px]">OBSERVATION_METHOD:</span>
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
          <p className="text-[#79a879]">
            Head progression check detected that the rollup sequencer has not advanced the unsafe
            head for over 60 seconds across all registered RPC providers.
          </p>
        </div>
      </Pane>

      {/* 2. WHO REPORTS IT & HOW MUCH AGREEMENT? */}
      <Pane title="02 // WHO_REPORTS_IT // QUORUM_CONSENSUS" status="AGREEMENT: UNANIMOUS">
        <div className="flex flex-col gap-4 font-mono text-xs">
          <div className="flex items-center justify-between p-3 border border-[#1f521f] bg-[#0a120a]">
            <div>
              <span className="text-[#79a879]">OBSERVER_COVERAGE:</span>{" "}
              <strong className="text-[#33ff00]">2 / 2 TRUSTED MONITORS (100% QUORUM)</strong>
            </div>
            <div>
              <span className="text-[#79a879]">CONFIDENCE:</span>{" "}
              <strong className="text-[#33ff00]">100%</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1f521f] text-[#79a879] bg-[#0f130f]">
                  <th className="p-2">OBSERVER_ADDRESS</th>
                  <th className="p-2">REPORTED_STATE</th>
                  <th className="p-2">SEVERITY</th>
                  <th className="p-2">OBSERVED_AT</th>
                  <th className="p-2">ARKIV_PROOF</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#1f521f]/50">
                  <td className="p-2 text-[#c8d2c8] font-bold">
                    0x1111111111111111111111111111111111111111
                  </td>
                  <td className="p-2 text-[#ff3333]">CRITICAL</td>
                  <td className="p-2 text-[#ff3333]">90 / 100</td>
                  <td className="p-2 text-[#79a879]">12s ago</td>
                  <td className="p-2">
                    <Link
                      href="/proof/0x89ab12cd34ef567890abcdef1234567890abcdef1234567890abcdef12345678"
                      className="text-[#33ff00] underline"
                    >
                      [INSPECT_PROOF]
                    </Link>
                  </td>
                </tr>
                <tr className="border-b border-[#1f521f]/50">
                  <td className="p-2 text-[#c8d2c8] font-bold">
                    0x2222222222222222222222222222222222222222
                  </td>
                  <td className="p-2 text-[#ff3333]">CRITICAL</td>
                  <td className="p-2 text-[#ff3333]">90 / 100</td>
                  <td className="p-2 text-[#79a879]">10s ago</td>
                  <td className="p-2">
                    <Link
                      href="/proof/0xfe12dc34ba567890abcdef1234567890abcdef1234567890abcdef12345678"
                      className="text-[#33ff00] underline"
                    >
                      [INSPECT_PROOF]
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Pane>

      {/* 3. WHAT IS EXPOSED? */}
      <Pane
        title="03 // WHAT_IS_EXPOSED // BLAST_RADIUS_REVERSE_TRAVERSAL"
        status="EXPOSURE_PROPAGATION"
      >
        <div className="flex flex-col gap-4 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border border-[#1f521f] bg-[#0a0a0a]">
            <div>
              <span className="text-[#79a879] text-[10px]">AFFECTED_PROTOCOLS:</span>
              <div className="font-bold text-[#c8d2c8] text-sm mt-0.5">1 (Aave v3)</div>
            </div>
            <div>
              <span className="text-[#79a879] text-[10px]">EXPOSED_OPERATIONS:</span>
              <div className="font-bold text-[#ffb000] text-sm mt-0.5">2 (Borrow, Liquidation)</div>
            </div>
            <div>
              <span className="text-[#79a879] text-[10px]">MAX_IMPACT_SEVERITY:</span>
              <div className="font-bold text-[#ff3333] text-sm mt-0.5">90 / 100</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[#33ff00] font-bold">PRIMARY_PROPAGATION_PATH:</span>
            <DependencyPath nodes={sampleNodes} highlightedIndex={0} />
          </div>

          <div className="p-3 border border-[#1f521f] bg-[#0a120a] flex flex-col gap-2">
            <span className="text-[#79a879] font-bold">OPERATION_BLAST_SCORES:</span>
            <MetricBar value={90} label="aave:operation:borrow" variant="danger" />
            <MetricBar value={90} label="aave:operation:liquidation" variant="danger" />
          </div>
        </div>
      </Pane>

      {/* 4. OFFICIAL PROTOCOL STATEMENT (SEPARATE FROM OBSERVER CLAIMS) */}
      <Pane title="04 // OFFICIAL_PROTOCOL_RESPONSE" status="PROTOCOL_GOVERNANCE">
        <div className="flex flex-col gap-2 font-mono text-xs text-[#79a879]">
          <div className="p-4 border border-[#1f521f] bg-[#0a0a0a]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#33ff00] font-bold">
                [ATTRIBUTED_STATEMENT] AAVE GUARDIAN / GOVERNANCE
              </span>
              <span className="text-[10px] text-[#79a879]">SOURCE: OFFICIAL_CONTRACT</span>
            </div>
            <p className="text-[#c8d2c8] text-xs">
              No protocol-level pause transactions have been submitted. Users are advised that
              transaction inclusions may be delayed while the layer-2 sequencer recovers.
            </p>
          </div>
        </div>
      </Pane>
    </TerminalShell>
  );
}
