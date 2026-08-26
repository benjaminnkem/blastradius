import type { ReactNode } from "react";

interface PaneProps {
  title?: string;
  status?: string;
  variant?: "default" | "warning" | "danger";
  children: ReactNode;
  className?: string;
}

export function Pane({ title, status, variant = "default", children, className = "" }: PaneProps) {
  let borderColor = "border-[#1f521f]";
  let headerColor = "text-[#33ff00]";

  if (variant === "warning") {
    borderColor = "border-[#ffb000]/60";
    headerColor = "text-[#ffb000]";
  } else if (variant === "danger") {
    borderColor = "border-[#ff3333]/60";
    headerColor = "text-[#ff3333]";
  }

  return (
    <div className={`bg-[#0a0a0a] border ${borderColor} flex flex-col ${className}`}>
      {title && (
        <div
          className={`flex items-center justify-between px-3 py-1.5 border-b ${borderColor} bg-[#0f130f]`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#1f521f]">+-</span>
            <span className={`text-xs font-mono font-bold tracking-wider uppercase ${headerColor}`}>
              {title}
            </span>
            <span className="text-xs text-[#1f521f]">-+</span>
          </div>
          {status && <span className="text-xs font-mono text-[#79a879] uppercase">{status}</span>}
        </div>
      )}
      <div className="p-4 flex-1">{children}</div>
    </div>
  );
}
