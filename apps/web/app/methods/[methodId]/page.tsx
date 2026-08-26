import Link from "next/link";
import { BracketButton } from "../../../components/ui/bracket-button";
import { Pane } from "../../../components/ui/pane";
import { StatusTag } from "../../../components/ui/status-tag";
import { TerminalShell } from "../../../components/ui/terminal-shell";

interface MethodPageProps {
  params: Promise<{
    methodId: string;
  }>;
}

export default async function MethodDetailPage({ params }: MethodPageProps) {
  const { methodId } = await params;
  const decodedMethod = decodeURIComponent(methodId);

  const methodsMap: Record<
    string,
    {
      name: string;
      description: string;
      checks: string[];
      thresholds: Record<string, string | number>;
    }
  > = {
    "sequencer-health-v1": {
      name: "Sequencer Health Progression",
      description:
        "Measures rollup head advancement, safe lag against critical limits, and multi-provider agreement across independent RPC nodes.",
      checks: [
        "Head Progression: verifies unsafe head timestamp is within max gap (60s).",
        "Safe Lag: verifies safe head is not trailing wall-clock time beyond warning (120s) or critical (600s) limits.",
        "Provider Agreement: queries 3 independent RPC providers to verify consensus block numbers.",
      ],
      thresholds: {
        warningSafeLagSec: 120,
        criticalSafeLagSec: 600,
        maxBlockGapSec: 60,
        minAgreeingProviders: 2,
      },
    },
    "chainlink-feed-v1": {
      name: "Chainlink AggregatorV3 Price Feed",
      description:
        "Observes round completeness, price positivity (> 0), and staleness relative to the configured feed heartbeat.",
      checks: [
        "Round Validity: latestRoundData() returned answeredInRound >= roundId.",
        "Positive Price: answer > 0.",
        "Heartbeat Staleness: updatedAt timestamp is within heartbeat + grace period (1.5x heartbeat).",
      ],
      thresholds: {
        graceMultiplier: 1.5,
        minPositivePrice: 1,
      },
    },
    "rpc-provider-v1": {
      name: "RPC Provider Cluster Health",
      description:
        "Measures endpoint availability, HTTP latency, block height agreement, and head advancement.",
      checks: [
        "Availability: endpoint returns 200 within timeout limit (5000ms).",
        "Latency: measures response latency in milliseconds.",
        "Head Lag: evaluates block height gap compared to cluster median.",
      ],
      thresholds: {
        timeoutMs: 5000,
        maxHeadLagBlocks: 5,
      },
    },
  };

  const currentMethod = methodsMap[decodedMethod] ?? {
    name: decodedMethod,
    description: "Standard monitoring methodology for infrastructure dependencies.",
    checks: ["Availability", "Liveness", "Agreement"],
    thresholds: { defaultThreshold: "standard" },
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
          <span>METHODOLOGY_SPECIFICATION</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[#33ff00] font-bold">&gt;</span>
              <h1 className="text-xl sm:text-2xl font-bold font-mono uppercase text-[#33ff00] text-glow-green">
                Method // {decodedMethod}
              </h1>
            </div>
            <p className="font-mono text-xs text-[#79a879] mt-1">
              Version: <strong>v1.0.0</strong> | Standardized Monitoring Specification
            </p>
          </div>
          <StatusTag status="healthy" label="[SPEC] ACTIVE" />
        </div>
      </section>

      {/* Description & Purpose */}
      <Pane title="METHODOLOGY_SUMMARY">
        <div className="flex flex-col gap-3 font-mono text-xs text-[#79a879]">
          <div className="text-sm font-bold text-[#c8d2c8]">{currentMethod.name}</div>
          <p>{currentMethod.description}</p>
        </div>
      </Pane>

      {/* Check Invariants */}
      <Pane title="EVALUATION_CHECKS" status="DETERMINISTIC_RULES">
        <ul className="flex flex-col gap-3 font-mono text-xs list-none p-0 m-0">
          {currentMethod.checks.map((chk, idx) => (
            <li
              key={idx}
              className="p-3 border border-[#1f521f] bg-[#0a0a0a] flex items-start gap-3"
            >
              <span className="text-[#33ff00] font-bold select-none">[0{idx + 1}]</span>
              <span className="text-[#c8d2c8]">{chk}</span>
            </li>
          ))}
        </ul>
      </Pane>

      {/* Thresholds Table */}
      <Pane title="OPERATIONAL_THRESHOLDS" status="PARAMETERS">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1f521f] text-[#79a879] bg-[#0f130f]">
                <th className="p-2.5">PARAMETER</th>
                <th className="p-2.5">VALUE</th>
                <th className="p-2.5">DESCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(currentMethod.thresholds).map(([param, val]) => (
                <tr key={param} className="border-b border-[#1f521f]/50">
                  <td className="p-2.5 font-bold text-[#33ff00]">{param}</td>
                  <td className="p-2.5 text-[#c8d2c8]">{String(val)}</td>
                  <td className="p-2.5 text-[#79a879]">Standard operational limit</td>
                </tr>
              ))}
            </tbody>
          </table>
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
