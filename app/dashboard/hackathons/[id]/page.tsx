import { redirect } from "next/navigation";

export default async function HackathonDashboardRoot({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/dashboard/hackathons/${id}/overview`);
}
