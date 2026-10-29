"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/shared/states";

export default function StudentCheckInRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/hackathons/${id}/check-in`);
  }, [id, router]);

  return <LoadingState message="Redirecting to student check-in scanner..." />;
}
