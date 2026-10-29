"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingState } from "@/components/shared/states";

function SignUpRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const returnUrl = searchParams.get("returnUrl");
    const target = `/?auth=signup${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ""}`;
    router.replace(target);
  }, [router, searchParams]);

  return <LoadingState message="Opening sign-up..." />;
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." />}>
      <SignUpRedirect />
    </Suspense>
  );
}
