import { redirect } from "next/navigation";

export default async function HackathonBasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/hackathons/${id}/overview`);
}
