"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { ShinyButton } from "@/app/components/ShinyButton";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  GraduationCap,
  Code2,
  FolderGit2,
  Briefcase,
  ExternalLink,
  Award,
  Upload,
  Printer,
  Sparkles,
  ArrowRight,
  User,
} from "lucide-react";

export default function StudentResumePage() {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [completeness, setCompleteness] = useState<{ score: number; missing: string[] }>({
    score: 0,
    missing: [],
  });

  // Section modals / form states
  const [activeTab, setActiveTab] = useState<"EDUCATION" | "SKILLS" | "PROJECTS" | "EXPERIENCE" | "PREVIEW">("EDUCATION");

  // Education state
  const [eduInstitution, setEduInstitution] = useState("");
  const [eduDegree, setEduDegree] = useState("");
  const [eduField, setEduField] = useState("");
  const [eduStartYear, setEduStartYear] = useState<number>(new Date().getFullYear() - 2);
  const [eduEndYear, setEduEndYear] = useState<number>(new Date().getFullYear() + 2);
  const [eduIsCurrent, setEduIsCurrent] = useState(false);
  const [addingEdu, setAddingEdu] = useState(false);

  // Skills state
  const [skillName, setSkillName] = useState("");
  const [skillLevel, setSkillLevel] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">("INTERMEDIATE");
  const [addingSkill, setAddingSkill] = useState(false);

  // Projects state
  const [projTitle, setProjTitle] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projRepo, setProjRepo] = useState("");
  const [projLive, setProjLive] = useState("");
  const [projTech, setProjTech] = useState("");
  const [addingProj, setAddingProj] = useState(false);

  // Experience state
  const [expCompany, setExpCompany] = useState("");
  const [expTitle, setExpTitle] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expStartDate, setExpStartDate] = useState("");
  const [expEndDate, setExpEndDate] = useState("");
  const [expIsCurrent, setExpIsCurrent] = useState(false);
  const [addingExp, setAddingExp] = useState(false);

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const loadData = async () => {
    try {
      const data: any = await apiFetch("/me/profile");
      setProfileData(data);
      if (data?.completeness) {
        setCompleteness(data.completeness);
      }
    } catch (err: any) {
      console.error("Failed to load resume", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingEdu(true);
    setMessage(null);
    try {
      await apiFetch("/me/education", {
        method: "POST",
        body: JSON.stringify({
          institution: eduInstitution.trim(),
          degree: eduDegree.trim(),
          fieldOfStudy: eduField.trim() || undefined,
          startYear: Number(eduStartYear),
          endYear: eduIsCurrent ? undefined : Number(eduEndYear),
          isCurrent: eduIsCurrent,
        }),
      });
      setMessage({ text: "Education record added!", type: "success" });
      setEduInstitution("");
      setEduDegree("");
      setEduField("");
      await loadData();
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to add education", type: "error" });
    } finally {
      setAddingEdu(false);
    }
  };

  const handleDeleteEducation = async (id: string) => {
    if (!confirm("Delete this education record?")) return;
    try {
      await apiFetch(`/me/education/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) return;
    setAddingSkill(true);
    setMessage(null);

    const currentSkills = (profileData?.skills || []).map((s: any) => ({
      name: s.skill?.name || s.name,
      level: s.level || "INTERMEDIATE",
    }));

    if (currentSkills.some((s: any) => s.name.toLowerCase() === skillName.trim().toLowerCase())) {
      setMessage({ text: "Skill already added", type: "error" });
      setAddingSkill(false);
      return;
    }

    const updatedSkills = [...currentSkills, { name: skillName.trim(), level: skillLevel }];

    try {
      await apiFetch("/me/skills", {
        method: "PUT",
        body: JSON.stringify({ skills: updatedSkills }),
      });
      setMessage({ text: "Skill added!", type: "success" });
      setSkillName("");
      await loadData();
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to add skill", type: "error" });
    } finally {
      setAddingSkill(false);
    }
  };

  const handleDeleteSkill = async (nameToDelete: string) => {
    const currentSkills = (profileData?.skills || []).map((s: any) => ({
      name: s.skill?.name || s.name,
      level: s.level || "INTERMEDIATE",
    }));
    const updated = currentSkills.filter((s: any) => s.name !== nameToDelete);

    try {
      await apiFetch("/me/skills", {
        method: "PUT",
        body: JSON.stringify({ skills: updated }),
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete skill");
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingProj(true);
    setMessage(null);

    const techArray = projTech
      ? projTech.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    try {
      await apiFetch("/me/projects", {
        method: "POST",
        body: JSON.stringify({
          title: projTitle.trim(),
          description: projDesc.trim() || undefined,
          repoUrl: projRepo.trim() || undefined,
          liveUrl: projLive.trim() || undefined,
          techStack: techArray,
        }),
      });
      setMessage({ text: "Project added!", type: "success" });
      setProjTitle("");
      setProjDesc("");
      setProjRepo("");
      setProjLive("");
      setProjTech("");
      await loadData();
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to add project", type: "error" });
    } finally {
      setAddingProj(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    try {
      await apiFetch(`/me/projects/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete project");
    }
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingExp(true);
    setMessage(null);

    try {
      await apiFetch("/me/experience", {
        method: "POST",
        body: JSON.stringify({
          company: expCompany.trim(),
          title: expTitle.trim(),
          description: expDesc.trim() || undefined,
          startDate: new Date(expStartDate).toISOString(),
          endDate: expIsCurrent ? undefined : expEndDate ? new Date(expEndDate).toISOString() : undefined,
          isCurrent: expIsCurrent,
        }),
      });
      setMessage({ text: "Experience added!", type: "success" });
      setExpCompany("");
      setExpTitle("");
      setExpDesc("");
      setExpStartDate("");
      setExpEndDate("");
      await loadData();
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to add experience", type: "error" });
    } finally {
      setAddingExp(false);
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!confirm("Delete this experience?")) return;
    try {
      await apiFetch(`/me/experience/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete experience");
    }
  };

  if (loading) return <LoadingState message="Loading your resume..." />;

  const isComplete = completeness.score === 100;
  const education = profileData?.education || [];
  const skills = profileData?.skills || [];
  const projects = profileData?.projects || [];
  const experiences = profileData?.experiences || [];
  const profile = profileData?.profile || profileData || {};

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
            Resume Builder & Completeness
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Build your verified structured resume to power 1-click hackathon participation.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-zinc-700 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Printer size={14} />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Structured Completeness Score Card */}
      <div className="p-7 rounded-3xl bg-[#14161b] border border-[#232630] space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                Profile & Resume Completeness
              </span>
              {isComplete && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready for Hackathons
                </span>
              )}
            </div>
            <div className="text-3xl font-display font-bold text-white mt-1">
              {completeness.score}% Completed
            </div>
          </div>

          <div className="w-full sm:w-64 space-y-1.5">
            <div className="h-2.5 rounded-full bg-[#0d0e11] overflow-hidden border border-zinc-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isComplete ? "bg-emerald-500" : "bg-gradient-to-r from-orange-600 to-[#F97316]"
                }`}
                style={{ width: `${completeness.score}%` }}
              />
            </div>
            <span className="text-[11px] text-zinc-400 block text-right font-mono">
              {isComplete ? "All 7 sections complete" : `${completeness.missing?.length || 0} section(s) remaining`}
            </span>
          </div>
        </div>

        {/* Section Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t border-[#1e2026]">
          {[
            {
              name: "Avatar Photo (10%)",
              done: !!profile.avatarUrl,
              hint: "Upload or provide photo URL",
            },
            {
              name: "Headline & Bio (15%)",
              done: !!(profile.headline && profile.bio),
              hint: "Summary of builder identity",
            },
            {
              name: "Location & Links (10%)",
              done: !!(profile.location && (profile.githubUrl || profile.linkedinUrl || profile.portfolioUrl || profile.twitterUrl)),
              hint: "GitHub, LinkedIn, or portfolio",
            },
            {
              name: "Education (20%)",
              done: education.length >= 1,
              hint: "At least 1 degree / university",
            },
            {
              name: "Skills (20%)",
              done: skills.length >= 3,
              hint: "At least 3 technical skills",
            },
            {
              name: "Projects (15%)",
              done: projects.length >= 1,
              hint: "At least 1 portfolio project",
            },
            {
              name: "Experience / Awards (10%)",
              done: experiences.length >= 1 || (profileData?.achievements || []).length >= 1,
              hint: "Work, internship, or award",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                item.done
                  ? "bg-emerald-500/[0.04] border-emerald-500/20 text-zinc-200"
                  : "bg-white/[0.02] border-[#232630] text-zinc-400"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {item.done ? (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                ) : (
                  <AlertCircle size={16} className="text-orange-500/70" />
                )}
              </div>
              <div className="min-w-0">
                <span className={`text-xs font-semibold block ${item.done ? "text-white" : "text-zinc-300"}`}>
                  {item.name}
                </span>
                <span className="text-[10px] text-zinc-500 block truncate">{item.hint}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Tabs */}
      <div className="flex border-b border-[#1e2026] gap-2 pb-2 overflow-x-auto no-scrollbar">
        {[
          { key: "EDUCATION", label: `Education (${education.length})`, icon: GraduationCap },
          { key: "SKILLS", label: `Skills (${skills.length})`, icon: Code2 },
          { key: "PROJECTS", label: `Projects (${projects.length})`, icon: FolderGit2 },
          { key: "EXPERIENCE", label: `Experience (${experiences.length})`, icon: Briefcase },
          { key: "PREVIEW", label: "Formatted Resume Preview", icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#F97316] text-white"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Education */}
      {activeTab === "EDUCATION" && (
        <div className="space-y-6">
          {/* Add Education Form */}
          <form onSubmit={handleAddEducation} className="p-6 rounded-3xl bg-[#14161b] border border-[#232630] space-y-4">
            <h3 className="font-display font-bold text-base text-white">Add Education Record</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">College / Institution</label>
                <input
                  type="text"
                  required
                  value={eduInstitution}
                  onChange={(e) => setEduInstitution(e.target.value)}
                  placeholder="e.g. Stanford University"
                  className="w-full px-4 py-2 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Degree</label>
                <input
                  type="text"
                  required
                  value={eduDegree}
                  onChange={(e) => setEduDegree(e.target.value)}
                  placeholder="e.g. Bachelor of Technology (B.Tech)"
                  className="w-full px-4 py-2 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Field of Study / Branch</label>
                <input
                  type="text"
                  value={eduField}
                  onChange={(e) => setEduField(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-4 py-2 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Start Year</label>
                  <input
                    type="number"
                    value={eduStartYear}
                    onChange={(e) => setEduStartYear(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">End Year</label>
                  <input
                    type="number"
                    disabled={eduIsCurrent}
                    value={eduEndYear}
                    onChange={(e) => setEduEndYear(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316] disabled:opacity-40"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eduIsCurrent}
                  onChange={(e) => setEduIsCurrent(e.target.checked)}
                  className="rounded border-zinc-700 text-[#F97316] focus:ring-[#F97316]"
                />
                <span>I am currently studying here</span>
              </label>

              <button
                type="submit"
                disabled={addingEdu}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F97316] hover:bg-orange-600 text-white transition-colors"
              >
                {addingEdu ? "Adding..." : "+ Add Education"}
              </button>
            </div>
          </form>

          {/* Existing Education List */}
          <div className="space-y-3">
            {education.map((edu: any) => (
              <div
                key={edu.id}
                className="p-5 rounded-2xl bg-[#14161b] border border-[#232630] flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-display font-bold text-sm text-white">{edu.institution}</h4>
                  <p className="text-xs text-[#F97316] mt-0.5">
                    {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                  </p>
                  <span className="text-[11px] font-mono text-zinc-500 block mt-1">
                    {edu.startYear} - {edu.isCurrent ? "Present" : edu.endYear || "Graduated"}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteEducation(edu.id)}
                  className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete education"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Skills */}
      {activeTab === "SKILLS" && (
        <div className="space-y-6">
          <form onSubmit={handleAddSkill} className="p-6 rounded-3xl bg-[#14161b] border border-[#232630] space-y-4">
            <h3 className="font-display font-bold text-base text-white">Add Technical Skill</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium text-zinc-300">Skill / Technology Name</label>
                <input
                  type="text"
                  required
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g. Next.js, Python, Rust, Docker, PyTorch..."
                  className="w-full px-4 py-2 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Proficiency Level</label>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value as any)}
                  className="w-full px-4 py-2 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={addingSkill}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F97316] hover:bg-orange-600 text-white transition-colors"
              >
                {addingSkill ? "Adding..." : "+ Add Skill"}
              </button>
            </div>
          </form>

          {/* Current Skills Chips */}
          <div className="p-6 rounded-3xl bg-[#14161b] border border-[#232630] space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
              Current Skills ({skills.length}) - Minimum 3 required for full resume score
            </h4>

            {skills.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No skills added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {skills.map((s: any, idx: number) => {
                  const name = s.skill?.name || s.name;
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#0d0e11] border border-zinc-700 text-zinc-200"
                    >
                      <span>{name}</span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">
                        {s.level?.slice(0, 3)}
                      </span>
                      <button
                        onClick={() => handleDeleteSkill(name)}
                        className="hover:text-red-400 text-zinc-500 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Projects */}
      {activeTab === "PROJECTS" && (
        <div className="space-y-6">
          <form onSubmit={handleAddProject} className="p-6 rounded-3xl bg-[#14161b] border border-[#232630] space-y-4">
            <h3 className="font-display font-bold text-base text-white">Add Portfolio Project</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Project Title</label>
                <input
                  type="text"
                  required
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  placeholder="e.g. Nexora Platform"
                  className="w-full px-4 py-2 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Description</label>
                <textarea
                  rows={2}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="What does it do? What problems does it solve?"
                  className="w-full px-4 py-2 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Repository URL</label>
                  <input
                    type="url"
                    value={projRepo}
                    onChange={(e) => setProjRepo(e.target.value)}
                    placeholder="https://github.com/user/repo"
                    className="w-full px-4 py-2 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Live Demo URL</label>
                  <input
                    type="url"
                    value={projLive}
                    onChange={(e) => setProjLive(e.target.value)}
                    placeholder="https://demo.app"
                    className="w-full px-4 py-2 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Tech Stack (comma-separated)</label>
                <input
                  type="text"
                  value={projTech}
                  onChange={(e) => setProjTech(e.target.value)}
                  placeholder="e.g. Next.js, Prisma, Tailwind, Redis"
                  className="w-full px-4 py-2 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={addingProj}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F97316] hover:bg-orange-600 text-white transition-colors"
              >
                {addingProj ? "Adding..." : "+ Add Project"}
              </button>
            </div>
          </form>

          {/* Existing Projects List */}
          <div className="space-y-3">
            {projects.map((proj: any) => (
              <div
                key={proj.id}
                className="p-5 rounded-2xl bg-[#14161b] border border-[#232630] flex items-start justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h4 className="font-display font-bold text-sm text-white">{proj.title}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{proj.description}</p>
                  {proj.techStack && proj.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {proj.techStack.map((tech: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0d0e11] text-zinc-300">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteProject(proj.id)}
                  className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete project"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Experience */}
      {activeTab === "EXPERIENCE" && (
        <div className="space-y-6">
          <form onSubmit={handleAddExperience} className="p-6 rounded-3xl bg-[#14161b] border border-[#232630] space-y-4">
            <h3 className="font-display font-bold text-base text-white">Add Work Experience / Internship</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Company / Organization</label>
                <input
                  type="text"
                  required
                  value={expCompany}
                  onChange={(e) => setExpCompany(e.target.value)}
                  placeholder="e.g. Google, Startup Inc"
                  className="w-full px-4 py-2 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Title / Role</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g. Software Engineering Intern"
                  className="w-full px-4 py-2 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Start Date</label>
                <input
                  type="date"
                  required
                  value={expStartDate}
                  onChange={(e) => setExpStartDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">End Date</label>
                <input
                  type="date"
                  disabled={expIsCurrent}
                  value={expEndDate}
                  onChange={(e) => setExpEndDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316] disabled:opacity-40"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Description</label>
              <textarea
                rows={2}
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                placeholder="Key responsibilities, tools used, and achievements..."
                className="w-full px-4 py-2 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316] resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={expIsCurrent}
                  onChange={(e) => setExpIsCurrent(e.target.checked)}
                  className="rounded border-zinc-700 text-[#F97316] focus:ring-[#F97316]"
                />
                <span>I currently work here</span>
              </label>

              <button
                type="submit"
                disabled={addingExp}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F97316] hover:bg-orange-600 text-white transition-colors"
              >
                {addingExp ? "Adding..." : "+ Add Experience"}
              </button>
            </div>
          </form>

          {/* Existing Experience List */}
          <div className="space-y-3">
            {experiences.map((exp: any) => (
              <div
                key={exp.id}
                className="p-5 rounded-2xl bg-[#14161b] border border-[#232630] flex items-start justify-between gap-4"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <h4 className="font-display font-bold text-sm text-white">{exp.title}</h4>
                  <p className="text-xs text-amber-400">{exp.company}</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">{exp.description}</p>
                </div>
                <button
                  onClick={() => handleDeleteExperience(exp.id)}
                  className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete experience"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Formatted Resume Preview */}
      {activeTab === "PREVIEW" && (
        <div className="p-8 sm:p-12 rounded-3xl bg-white text-zinc-900 shadow-2xl space-y-8 font-sans border border-zinc-200">
          <div className="border-b border-zinc-300 pb-6 flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-display font-bold text-zinc-900">
                {profileData?.user?.name || profile.name || "Student Developer"}
              </h2>
              <p className="text-sm font-semibold text-[#F97316] mt-1">{profile.headline}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 mt-2">
                {profile.location && <span>{profile.location}</span>}
                {profile.contactEmail && <span>• {profile.contactEmail}</span>}
                {profile.githubUrl && <span>• {profile.githubUrl}</span>}
                {profile.linkedinUrl && <span>• {profile.linkedinUrl}</span>}
              </div>
            </div>
          </div>

          {profile.bio && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                Summary
              </h3>
              <p className="text-xs text-zinc-700 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {education.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                Education
              </h3>
              {education.map((edu: any) => (
                <div key={edu.id} className="flex justify-between items-start text-xs">
                  <div>
                    <strong className="text-zinc-900 block">{edu.institution}</strong>
                    <span className="text-zinc-600">{edu.degree} in {edu.fieldOfStudy}</span>
                  </div>
                  <span className="font-mono text-zinc-500">{edu.startYear} - {edu.endYear || "Present"}</span>
                </div>
              ))}
            </div>
          )}

          {skills.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s: any, idx: number) => (
                  <span key={idx} className="px-2 py-0.5 rounded text-xs bg-zinc-100 border border-zinc-200 text-zinc-800">
                    {s.skill?.name || s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                Projects
              </h3>
              {projects.map((proj: any) => (
                <div key={proj.id} className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <strong className="text-zinc-900">{proj.title}</strong>
                    {proj.repoUrl && <span className="text-zinc-500 font-mono text-[11px]">{proj.repoUrl}</span>}
                  </div>
                  <p className="text-zinc-700">{proj.description}</p>
                  {proj.techStack && (
                    <span className="text-[11px] font-mono text-zinc-500">Tech: {proj.techStack.join(", ")}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

