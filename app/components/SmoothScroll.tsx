"use client";

import { useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Skip Lenis on dashboard, admin, student, and judge layouts that have their own internal scroll containers
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/judge") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/student")
    ) {
      return;
    }

    const lenis = new Lenis({
      autoRaf: true,
      duration: 1.0,
      smoothWheel: true,
    });

    return () => {
      lenis.destroy();
    };
  }, [pathname]);

  return <>{children}</>;
}
