"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/contexts/SessionContext";
import { LoadingState } from "./states";

interface RequireAuthProps {
  children: React.ReactNode;
  requireVerified?: boolean;
  requireOnboarding?: boolean;
}

export function RequireAuth({ children, requireVerified = false, requireOnboarding = false }: RequireAuthProps) {
  const { user, isLoading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace(`/sign-in?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    if (requireVerified && !user.emailVerified) {
      router.replace(`/verify-email-pending?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    if (requireOnboarding && !user.onboardingCompleted && pathname !== "/onboarding") {
      router.replace(`/onboarding?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }
  }, [user, isLoading, router, pathname, requireVerified, requireOnboarding]);

  if (isLoading || !user) {
    return <LoadingState message="Loading..." />;
  }

  if (requireVerified && !user.emailVerified) {
    return <LoadingState message="Redirecting to verification..." />;
  }

  if (requireOnboarding && !user.onboardingCompleted && pathname !== "/onboarding") {
    return <LoadingState message="Redirecting to onboarding..." />;
  }

  return <>{children}</>;
}
