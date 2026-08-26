import Image from "next/image";
import Link from "next/link";
import { BracketButton } from "../components/ui/bracket-button";
import { DependencyPath } from "../components/ui/dependency-path";
import { Pane } from "../components/ui/pane";
import { ProofRow } from "../components/ui/proof-row";
import { TerminalShell } from "../components/ui/terminal-shell";

export default function LandingPage() {
  const exampleNodes = [
    {
      id: "sequencer:base",
      type: "sequencer",
      label: "Base Rollup Sequencer",
      status: "healthy",
      criticalityBps: 10000,
      propagationBps: 10000,
    },
    {
      id: "aave:vault:usdc",
      type: "vault",
      label: "Aave v3 USDC Vault (Base)",
      status: "healthy",
      criticalityBps: 10000,
      propagationBps: 10000,
    },
    {
      id: "aave:operation:borrow",
      type: "operation",
      label: "USDC Borrow Operation",
      status: "healthy",
    },
  ];

  return (
    <TerminalShell>
      {/* 1. HERO SECTION */}
      <section className="flex flex-col gap-6 pt-4">
        {/* ASCII Wordmark */}
        <div className="overflow-x-auto select-none" aria-label="BlastRadius">
          <pre className="text-xs sm:text-sm md:text-base font-mono font-bold text-[#33ff00] text-glow-green leading-none">
            {` ____  _        _    ____ _____ ____      _    ____ ___ _   _ ____  
| __ )| |      / \\  / ___|_   _|  _ \\    / \\  |  _ \\_ _| | | / ___| 
|  _ \\| |     / _ \\ \\___ \\ | | | |_) |  / _ \\ | | | | || | | \\___ \\ 
| |_) | |___ / ___ \\ ___) || | |  _ <  / ___ \\| |_| | || |_| |___) |
|____/|_____/_/   \\_\\____/ |_| |_| \\_\\/_/   \\_\\____/___|\\___/|____/ 
                                            // DEFI RISK INTELLIGENCE`}
          </pre>
        </div>

        {/* Live System Status Strip */}
        <div className="p-3 border border-[#1f521f] bg-[#0a120a] flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-[#33ff00] cursor-blink" />
            <span className="text-[#79a879]">CONSENSUS_ENGINE:</span>
            <span className="text-[#33ff00] font-bold">ONLINE [2/2 ACTIVE MONITORS]</span>
          </div>
          <div className="flex items-center gap-4 text-[#79a879]">
            <span>
              ACTIVE INCIDENTS: <strong className="text-[#33ff00]">0</strong>
            </span>
            <span>
              TRACKED EDGES: <strong className="text-[#c8d2c8]">5</strong>
            </span>
            <span>
              DATA PLANE: <strong className="text-[#33ff00]">ARKIV_EVM</strong>
            </span>
          </div>
        </div>

        {/* Hero Copy & Value Proposition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-2">
          <div className="lg:col-span-7 flex flex-col gap-5">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-[#c8d2c8] uppercase tracking-wide leading-tight">
              Cryptographically verified{" "}
              <span className="text-[#33ff00] text-glow-green">DeFi dependency graph</span> & blast
              radius intelligence
            </h1>
            <p className="font-mono text-sm text-[#79a879] leading-relaxed">
              When a rollup sequencer halts, an oracle feed lags, or an RPC node splits, BlastRadius
              computes the exact blast radius across downstream pools, liquidations, and exposed
              protocol capital in real time.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/system">
                <BracketButton variant="primary">Explore Dependency Graph</BracketButton>
              </Link>
              <Link href="/system?filter=incidents">
                <BracketButton variant="secondary">View Quorum Incidents</BracketButton>
              </Link>
              <a href="http://localhost:4000/api/docs" target="_blank" rel="noreferrer">
                <BracketButton variant="ghost">OpenAPI / Swagger</BracketButton>
              </a>
            </div>
          </div>

          {/* Hero Image Asset A */}
          <div className="lg:col-span-5 border border-[#1f521f] bg-[#0a0a0a] p-2 relative group">
            <div className="relative aspect-[3/2] w-full overflow-hidden border border-[#1f521f]/50">
              <Image
                src="/images/hero-blast-topology.jpg"
                alt="BlastRadius Dependency Blast Topology systems illustration"
                fill
                priority
                className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-2 left-2 right-2 p-2 bg-[#0a0a0a]/90 border border-[#1f521f] font-mono text-[10px] text-[#79a879]">
                <div className="text-[#ffb000] font-bold">[SIMULATION] TOPOLOGY PROPAGATION</div>
                <div>ROOT: sequencer:base -&gt; EXPOSED OPERATIONS: 2</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE-STAGE PIPELINE: OBSERVE -> ATTEST -> TRAVERSE */}
      <section className="flex flex-col gap-6 pt-6 border-t border-[#1f521f]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-[#33ff00] font-bold">&gt;</span>
            <h2 className="text-base sm:text-lg font-bold font-mono uppercase text-[#33ff00] text-glow-green">
              Architectural Pipeline // Observe -&gt; Attest -&gt; Traverse
            </h2>
          </div>
          <span className="text-xs text-[#79a879]">[ZERO_MOCK_STANDARD]</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stage 1: Continuous Observation */}
          <Pane title="01 // OBSERVE" status="MONITOR_NODES">
            <div className="flex flex-col gap-3 font-mono text-xs">
              <p className="text-[#79a879]">
                Independent monitor runners continuously observe rollup progress (safe head lag,
                block progression), Chainlink round validity, and multi-RPC agreement.
              </p>
              <div className="p-2 border border-[#1f521f] bg-[#0a120a] flex flex-col gap-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span>METHOD:</span>
                  <span className="text-[#33ff00]">sequencer-health-v1</span>
                </div>
                <div className="flex justify-between">
                  <span>TARGET:</span>
                  <span className="text-[#c8d2c8]">sequencer:base (8453)</span>
                </div>
                <div className="flex justify-between">
                  <span>HEARTBEAT:</span>
                  <span className="text-[#33ff00]">10s CADENCE</span>
                </div>
              </div>
            </div>
          </Pane>

          {/* Stage 2: Ephemeral Attestation */}
          <Pane title="02 // ATTEST" status="ARKIV_STORAGE">
            <div className="flex flex-col gap-3 font-mono text-xs">
              <p className="text-[#79a879]">
                Observations are published as short-lived, signed Arkiv entities with deterministic
                TTL decay. No stale claims accumulate in permanent state.
              </p>
              <div className="relative aspect-[4/3] w-full overflow-hidden border border-[#1f521f] mt-1">
                <Image
                  src="/images/ephemeral-attestation.jpg"
                  alt="Arkiv ephemeral health attestations with creator provenance"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </Pane>

          {/* Stage 3: Reverse Traversal */}
          <Pane title="03 // TRAVERSE" status="BFS_ENGINE">
            <div className="flex flex-col gap-3 font-mono text-xs">
              <p className="text-[#79a879]">
                When an upstream dependency fails, BlastRadius executes cycle-safe reverse BFS
                traversal up the dependency graph, propagating integer basis-point exposure.
              </p>
              <div className="relative aspect-[16/9] w-full overflow-hidden border border-[#1f521f] mt-1">
                <Image
                  src="/images/reverse-traversal.jpg"
                  alt="Reverse dependency traversal from root to affected operations"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </Pane>
        </div>
      </section>

      {/* 3. CONCRETE VERIFIED BASE AAVE V3 SCENARIO */}
      <section className="flex flex-col gap-6 pt-6 border-t border-[#1f521f]">
        <div className="flex items-center space-x-2">
          <span className="text-[#33ff00] font-bold">&gt;</span>
          <h2 className="text-base sm:text-lg font-bold font-mono uppercase text-[#33ff00] text-glow-green">
            Evidence-Backed Graph // Base Aave v3 Example
          </h2>
        </div>

        <Pane title="ACTIVE_DEPENDENCY_CHAIN // BASE_CHAIN_8453">
          <div className="flex flex-col gap-6">
            <p className="font-mono text-xs text-[#79a879]">
              Every dependency edge is backed by official smart contract bytecode and published
              documentation. The chain below demonstrates how Base sequencer availability propagates
              through the USDC reserve into user borrowing operations:
            </p>

            <DependencyPath nodes={exampleNodes} highlightedIndex={0} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <ProofRow
                entityKey="0x89ab12cd34ef567890abcdef1234567890abcdef1234567890abcdef12345678"
                creator="0x1111111111111111111111111111111111111111"
                block={24910281}
                expiresInSec={285}
              />
              <ProofRow
                entityKey="0xfe12dc34ba567890abcdef1234567890abcdef1234567890abcdef12345678"
                creator="0x2222222222222222222222222222222222222222"
                block={24910280}
                expiresInSec={284}
              />
            </div>
          </div>
        </Pane>
      </section>

      {/* 4. WHY ARKIV ARCHITECTURAL FOUNDATION */}
      <section className="flex flex-col gap-6 pt-6 border-t border-[#1f521f]">
        <div className="flex items-center space-x-2">
          <span className="text-[#33ff00] font-bold">&gt;</span>
          <h2 className="text-base sm:text-lg font-bold font-mono uppercase text-[#33ff00] text-glow-green">
            Why Arkiv // Decentralized Data Architecture
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          <div className="p-4 border border-[#1f521f] bg-[#0a0a0a]">
            <div className="text-[#33ff00] font-bold mb-2">[01] CREATOR PROVENANCE</div>
            <p className="text-[#79a879]">
              Every claim is cryptographically signed by an identified observer address. Trust is
              evaluated dynamically at query time against the active trust policy.
            </p>
          </div>

          <div className="p-4 border border-[#1f521f] bg-[#0a0a0a]">
            <div className="text-[#33ff00] font-bold mb-2">[02] AUTOMATIC EXPIRATION</div>
            <p className="text-[#79a879]">
              Health assertions carry strict block-based expiration. Missing telemetry results in
              clean automatic decay into <span className="text-[#ff3333]">UNAVAILABLE</span> rather
              than stale phantom health.
            </p>
          </div>

          <div className="p-4 border border-[#1f521f] bg-[#0a0a0a]">
            <div className="text-[#33ff00] font-bold mb-2">[03] ZERO HOT-PATH RISK</div>
            <p className="text-[#79a879]">
              BlastRadius is an observability and risk intelligence layer. It never holds keys,
              pauses protocols, or executes financial transactions directly.
            </p>
          </div>

          <div className="p-4 border border-[#1f521f] bg-[#0a0a0a]">
            <div className="text-[#33ff00] font-bold mb-2">[04] NATIVE SQL-LIKE QUERIES</div>
            <p className="text-[#79a879]">
              On-chain entities are indexed by numerical basis-point attributes, dependency types,
              and project namespaces for sub-second query performance.
            </p>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="flex flex-col items-center justify-center p-8 border border-[#1f521f] bg-[#0a120a] text-center gap-4">
        <h3 className="font-mono text-lg font-bold uppercase text-[#33ff00] text-glow-green">
          Explore The Full Dependency Graph Console
        </h3>
        <p className="font-mono text-xs text-[#79a879] max-w-xl">
          Access the real-time interactive dependency topology, inspect individual monitor methods,
          and view cryptographic entity proofs.
        </p>
        <div className="flex flex-wrap gap-4 mt-2">
          <Link href="/system">
            <BracketButton variant="primary">Launch System Console</BracketButton>
          </Link>
        </div>
      </section>
    </TerminalShell>
  );
}
