"use client";

import { useSyncExternalStore } from "react";

interface FreshnessIndicatorProps {
  lastUpdatedSec?: number;
  maxAgeSec?: number;
  className?: string;
}

function subscribe(callback: () => void) {
  const interval = setInterval(callback, 1000);
  return () => clearInterval(interval);
}

function getSnapshot() {
  return Math.floor(Date.now() / 1000);
}

function getServerSnapshot() {
  return 0;
}

export function FreshnessIndicator({
  lastUpdatedSec,
  maxAgeSec = 300,
  className = "",
}: FreshnessIndicatorProps) {
  const nowSec = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!lastUpdatedSec || nowSec === 0) {
    return (
      <div className={`flex items-center gap-2 font-mono text-xs text-[#79a879] ${className}`}>
        <span className="w-2 h-2 bg-[#4a5f4a]" />
        <span>STATUS: UNKNOWN</span>
      </div>
    );
  }

  const ageSec = Math.max(0, nowSec - lastUpdatedSec);
  const isStale = ageSec > maxAgeSec;

  return (
    <div className={`flex items-center gap-2 font-mono text-xs ${className}`}>
      <span
        className={`w-2 h-2 ${
          isStale ? "bg-[#ffb000] cursor-blink-amber" : "bg-[#33ff00] cursor-blink"
        }`}
      />
      <span className={isStale ? "text-[#ffb000]" : "text-[#33ff00]"}>
        {isStale ? `STALE (${ageSec}s ago)` : `FRESH (${ageSec}s ago)`}
      </span>
      <span className="text-[#79a879]">| TTL: {Math.max(0, maxAgeSec - ageSec)}s</span>
    </div>
  );
}
