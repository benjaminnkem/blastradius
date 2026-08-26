import Link from "next/link";
import { BracketButton } from "../../../components/ui/bracket-button";
import { Pane } from "../../../components/ui/pane";
import { StatusTag } from "../../../components/ui/status-tag";
import { TerminalShell } from "../../../components/ui/terminal-shell";

interface ProtocolPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProtocolDetailPage({ params }: ProtocolPageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  const operations = [
    {
      name: "Borrow Operation (aave:operation:borrow)",
      criticalDependencies: ["aave:vault:usdc", "sequencer:base", "chainlink:usdc-usd:8453"],
      status: "healthy",
    },
    {
      name: "Liquidation Operation (aave:operation:liquidation)",
      criticalDependencies: ["aave:vault:weth", "sequencer:base", "chainlink:eth-usd:8453"],
      status: "healthy",
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
          <span>PROTOCOL_RISK_PROFILE</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[#33ff00] font-bold">&gt;</span>
              <h1 className="text-xl sm:text-2xl font-bold font-mono uppercase text-[#33ff00] text-glow-green">
                Protocol // {decodedId}
              </h1>
            </div>
            <p className="font-mono text-xs text-[#79a879] mt-1">
              Active dependency exposure across vaults, oracles, and smart contract operations.
            </p>
          </div>
          <StatusTag status="healthy" />
        </div>
      </section>

      {/* Protocol Operations Breakdown */}
      <Pane title="REGISTERED_OPERATIONS" status="TRACKED_TOTAL: 2">
        <div className="flex flex-col gap-4 font-mono text-xs">
          {operations.map((op, idx) => (
            <div key={idx} className="p-4 border border-[#1f521f] bg-[#0a0a0a] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[#33ff00] font-bold text-sm">{op.name}</span>
                <StatusTag status={op.status} />
              </div>
              <div className="mt-2 text-[#79a879]">
                <span className="text-[11px] font-bold">UPSTREAM_DEPENDENCIES:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {op.criticalDependencies.map((dep) => (
                    <Link
                      key={dep}
                      href={`/dependencies/${encodeURIComponent(dep)}`}
                      className="px-2 py-0.5 border border-[#1f521f] text-[#c8d2c8] hover:border-[#33ff00] hover:text-[#33ff00]"
                    >
                      {dep}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Pane>

      <div className="flex justify-end">
        <Link href="/system">
          <BracketButton variant="ghost">Back to System Overview</BracketButton>
        </Link>
      </div>
    </TerminalShell>
  );
}
