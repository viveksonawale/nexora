"use client";

import { use, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { GeneralTab } from "@/components/dashboard/setup/GeneralTab";
import { RegistrationTab } from "@/components/dashboard/setup/RegistrationTab";
import { ScheduleTab } from "@/components/dashboard/setup/ScheduleTab";
import { PrizesTab } from "@/components/dashboard/setup/PrizesTab";
import { SponsorsTab } from "@/components/dashboard/setup/SponsorsTab";
import { FaqsTab } from "@/components/dashboard/setup/FaqsTab";
import { JudgingTab } from "@/components/dashboard/setup/JudgingTab";

export default function HackathonSetupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [hackathon, setHackathon] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    apiFetch(`/hackathons/${id}`)
      .then(setHackathon)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState message="Loading setup..." />;
  if (!hackathon) return <div className="p-8 text-red-500">Failed to load hackathon.</div>;

  const tabs = [
    { id: "general", label: "General Info" },
    { id: "registration", label: "Registration" },
    { id: "schedule", label: "Schedule" },
    { id: "prizes", label: "Prizes & Tracks" },
    { id: "sponsors", label: "Sponsors" },
    { id: "faqs", label: "FAQs" },
    { id: "judging", label: "Judging Criteria" },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">
          Hackathon Setup
        </h1>
        <p className="text-[var(--text-secondary)] font-sans mt-1">
          Configure all details and content for {hackathon.title}.
        </p>
      </div>

      <div className="flex border-b border-[var(--border)] overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-6 py-3 font-sans text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-orange-500 text-orange-500"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 min-h-[400px]">
        {activeTab === "general" && <GeneralTab hackathon={hackathon} />}
        {activeTab === "registration" && <RegistrationTab hackathon={hackathon} />}
        {activeTab === "schedule" && <ScheduleTab hackathon={hackathon} />}
        {activeTab === "prizes" && <PrizesTab hackathon={hackathon} />}
        {activeTab === "sponsors" && <SponsorsTab hackathon={hackathon} />}
        {activeTab === "faqs" && <FaqsTab hackathon={hackathon} />}
        {activeTab === "judging" && <JudgingTab hackathon={hackathon} />}
      </div>
    </div>
  );
}
