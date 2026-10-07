import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}
