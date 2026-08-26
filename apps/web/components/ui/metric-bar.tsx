interface MetricBarProps {
  value: number; // 0..100 or basis points (0..10000)
  max?: number;
  totalBlocks?: number;
  label?: string;
  variant?: "primary" | "warning" | "danger";
  className?: string;
}

export function MetricBar({
  value,
  max = 100,
  totalBlocks = 16,
  label,
  variant = "primary",
  className = "",
}: MetricBarProps) {
  // Normalize percentage
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  const filledBlocks = Math.round((percentage / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;

  const filledChar = "█";
  const emptyChar = "░";

  const barString = `${filledChar.repeat(filledBlocks)}${emptyChar.repeat(emptyBlocks)}`;

  let colorClass = "text-[#33ff00]";
  if (variant === "warning" || (variant === "primary" && percentage >= 50 && percentage < 80)) {
    colorClass = "text-[#ffb000]";
  } else if (variant === "danger" || (variant === "primary" && percentage >= 80)) {
    colorClass = "text-[#ff3333]";
  }

  return (
    <div className={`flex items-center justify-between font-mono text-xs ${className}`}>
      {label && <span className="text-[#79a879] mr-2 uppercase">{label}</span>}
      <div className="flex items-center space-x-2">
        <span className={`tracking-widest ${colorClass}`}>[{barString}]</span>
        <span className={`font-bold min-w-[3rem] text-right ${colorClass}`}>{percentage}%</span>
      </div>
    </div>
  );
}
