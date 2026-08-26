export type StatusVariant =
  "healthy" | "watch" | "degraded" | "critical" | "unknown" | "unavailable";

interface StatusTagProps {
  status: StatusVariant | string;
  label?: string;
  className?: string;
}

export function StatusTag({ status, label, className = "" }: StatusTagProps) {
  const norm = status.toLowerCase();

  let tagText = label;
  let colorStyle: string;

  switch (norm) {
    case "healthy":
    case "ok":
      tagText = tagText ?? "[OK] HEALTHY";
      colorStyle = "border-[#33ff00] text-[#33ff00] bg-[#0a1f0a] text-glow-green";
      break;
    case "watch":
      tagText = tagText ?? "[WATCH]";
      colorStyle = "border-[#ffb000] text-[#ffb000] bg-[#1f170a] text-glow-amber";
      break;
    case "degraded":
      tagText = tagText ?? "[DEGRADED]";
      colorStyle = "border-[#ffb000] text-[#ffb000] bg-[#1f170a] text-glow-amber";
      break;
    case "critical":
    case "error":
      tagText = tagText ?? "[CRITICAL]";
      colorStyle = "border-[#ff3333] text-[#ff3333] bg-[#240a0a] text-glow-red";
      break;
    case "unavailable":
      tagText = tagText ?? "[UNAVAILABLE]";
      colorStyle = "border-[#ff3333] text-[#ff3333] bg-[#240a0a]";
      break;
    case "unknown":
    default:
      tagText = tagText ?? "[UNKNOWN]";
      colorStyle = "border-[#4a5f4a] text-[#a0b8a0] bg-[#121612]";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-mono tracking-wider border font-bold uppercase ${colorStyle} ${className}`}
    >
      {tagText}
    </span>
  );
}
