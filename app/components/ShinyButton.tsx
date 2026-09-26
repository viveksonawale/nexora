"use client";

import React, { ReactNode } from "react";

export interface ShinyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  glow?: boolean;
}

export function ShinyButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  glow = true,
  ...props
}: ShinyButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-2 text-xs font-semibold rounded-full gap-1.5",
    md: "px-6 py-3 text-sm font-semibold rounded-full gap-2",
    lg: "px-8 py-3.5 text-base font-semibold rounded-full gap-2.5",
  }[size];

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-[#F97316] via-[#FB923C] to-[#EA580C] text-[#121110] border border-orange-300/40 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/50 hover:brightness-110",
    secondary:
      "bg-[var(--bg-elevated)]/80 backdrop-blur-md text-[var(--text-primary)] border border-[var(--border)] hover:border-[#F97316]/60 hover:bg-[var(--bg-elevated)] shadow-sm hover:shadow-orange-500/10",
    outline:
      "bg-transparent text-[var(--text-primary)] border border-[var(--border)] hover:border-[#F97316] hover:bg-[#F97316]/10 shadow-sm",
    ghost:
      "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-inverse)]/5",
  }[variant];

  return (
    <button
      className={`group relative inline-flex items-center justify-center overflow-hidden transition-all duration-300 ease-out active:scale-[0.98] hover:scale-[1.03] cursor-pointer select-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {/* Dynamic ambient glow behind primary button */}
      {glow && variant === "primary" && (
        <span
          className="absolute -inset-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 group-hover:opacity-60 blur-md transition-opacity duration-500 -z-10"
          aria-hidden="true"
        />
      )}

      {/* Specular shine sweep light effect (triggers onload and on hover) */}
      <span
        className="pointer-events-none absolute inset-0 -translate-x-[150%] skew-x-[-25deg] bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-shine-sweep animate-shine-load group-hover:transition-none"
        aria-hidden="true"
      />

      {/* Button content */}
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
    </button>
  );
}
