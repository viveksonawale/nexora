"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingState } from "@/components/shared/states";

function SignInRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const returnUrl = searchParams.get("returnUrl");
    const target = `/?auth=login${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ""}`;
    router.replace(target);
  }, [router, searchParams]);

  return <LoadingState message="Opening sign-in..." />;
}

export default function SignInPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." />}>
      <SignInRedirect />
    </Suspense>
  );
}
