import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "default", className = "", ...props }: ButtonProps) {
  const variantClass = variant === "outline"
    ? "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
    : "bg-teal-700 text-white hover:bg-teal-800";

  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantClass} ${className}`}
      {...props}
    />
  );
}
