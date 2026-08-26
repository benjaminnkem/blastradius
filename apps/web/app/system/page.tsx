import Link from "next/link";
import { BracketButton } from "../../components/ui/bracket-button";
import { CommandSearch } from "../../components/ui/command-search";
import { Pane } from "../../components/ui/pane";
import { StatusTag } from "../../components/ui/status-tag";
import { TerminalShell } from "../../components/ui/terminal-shell";

export default function SystemPage() {
  const trackedDependencies = [
    {
      id: "sequencer:base",
      type: "sequencer",
      name: "Base Rollup Sequencer",
      chainId: 8453,
      health: "healthy",
      observers: "2/2",
      method: "sequencer-health-v1",
    },
    {
      id: "chainlink:usdc-usd:8453",
      type: "oracle",
      name: "Chainlink USDC / USD Price Feed (Base)",
      chainId: 8453,
      health: "healthy",
      observers: "2/2",
      method: "chainlink-feed-v1",
    },
    {
      id: "chainlink:eth-usd:8453",
      type: "oracle",
      name: "Chainlink ETH / USD Price Feed (Base)",
      chainId: 8453,
      health: "healthy",
      observers: "2/2",
      method: "chainlink-feed-v1",
    },
    {
      id: "aave:vault:usdc",
      type: "vault",
      name: "Aave v3 USDC Reserve (Base)",
      chainId: 8453,
      health: "healthy",
      observers: "2/2",
      method: "sequencer-health-v1",
    },
    {
      id: "aave:vault:weth",
      type: "vault",
      name: "Aave v3 WETH Reserve (Base)",
      chainId: 8453,
      health: "healthy",
      observers: "2/2",
      method: "sequencer-health-v1",
    },
  ];

  return (
    <TerminalShell>
      {/* Header / Search */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[#33ff00] font-bold">&gt;</span>
              <h1 className="text-xl sm:text-2xl font-bold font-mono uppercase text-[#33ff00] text-glow-green">
                System Topology &amp; Quorum Monitor
              </h1>
            </div>
            <p className="font-mono text-xs text-[#79a879] mt-1">
              Active consensus state across monitored layer-2 sequencers, oracle feeds, and protocol
              vaults.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#79a879]">CONSENSUS_ENGINE:</span>
            <StatusTag status="healthy" label="[OK] QUORUM MET" />
          </div>
        </div>

        <CommandSearch />
      </section>

      {/* Active Incidents Banner */}
      <Pane title="ACTIVE_QUORUM_INCIDENTS" status="FAIL_CLOSED_WATCH">
        <div className="flex flex-col gap-3 font-mono text-xs">
          <div className="p-4 border border-[#1f521f] bg-[#0a140a] text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="w-2.5 h-2.5 bg-[#33ff00] cursor-blink" />
              <div>
                <span className="text-[#33ff00] font-bold">
                  ALL MONITORED DEPENDENCIES WITHIN HEALTHY BOUNDS
                </span>
                <p className="text-[11px] text-[#79a879] mt-0.5">
                  0 active incidents across 5 tracked edges. Minimum quorum: 2 independent
                  observers.
                </p>
              </div>
            </div>
            <Link href="/incidents/sequencer:base">
              <BracketButton variant="ghost">Inspect Sequencer Incident View</BracketButton>
            </Link>
          </div>
        </div>
      </Pane>

      {/* Tracked Dependencies Table */}
      <Pane title="TRACKED_DEPENDENCY_NODES" status="BASE_CHAIN_8453">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1f521f] text-[#79a879] bg-[#0f130f]">
                <th className="p-2.5">SEMANTIC_ID</th>
                <th className="p-2.5">NAME</th>
                <th className="p-2.5">TYPE</th>
                <th className="p-2.5">STATUS</th>
                <th className="p-2.5">OBSERVERS</th>
                <th className="p-2.5">METHOD</th>
                <th className="p-2.5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {trackedDependencies.map((dep) => (
                <tr
                  key={dep.id}
                  className="border-b border-[#1f521f]/60 hover:bg-[#0f190f] transition-colors"
                >
                  <td className="p-2.5 font-bold text-[#c8d2c8]">{dep.id}</td>
                  <td className="p-2.5 text-[#79a879]">{dep.name}</td>
                  <td className="p-2.5 text-[#79a879] uppercase">[{dep.type}]</td>
                  <td className="p-2.5">
                    <StatusTag status={dep.health} />
                  </td>
                  <td className="p-2.5 text-[#33ff00] font-bold">{dep.observers}</td>
                  <td className="p-2.5">
                    <Link
                      href={`/methods/${dep.method}`}
                      className="text-[#79a879] hover:text-[#33ff00] underline decoration-[#1f521f]"
                    >
                      {dep.method}
                    </Link>
                  </td>
                  <td className="p-2.5 text-right">
                    <Link href={`/dependencies/${dep.id}`}>
                      <BracketButton variant="ghost" className="!text-[11px] !py-1 !px-2">
                        Inspect
                      </BracketButton>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Pane>

      {/* Protocol Exposure Summary */}
      <Pane title="PROTOCOL_RISK_MATRIX" status="TRACKED_PROTOCOLS">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-4 border border-[#1f521f] bg-[#0a0a0a] flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[#33ff00] font-bold text-sm">AAVE_V3 // BASE</span>
                <StatusTag status="healthy" />
              </div>
              <p className="text-[#79a879] text-[11px] mt-2">
                Monitors Base rollup sequencer, USDC oracle, and WETH oracle for borrow and
                liquidation operation dependencies.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#1f521f]/50">
              <span className="text-[#79a879]">
                OPERATIONS: <strong>2</strong>
              </span>
              <Link href="/protocols/aave-v3">
                <BracketButton variant="ghost" className="!text-[11px] !py-1 !px-2">
                  View Protocol Exposure
                </BracketButton>
              </Link>
            </div>
          </div>
        </div>
      </Pane>
    </TerminalShell>
  );
}
