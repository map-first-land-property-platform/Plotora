import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline";
}

export function Badge({ variant = "default", className = "", ...props }: BadgeProps) {
  const variantClass = variant === "outline"
    ? "border border-slate-300 bg-transparent text-slate-700"
    : "bg-slate-100 text-slate-800";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${variantClass} ${className}`}
      {...props}
    />
  );
}
