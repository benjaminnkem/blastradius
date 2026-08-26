import type { ButtonHTMLAttributes, ReactNode } from "react";

interface BracketButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  children: ReactNode;
  asLink?: boolean;
  href?: string;
}

export function BracketButton({
  variant = "primary",
  children,
  className = "",
  disabled,
  ...props
}: BracketButtonProps) {
  let baseColor = "text-[#33ff00] border-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a]";

  if (variant === "secondary") {
    baseColor = "text-[#ffb000] border-[#ffb000] hover:bg-[#ffb000] hover:text-[#0a0a0a]";
  } else if (variant === "danger") {
    baseColor = "text-[#ff3333] border-[#ff3333] hover:bg-[#ff3333] hover:text-[#0a0a0a]";
  } else if (variant === "ghost") {
    baseColor = "text-[#79a879] border-[#1f521f] hover:border-[#33ff00] hover:text-[#33ff00]";
  }

  if (disabled) {
    baseColor = "text-[#4a5f4a] border-[#1f521f] cursor-not-allowed opacity-50";
  }

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center font-mono text-sm px-4 py-2 uppercase tracking-wider border transition-colors duration-100 cursor-pointer ${baseColor} ${className}`}
      {...props}
    >
      <span className="opacity-60 mr-1.5">[</span>
      {children}
      <span className="opacity-60 ml-1.5">]</span>
    </button>
  );
}
