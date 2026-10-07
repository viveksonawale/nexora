"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { LoadingState } from "@/components/shared/states";
import { ShinyButton } from "@/app/components/ShinyButton";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";

function SubmissionContent({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [team, setTeam] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    tagline: "",
    description: "",
    techStack: [] as string[],
    repoUrl: "",
    demoUrl: "",
    videoUrl: "",
    presentationUrl: "",
  });

  const [techInput, setTechInput] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const reg = await apiFetch(`/hackathons/${id}/registrations/me`) as any;
      if (!reg || !reg.teamMember) {
        throw new Error("You must be in a team to submit a project.");
      }
      
      const teamData = await apiFetch(`/hackathons/${id}/teams/${reg.teamMember.teamId}`) as any;
      setTeam(teamData);

      const subData = await apiFetch(`/hackathons/${id}/teams/${teamData.id}/submission`) as any;
      if (subData && subData.status !== "NEW") {
        setSubmission(subData);
        setFormData({
          title: subData.title || "",
          tagline: subData.tagline || "",
          description: subData.description || "",
          techStack: subData.techStack || [],
          repoUrl: subData.repoUrl || "",
          demoUrl: subData.demoUrl || "",
          videoUrl: subData.videoUrl || "",
          presentationUrl: subData.presentationUrl || "",
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSaveDraft = async () => {
    try {
      await apiFetch(`/hackathons/${id}/teams/${team.id}/submission`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      alert("Draft saved!");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save draft");
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      alert("Title and description are required to submit.");
      return;
    }
    try {
      // Ensure draft is saved first
      await apiFetch(`/hackathons/${id}/teams/${team.id}/submission`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      // Submit
      await apiFetch(`/hackathons/${id}/teams/${team.id}/submission/submit`, {
        method: "POST",
      });
      alert("Project submitted successfully!");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to submit");
    }
  };

  if (loading) return <LoadingState message="Loading submission portal..." />;
  
  if (error) {
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-12 text-center space-y-6 max-w-2xl mx-auto mt-12">
        <Lock size={48} className="mx-auto text-[var(--text-secondary)]" />
        <h2 className="text-2xl font-display font-bold text-[var(--text-primary)]">Submission Locked</h2>
        <p className="text-[var(--text-secondary)] font-sans">{error}</p>
        <div className="pt-4 flex justify-center">
          <Link href={`/hackathons/${id}/teams`}>
            <ShinyButton variant="primary">Go to Teams</ShinyButton>
          </Link>
        </div>
      </div>
    );
  }

  const isSubmitted = submission?.status === "SUBMITTED";

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <Link href={`/hackathons/${id}/teams`} className="inline-flex items-center gap-2 text-sm font-sans font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft size={16} /> Back to Teams
      </Link>

      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-8 space-y-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-[var(--text-primary)]">Project Submission</h2>
          <p className="text-[var(--text-secondary)] font-sans mt-1">
            Build, document, and submit your project. Auto-saves are not enabled, so click Save Draft often.
          </p>
        </div>

        {isSubmitted && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl flex items-center gap-3 font-sans">
            <CheckCircle2 size={24} className="shrink-0" />
            <div>
              <div className="font-bold">Project Submitted!</div>
              <div className="text-sm">Your project has been successfully submitted. You can still make edits until the deadline.</div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-sans text-[var(--text-primary)] font-bold">Project Name</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. NextGen AI"
              className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-sans text-[var(--text-primary)] font-bold">Tagline</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={e => setFormData(p => ({ ...p, tagline: e.target.value }))}
              placeholder="A one-sentence summary of your project."
              className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-sans text-[var(--text-primary)] font-bold">Description</label>
            <textarea
              rows={8}
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              placeholder="Tell the judges what it does, how you built it, challenges you ran into, etc. Markdown is supported."
              className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 resize-none font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-sans text-[var(--text-primary)] font-bold">Tech Stack</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.techStack.map(tech => (
                <span key={tech} className="px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full text-xs font-bold font-sans flex items-center gap-1">
                  {tech}
                  <button onClick={() => setFormData(p => ({ ...p, techStack: p.techStack.filter(t => t !== tech) }))}>×</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={techInput}
              onChange={e => setTechInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (techInput.trim() && !formData.techStack.includes(techInput.trim())) {
                    setFormData(p => ({ ...p, techStack: [...p.techStack, techInput.trim()] }));
                  }
                  setTechInput("");
                }
              }}
              placeholder="Type a technology and press Enter (e.g. React, Python)"
              className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--border)]">
            <div className="space-y-1.5">
              <label className="text-sm font-sans text-[var(--text-primary)] font-bold">Source Code / Repo URL</label>
              <input
                type="url"
                value={formData.repoUrl}
                onChange={e => setFormData(p => ({ ...p, repoUrl: e.target.value }))}
                placeholder="https://github.com/..."
                className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-sans text-[var(--text-primary)] font-bold">Live Demo URL</label>
              <input
                type="url"
                value={formData.demoUrl}
                onChange={e => setFormData(p => ({ ...p, demoUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-sans text-[var(--text-primary)] font-bold">Demo Video URL</label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={e => setFormData(p => ({ ...p, videoUrl: e.target.value }))}
                placeholder="https://youtube.com/..."
                className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-sans text-[var(--text-primary)] font-bold">Presentation Deck URL</label>
              <input
                type="url"
                value={formData.presentationUrl}
                onChange={e => setFormData(p => ({ ...p, presentationUrl: e.target.value }))}
                placeholder="https://docs.google.com/..."
                className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-6 border-t border-[var(--border)]">
          <button
            onClick={handleSaveDraft}
            className="flex-1 px-6 py-3 bg-[var(--bg-canvas)] border border-[var(--border)] hover:border-orange-500 text-[var(--text-primary)] rounded-xl font-bold font-sans transition-colors"
          >
            Save Draft
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white shadow-lg shadow-orange-500/25 rounded-xl font-bold font-sans transition-all"
          >
            {isSubmitted ? "Update Submission" : "Submit Project"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  return (
    <RequireAuth requireVerified={true}>
      <SubmissionContent id={id} />
    </RequireAuth>
  );
}
