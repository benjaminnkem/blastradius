import Link from "next/link";
import type { ReactNode } from "react";

interface TerminalShellProps {
  systemName?: string;
  version?: string;
  network?: string;
  children: ReactNode;
  className?: string;
}

export function TerminalShell({
  systemName = "BLASTRADIUS_SYSTEM_CONSOLE",
  version = "v1.0.0",
  network = "BASE_CHAIN_8453",
  children,
  className = "",
}: TerminalShellProps) {
  return (
    <div
      className={`flex flex-col min-h-screen bg-[#0a0a0a] text-[#c8d2c8] font-mono ${className}`}
    >
      {/* Top System Bar */}
      <header className="sticky top-0 z-50 border-b border-[#1f521f] bg-[#0a0a0a]/95 backdrop-blur px-4 py-2 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="text-[#33ff00] font-bold tracking-widest uppercase text-sm text-glow-green">
            [{systemName}]
          </span>
          <span className="text-xs text-[#79a879] hidden sm:inline">// {version}</span>
        </div>

        <nav className="flex items-center space-x-4 text-xs">
          <Link href="/" className="text-[#33ff00] hover:underline">
            [OVERVIEW]
          </Link>
          <Link href="/system" className="text-[#79a879] hover:text-[#33ff00]">
            [SYSTEM_GRAPH]
          </Link>
          <Link href="/about" className="text-[#79a879] hover:text-[#33ff00]">
            [ARCHITECTURE]
          </Link>
          <span className="text-[#1f521f]">|</span>
          <span className="text-xs px-2 py-0.5 border border-[#1f521f] text-[#33ff00] bg-[#0f130f]">
            NET: {network}
          </span>
        </nav>
      </header>

      {/* Main Screen Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
        {children}
      </main>

      {/* System Footer */}
      <footer className="border-t border-[#1f521f] bg-[#0a0a0a] px-4 py-6 text-xs text-[#79a879]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-[#33ff00] cursor-blink" />
            <span>BLASTRADIUS // DEFI DEPENDENCY INTELLIGENCE PLATFORM</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>DATA_STORE: ARKIV_DECENTRALIZED_DB</span>
            <span>TRUST_MODEL: FAIL_CLOSED</span>
            <span>WCAG_2.2: AA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
