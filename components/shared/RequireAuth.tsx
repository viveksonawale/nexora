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

export function RequireAuth({ children, requireVerified = false, requireOnboarding = true }: RequireAuthProps) {
  const { user, isLoading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace(`/sign-in?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    // SUPER_ADMIN bypasses all onboarding
    if (user.platformRole === "SUPER_ADMIN") {
      if (pathname.startsWith("/onboarding")) {
        router.replace("/admin");
      }
      return;
    }

    const isOnboardingRoute = pathname.startsWith("/onboarding");
    const isPendingRoute = pathname === "/onboarding/pending";

    // Students have NO verification pending layer: immediately route to /student
    const isStudent =
      user.requestedRole === "STUDENT" ||
      (!user.requestedRole && user.platformRole === "USER");

    if (isStudent && isPendingRoute) {
      router.replace("/student");
      return;
    }

    // Students should be routed to their student dashboard, not organizer /dashboard
    if (isStudent && pathname.startsWith("/dashboard")) {
      router.replace("/student");
      return;
    }

    // If request is submitted and pending (for Organizers/Judges only)
    if (user.onboardingStatus === "PENDING_VERIFICATION") {
      if (isStudent) {
        router.replace("/student");
        return;
      }
      if (!isPendingRoute) {
        router.replace("/onboarding/pending");
      }
      return;
    }

    // If request was rejected, send to /onboarding where rejection notice and resubmit are shown
    if (user.onboardingStatus === "REJECTED") {
      if (!isOnboardingRoute) {
        router.replace("/onboarding");
      }
      return;
    }

    // If onboarding is not started, redirect to /onboarding
    if ((!user.onboardingStatus || user.onboardingStatus === "NOT_STARTED") && !isOnboardingRoute && requireOnboarding) {
      router.replace(`/onboarding?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    // If already verified and visits onboarding, redirect to appropriate dashboard
    if (user.onboardingStatus === "VERIFIED" && isOnboardingRoute) {
      if (user.requestedRole === "COLLEGE_ORGANIZER") {
        router.replace("/dashboard");
      } else if (user.requestedRole === "JUDGE") {
        router.replace("/judge/assignments");
      } else {
        router.replace(isStudent ? "/student" : "/hackathons");
      }
      return;
    }

    // Require verified status for protected features
    if (requireVerified && user.onboardingStatus !== "VERIFIED") {
      if ((user.onboardingStatus as string) === "PENDING_VERIFICATION") {
        if (!isPendingRoute) router.replace("/onboarding/pending");
      } else {
        if (!isOnboardingRoute) router.replace("/onboarding");
      }
      return;
    }
  }, [user, isLoading, router, pathname, requireVerified, requireOnboarding]);

  if (isLoading || !user) {
    return <LoadingState message="Loading..." />;
  }

  if (user.platformRole !== "SUPER_ADMIN") {
    const isStudent =
      user.requestedRole === "STUDENT" ||
      (!user.requestedRole && user.platformRole === "USER");

    if (isStudent && pathname === "/onboarding/pending") {
      return <LoadingState message="Redirecting to your student dashboard..." />;
    }

    if (isStudent && pathname.startsWith("/dashboard")) {
      return <LoadingState message="Redirecting to your student dashboard..." />;
    }

    if (user.onboardingStatus === "PENDING_VERIFICATION" && pathname !== "/onboarding/pending") {
      return <LoadingState message="Redirecting to verification status..." />;
    }

    if (user.onboardingStatus === "REJECTED" && !pathname.startsWith("/onboarding")) {
      return <LoadingState message="Redirecting to onboarding..." />;
    }

    if ((!user.onboardingStatus || user.onboardingStatus === "NOT_STARTED") && !pathname.startsWith("/onboarding") && requireOnboarding) {
      return <LoadingState message="Redirecting to onboarding..." />;
    }

    if (user.onboardingStatus === "VERIFIED" && pathname.startsWith("/onboarding")) {
      return <LoadingState message="Redirecting to your dashboard..." />;
    }

    if (requireVerified && user.onboardingStatus !== "VERIFIED" && pathname !== "/onboarding/pending" && !pathname.startsWith("/onboarding")) {
      return <LoadingState message="Redirecting..." />;
    }
  }

  return <>{children}</>;
}
