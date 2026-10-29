"use client";

import { useEffect, useState, useId } from "react";
import { useSession } from "@/lib/contexts/SessionContext";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { ShinyButton } from "@/app/components/ShinyButton";
import {
  User,
  Sparkles,
  Globe,
  Plus,
  Trash2,
  ExternalLink,
  Code2,
  Check,
  Briefcase,
  FolderGit2,
  GraduationCap,
  MapPin,
  Mail,
  Camera,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Sliders,
  Layers,
  Calendar,
  Building,
} from "lucide-react";

interface SkillItem {
  name: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
}

interface ProjectItem {
  id: string;
  title: string;
  description?: string | null;
  repoUrl?: string | null;
  liveUrl?: string | null;
  techStack?: string[];
}

interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string | null;
  startYear: number;
  endYear?: number | null;
  isCurrent?: boolean;
}

interface ExperienceItem {
  id: string;
  company: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  isCurrent?: boolean;
}

const POPULAR_SKILLS = [
  "Next.js",
  "React",
  "TypeScript",
  "Python",
  "Tailwind CSS",
  "PostgreSQL",
  "Docker",
  "Rust",
  "PyTorch",
  "Node.js",
  "Go",
  "GraphQL",
  "Solidity",
  "Prisma",
];

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&h=256&q=80",
];

export default function ProfileSettingsPage() {
  const { user, refreshSession } = useSession();
  const [activeSubTab, setActiveSubTab] = useState<"basics" | "skills" | "projects" | "experience">("basics");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Profile Basics & Identity
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showAvatarInput, setShowAvatarInput] = useState(false);
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [showContactEmail, setShowContactEmail] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [lookingForTeam, setLookingForTeam] = useState(false);
  const [slug, setSlug] = useState("");

  // Completeness
  const [completenessScore, setCompletenessScore] = useState(0);
  const [missingItems, setMissingItems] = useState<string[]>([]);

  // Skills
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">("INTERMEDIATE");

  // Projects
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectRepo, setNewProjectRepo] = useState("");
  const [newProjectLive, setNewProjectLive] = useState("");
  const [newProjectTech, setNewProjectTech] = useState("");

  // Education & Experience
  const [educationList, setEducationList] = useState<EducationItem[]>([]);
  const [experienceList, setExperienceList] = useState<ExperienceItem[]>([]);
  const [showAddEducation, setShowAddEducation] = useState(false);
  const [showAddExperience, setShowAddExperience] = useState(false);
  
  // New Education fields
  const [eduInstitution, setEduInstitution] = useState("");
  const [eduDegree, setEduDegree] = useState("");
  const [eduField, setEduField] = useState("");
  const [eduStartYear, setEduStartYear] = useState<number>(new Date().getFullYear() - 2);
  const [eduEndYear, setEduEndYear] = useState<number>(new Date().getFullYear() + 2);
  const [eduIsCurrent, setEduIsCurrent] = useState(false);

  // New Experience fields
  const [expCompany, setExpCompany] = useState("");
  const [expTitle, setExpTitle] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expStartDate, setExpStartDate] = useState("");
  const [expEndDate, setExpEndDate] = useState("");
  const [expIsCurrent, setExpIsCurrent] = useState(false);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const data: any = await apiFetch("/me/profile");
      const profile = data?.profile || data;

      if (profile) {
        setHeadline(profile.headline || "");
        setBio(profile.bio || "");
        setLocation(profile.location || "");
        setAvatarUrl(profile.avatarUrl || "");
        setContactEmail(profile.contactEmail || "");
        setShowContactEmail(!!profile.showContactEmail);
        setGithubUrl(profile.githubUrl || "");
        setLinkedinUrl(profile.linkedinUrl || "");
        setPortfolioUrl(profile.portfolioUrl || "");
        setTwitterUrl(profile.twitterUrl || "");
        setLookingForTeam(!!profile.lookingForTeam);
        setSlug(profile.slug || "");
      }

      if (data?.completeness) {
        setCompletenessScore(data.completeness.score || 0);
        setMissingItems(data.completeness.missing || []);
      }

      if (Array.isArray(data?.skills)) {
        setSkills(
          data.skills.map((s: any) => ({
            name: s.skill?.name || s.name,
            level: s.level || "INTERMEDIATE",
          }))
        );
      }

      if (Array.isArray(data?.projects)) {
        setProjects(data.projects);
      }

      if (Array.isArray(data?.education)) {
        setEducationList(data.education);
      }

      if (Array.isArray(data?.experiences)) {
        setExperienceList(data.experiences);
      }

      if (user?.name) {
        setName(user.name);
      }
    } catch (err: any) {
      console.error("Failed to load profile details:", err);
      setErrorMessage(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    if (user?.name && !name) {
      setName(user.name);
    }
  }, [user]);

  // Save Basics Form
  const handleSaveBasics = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      // 1. Update Name via PATCH /me if changed
      if (user && name.trim() && name.trim() !== user.name) {
        await apiFetch("/me", {
          method: "PATCH",
          body: JSON.stringify({ name: name.trim() }),
        });
        await refreshSession();
      }

      // 2. Update Profile fields via PUT /me/profile
      const cleanUrl = (url: string) => {
        const trimmed = url.trim();
        return trimmed.length > 0 ? trimmed : null;
      };

      await apiFetch("/me/profile", {
        method: "PUT",
        body: JSON.stringify({
          headline: headline.trim() || null,
          bio: bio.trim() || null,
          location: location.trim() || null,
          avatarUrl: cleanUrl(avatarUrl),
          contactEmail: cleanUrl(contactEmail),
          showContactEmail,
          githubUrl: cleanUrl(githubUrl),
          linkedinUrl: cleanUrl(linkedinUrl),
          portfolioUrl: cleanUrl(portfolioUrl),
          twitterUrl: cleanUrl(twitterUrl),
          lookingForTeam,
        }),
      });

      setSuccessMessage("Developer profile updated successfully!");
      // Re-fetch completeness
      try {
        const comp: any = await apiFetch("/me/profile/completeness");
        if (comp) {
          setCompletenessScore(comp.score || 0);
          setMissingItems(comp.missing || []);
        }
      } catch {
        // Best effort
      }
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Add / Remove Skills
  const handleAddSkill = async (skillToAdd?: string) => {
    const sName = (skillToAdd || newSkillName).trim();
    if (!sName) return;

    // Check duplicate
    if (skills.some((s) => s.name.toLowerCase() === sName.toLowerCase())) {
      setNewSkillName("");
      return;
    }

    const updated = [...skills, { name: sName, level: newSkillLevel }];
    setSkills(updated);
    setNewSkillName("");

    try {
      await apiFetch("/me/skills", {
        method: "PUT",
        body: JSON.stringify({ skills: updated }),
      });
      setSuccessMessage(`Added "${sName}" to your skills.`);
      setTimeout(() => setSuccessMessage(""), 2500);
    } catch (err: any) {
      alert(err.message || "Failed to save skill");
      // Revert state on failure
      setSkills(skills);
    }
  };

  const handleRemoveSkill = async (index: number) => {
    const updated = skills.filter((_, i) => i !== index);
    setSkills(updated);
    try {
      await apiFetch("/me/skills", {
        method: "PUT",
        body: JSON.stringify({ skills: updated }),
      });
    } catch (err: any) {
      alert(err.message || "Failed to update skills");
      setSkills(skills);
    }
  };

  // Add / Delete Projects
  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;

    try {
      const cleanUrl = (url: string) => {
        const trimmed = url.trim();
        return trimmed.length > 0 ? trimmed : null;
      };

      const techStack = newProjectTech
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const added: any = await apiFetch("/me/projects", {
        method: "POST",
        body: JSON.stringify({
          title: newProjectTitle.trim(),
          description: newProjectDesc.trim() || null,
          repoUrl: cleanUrl(newProjectRepo),
          liveUrl: cleanUrl(newProjectLive),
          techStack,
        }),
      });

      setProjects((prev) => [added, ...prev]);
      setShowAddProject(false);
      setNewProjectTitle("");
      setNewProjectDesc("");
      setNewProjectRepo("");
      setNewProjectLive("");
      setNewProjectTech("");
      setSuccessMessage("Project added to your portfolio!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to add project");
    }
  };

  const handleDeleteProject = async (projId: string) => {
    if (!confirm("Are you sure you want to remove this project?")) return;
    try {
      await apiFetch(`/me/projects/${projId}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== projId));
    } catch (err: any) {
      alert(err.message || "Failed to delete project");
    }
  };

  // Add / Delete Education
  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduInstitution.trim() || !eduDegree.trim()) return;

    try {
      const added: any = await apiFetch("/me/education", {
        method: "POST",
        body: JSON.stringify({
          institution: eduInstitution.trim(),
          degree: eduDegree.trim(),
          fieldOfStudy: eduField.trim() || null,
          startYear: Number(eduStartYear),
          endYear: eduIsCurrent ? null : Number(eduEndYear),
          isCurrent: eduIsCurrent,
        }),
      });
      setEducationList((prev) => [added, ...prev]);
      setShowAddEducation(false);
      setEduInstitution("");
      setEduDegree("");
      setEduField("");
      setSuccessMessage("Education record added!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to add education");
    }
  };

  const handleDeleteEducation = async (id: string) => {
    if (!confirm("Delete this education entry?")) return;
    try {
      await apiFetch(`/me/education/${id}`, { method: "DELETE" });
      setEducationList((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete education");
    }
  };

  // Add / Delete Experience
  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expCompany.trim() || !expTitle.trim() || !expStartDate) return;

    try {
      const added: any = await apiFetch("/me/experience", {
        method: "POST",
        body: JSON.stringify({
          company: expCompany.trim(),
          title: expTitle.trim(),
          description: expDesc.trim() || null,
          startDate: new Date(expStartDate).toISOString(),
          endDate: expIsCurrent || !expEndDate ? null : new Date(expEndDate).toISOString(),
          isCurrent: expIsCurrent,
        }),
      });
      setExperienceList((prev) => [added, ...prev]);
      setShowAddExperience(false);
      setExpCompany("");
      setExpTitle("");
      setExpDesc("");
      setExpStartDate("");
      setExpEndDate("");
      setSuccessMessage("Experience entry added!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to add experience");
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!confirm("Delete this experience entry?")) return;
    try {
      await apiFetch(`/me/experience/${id}`, { method: "DELETE" });
      setExperienceList((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete experience");
    }
  };

  // Derive user initials
  const initials = (name || user?.name || "Dev")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (loading) return <LoadingState message="Loading developer profile..." />;

  return (
    <div className="space-y-8 font-sans">
      {/* ── Top Hero Card: Avatar & Profile Summary ── */}
      <div className="p-6 md:p-8 rounded-3xl border border-[var(--border)] bg-[var(--bg-canvas)]/70 relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar with glow and instant edit button */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-[#F97316]/40 p-1 shadow-lg shadow-orange-500/10 bg-[var(--bg-elevated)]">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={name || "User Avatar"}
                    className="w-full h-full rounded-full object-cover"
                    onError={() => setAvatarUrl("")}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#EA580C] via-[#F97316] to-[#FDBA74] flex items-center justify-center text-white font-display font-extrabold text-2xl sm:text-3xl shadow-inner">
                    {initials}
                  </div>
                )}
              </div>

              {/* Camera Icon Overlay to trigger URL picker */}
              <button
                type="button"
                onClick={() => setShowAvatarInput(!showAvatarInput)}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-[#F97316] text-white hover:bg-orange-600 transition-transform active:scale-95 shadow-md shadow-orange-500/30"
                title="Change Avatar URL"
              >
                <Camera size={14} />
              </button>
            </div>

            {/* Profile Overview Text */}
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)]">
                  {name || user?.name || "Developer"}
                </h2>
                {lookingForTeam && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Open to Teams
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
                {headline || "No headline set yet. Tell organizers about your tech superpowers!"}
              </p>
              <div className="flex items-center gap-3 pt-1 text-xs text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <Mail size={12} className="text-[#F97316]" />
                  <span>{user?.email}</span>
                </span>
                {location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-[#F97316]" />
                    <span>{location}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Completeness Meter */}
          <div className="w-full sm:w-56 p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]/90 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#F97316]" />
                Completeness
              </span>
              <span className="font-mono font-bold text-[#F97316]">
                {completenessScore}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--bg-canvas)] border border-[var(--border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#F97316] to-[#FB923C] transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, completenessScore))}%` }}
              />
            </div>
            {missingItems.length > 0 ? (
              <p className="text-[10px] text-[var(--text-secondary)] truncate">
                Next: {missingItems[0]}
              </p>
            ) : (
              <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                <CheckCircle2 size={11} /> All set for hackathons!
              </p>
            )}
          </div>
        </div>

        {/* Collapsible Avatar URL Drawer */}
        {showAvatarInput && (
          <div className="mt-6 pt-5 border-t border-[var(--border)] space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text-primary)]">
                Avatar Photo URL
              </label>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Paste any image URL or choose a preset below
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="https://images.unsplash.com/... or https://avatars.githubusercontent.com/..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316] font-mono"
              />
              <button
                type="button"
                onClick={() => setShowAvatarInput(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F97316] text-white hover:bg-orange-600 transition-colors shadow-sm"
              >
                Apply
              </button>
            </div>

            {/* Quick Preset Avatars */}
            <div className="flex items-center gap-2.5 pt-1">
              <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                Presets:
              </span>
              <div className="flex items-center gap-2">
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className="w-7 h-7 rounded-full overflow-hidden border border-[var(--border)] hover:scale-110 hover:border-[#F97316] transition-all"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-[var(--border)]">
        {[
          { key: "basics", label: "Overview & Bio", icon: User },
          { key: "skills", label: `Skills (${skills.length})`, icon: Sparkles },
          { key: "projects", label: `Projects (${projects.length})`, icon: FolderGit2 },
          { key: "experience", label: `Experience & Education`, icon: Briefcase },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeSubTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveSubTab(t.key as any)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                active
                  ? "bg-[#F97316] text-white shadow-md shadow-orange-500/20"
                  : "bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Alert Toasts ── */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
          <AlertCircle size={16} className="text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 1: BASICS & BIO                                       */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === "basics" && (
        <form onSubmit={handleSaveBasics} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-base font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
              <User size={16} className="text-[#F97316]" />
              Personal & Account Identity
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                  Full Display Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your legal or preferred name"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316] transition-colors font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                  Account Email (Primary)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    readOnly
                    value={user?.email || ""}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-[var(--bg-canvas)]/50 border border-[var(--border)] opacity-60 cursor-not-allowed text-[var(--text-primary)] font-medium"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    <CheckCircle2 size={11} /> Verified
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                  Public Contact Email (Optional)
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@yourdomain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                  Location / City
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. San Francisco, CA or Bengaluru, India"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316] transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-base font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles size={16} className="text-[#F97316]" />
              Headline & Technical Bio
            </h3>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Professional Headline
                </label>
                <span className="text-[11px] text-[var(--text-secondary)] font-mono">
                  {headline.length} / 120
                </span>
              </div>
              <input
                type="text"
                maxLength={120}
                placeholder="e.g. Full-Stack Engineer | Autonomous AI Systems & Distributed DBs"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316] transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Technical Bio
                </label>
                <span className="text-[11px] text-[var(--text-secondary)] font-mono">
                  {bio.length} / 1000
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={1000}
                placeholder="Brief summary of your development experience, past hackathon wins, favorite stack, and what you love building..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316] transition-colors leading-relaxed"
              />
            </div>
          </div>

          {/* Hackathon Team Seeking Switch Card */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-canvas)] flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs sm:text-sm text-[var(--text-primary)]">
                  Actively Seeking Hackathon Teammates
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-500/10 text-[#F97316]">
                  Team Finder
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Highlight your profile on team discovery leaderboards so captains and recruiters can invite you to open rosters.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={lookingForTeam}
                onChange={(e) => setLookingForTeam(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F97316]"></div>
            </label>
          </div>

          {/* Social Links Grid */}
          <div className="space-y-4 pt-2">
            <h3 className="text-base font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
              <Globe size={16} className="text-[#F97316]" />
              Social & Portfolio Links
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                  <Code2 size={13} className="text-[#F97316]" />
                  <span>GitHub Profile</span>
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/username"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                  <Globe size={13} className="text-[#F97316]" />
                  <span>LinkedIn Profile</span>
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                  <ExternalLink size={13} className="text-[#F97316]" />
                  <span>Portfolio / Personal Website</span>
                </label>
                <input
                  type="url"
                  placeholder="https://yourdomain.dev"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                  <Globe size={13} className="text-[#F97316]" />
                  <span>Twitter / X Profile</span>
                </label>
                <input
                  type="url"
                  placeholder="https://x.com/username"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316] font-mono"
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-6 border-t border-[var(--border)] flex items-center justify-between">
            <p className="text-xs text-[var(--text-secondary)]">
              Changes update immediately across active hackathon registrations.
            </p>
            <ShinyButton
              type="submit"
              variant="primary"
              size="md"
              disabled={saving}
              className="px-6 py-2.5"
            >
              {saving ? "Saving Changes..." : "Save Profile Details"}
            </ShinyButton>
          </div>
        </form>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 2: SKILLS & TECH STACK                                */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === "skills" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles size={16} className="text-[#F97316]" />
              Skills & Tech Stack ({skills.length})
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Add programming languages, frameworks, AI libraries, and tools you excel in.
            </p>
          </div>

          {/* Quick-add popular badges */}
          <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-canvas)] space-y-2.5">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
              Quick Add Popular Tech:
            </span>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SKILLS.map((item) => {
                const alreadyAdded = skills.some((s) => s.name.toLowerCase() === item.toLowerCase());
                return (
                  <button
                    key={item}
                    type="button"
                    disabled={alreadyAdded}
                    onClick={() => handleAddSkill(item)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      alreadyAdded
                        ? "opacity-40 cursor-not-allowed bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                        : "bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[#F97316] hover:text-[#F97316]"
                    }`}
                  >
                    <span>{item}</span>
                    {alreadyAdded ? <Check size={11} /> : <Plus size={11} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Skill Input Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <input
              type="text"
              placeholder="Custom skill (e.g. Next.js, PyTorch, Kubernetes, WebSockets)..."
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316]"
            />
            <select
              value={newSkillLevel}
              onChange={(e: any) => setNewSkillLevel(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] font-medium"
            >
              <option value="BEGINNER">Beginner (Learning)</option>
              <option value="INTERMEDIATE">Intermediate (Proficient)</option>
              <option value="ADVANCED">Advanced (Expert)</option>
            </select>
            <button
              type="button"
              onClick={() => handleAddSkill()}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#F97316] text-white hover:bg-orange-600 transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <Plus size={15} />
              <span>Add Skill</span>
            </button>
          </div>

          {/* Skills Grid */}
          <div className="space-y-3 pt-2">
            {skills.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-canvas)]/40 space-y-2">
                <Sparkles size={28} className="mx-auto text-[var(--text-secondary)] opacity-50" />
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  No skills added to your profile yet
                </p>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  Click on the popular badges above or type in your favorite programming languages and libraries.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {skills.map((s, idx) => {
                  const levelClasses = {
                    ADVANCED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                    INTERMEDIATE: "bg-sky-500/10 text-sky-400 border-sky-500/30",
                    BEGINNER: "bg-amber-500/10 text-amber-400 border-amber-500/30",
                  }[s.level];

                  return (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-medium border border-[var(--border)] bg-[var(--bg-canvas)] text-[var(--text-primary)] shadow-xs hover:border-[#F97316]/50 transition-colors"
                    >
                      <span className="font-semibold">{s.name}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${levelClasses}`}>
                        {s.level.toLowerCase()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(idx)}
                        className="text-[var(--text-secondary)] hover:text-red-400 transition-colors ml-1 p-0.5 rounded-full hover:bg-red-500/10"
                        title="Remove skill"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 3: PORTFOLIO PROJECTS                                 */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === "projects" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
                <FolderGit2 size={16} className="text-[#F97316]" />
                Portfolio Projects ({projects.length})
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Showcase past hackathon builds, open-source repositories, and web applications.
              </p>
            </div>
            <button
              onClick={() => setShowAddProject(!showAddProject)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#F97316] text-white hover:bg-orange-600 transition-colors shadow-sm"
            >
              <Plus size={14} />
              <span>{showAddProject ? "Close Form" : "Add Project"}</span>
            </button>
          </div>

          {/* Add Project Card Form */}
          {showAddProject && (
            <form onSubmit={handleAddProject} className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-canvas)] space-y-4 animate-in fade-in slide-in-from-top-2">
              <h4 className="text-sm font-bold font-display text-[var(--text-primary)]">
                Add New Showcase Project
              </h4>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Autonomous Multi-Agent Coordinator"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Project Description
                </label>
                <textarea
                  rows={2}
                  placeholder="What does this project do and what problem did it solve in the hackathon?"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                    <Code2 size={12} className="text-[#F97316]" /> GitHub / Code Repo URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/username/project"
                    value={newProjectRepo}
                    onChange={(e) => setNewProjectRepo(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                    <ExternalLink size={12} className="text-[#F97316]" /> Live Demo / Web URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://my-app.vercel.app"
                    value={newProjectLive}
                    onChange={(e) => setNewProjectLive(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Tech Stack (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Next.js, TypeScript, PostgreSQL, Tailwind, OpenAI"
                  value={newProjectTech}
                  onChange={(e) => setNewProjectTech(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProject(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#F97316] text-white hover:bg-orange-600 transition-colors shadow-sm"
                >
                  Save Project
                </button>
              </div>
            </form>
          )}

          {/* Project List */}
          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-canvas)]/40 space-y-2">
                <FolderGit2 size={28} className="mx-auto text-[var(--text-secondary)] opacity-50" />
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  No portfolio projects added yet
                </p>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  Adding projects proves your technical skills to hackathon judges and helps you recruit high-performing team members.
                </p>
              </div>
            ) : (
              projects.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-canvas)] flex items-start justify-between gap-4 hover:border-[#F97316]/40 transition-colors"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="text-sm font-bold text-[var(--text-primary)] font-display">
                        {p.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        {p.repoUrl && (
                          <a
                            href={p.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-secondary)] hover:text-[#F97316] bg-[var(--bg-elevated)] border border-[var(--border)] px-2 py-0.5 rounded-md"
                          >
                            <Code2 size={12} />
                            <span>Code</span>
                          </a>
                        )}
                        {p.liveUrl && (
                          <a
                            href={p.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-secondary)] hover:text-[#F97316] bg-[var(--bg-elevated)] border border-[var(--border)] px-2 py-0.5 rounded-md"
                          >
                            <ExternalLink size={12} />
                            <span>Live</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {p.description && (
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {p.description}
                      </p>
                    )}

                    {Array.isArray(p.techStack) && p.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {p.techStack.map((tech: string, i: number) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)]"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteProject(p.id)}
                    className="text-[var(--text-secondary)] hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition-colors shrink-0"
                    title="Delete project"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 4: EDUCATION & EXPERIENCE                              */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === "experience" && (
        <div className="space-y-8">
          {/* Education Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
                  <GraduationCap size={16} className="text-[#F97316]" />
                  Education & College ({educationList.length})
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Your university, college degree, and academic background.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEducation(!showAddEducation)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#F97316] text-white hover:bg-orange-600 transition-colors shadow-sm"
              >
                <Plus size={13} />
                <span>Add Education</span>
              </button>
            </div>

            {showAddEducation && (
              <form onSubmit={handleAddEducation} className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-canvas)] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Institution / College *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Stanford University or IIT Delhi"
                      value={eduInstitution}
                      onChange={(e) => setEduInstitution(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Degree *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B.S. in Computer Science"
                      value={eduDegree}
                      onChange={(e) => setEduDegree(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Field of Study
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Artificial Intelligence"
                      value={eduField}
                      onChange={(e) => setEduField(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Start Year
                    </label>
                    <input
                      type="number"
                      required
                      min={1970}
                      max={2099}
                      value={eduStartYear}
                      onChange={(e) => setEduStartYear(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      End Year (or Expected)
                    </label>
                    <input
                      type="number"
                      min={1970}
                      max={2099}
                      disabled={eduIsCurrent}
                      value={eduEndYear}
                      onChange={(e) => setEduEndYear(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316] disabled:opacity-40"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddEducation(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#F97316] text-white hover:bg-orange-600 transition-colors shadow-sm"
                  >
                    Save Education
                  </button>
                </div>
              </form>
            )}

            {educationList.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] italic">
                No education history listed yet.
              </p>
            ) : (
              <div className="space-y-2">
                {educationList.map((edu) => (
                  <div
                    key={edu.id}
                    className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)] flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                        {edu.institution}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {edu.degree} {edu.fieldOfStudy ? `• ${edu.fieldOfStudy}` : ""} ({edu.startYear} - {edu.isCurrent ? "Present" : edu.endYear || "Graduated"})
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteEducation(edu.id)}
                      className="text-[var(--text-secondary)] hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Delete education"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Work Experience Section */}
          <div className="space-y-4 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
                  <Building size={16} className="text-[#F97316]" />
                  Work Experience & Internships ({experienceList.length})
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Industry roles, research positions, or software internships.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddExperience(!showAddExperience)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#F97316] text-white hover:bg-orange-600 transition-colors shadow-sm"
              >
                <Plus size={13} />
                <span>Add Experience</span>
              </button>
            </div>

            {showAddExperience && (
              <form onSubmit={handleAddExperience} className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-canvas)] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Company / Organization *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. OpenAI or Google"
                      value={expCompany}
                      onChange={(e) => setExpCompany(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Role / Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Software Engineer Intern"
                      value={expTitle}
                      onChange={(e) => setExpTitle(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={expStartDate}
                      onChange={(e) => setExpStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      disabled={expIsCurrent}
                      value={expEndDate}
                      onChange={(e) => setExpEndDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316] disabled:opacity-40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Key Achievements & Responsibilities
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Built high-throughput indexing microservice, scaled databases..."
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddExperience(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#F97316] text-white hover:bg-orange-600 transition-colors shadow-sm"
                  >
                    Save Experience
                  </button>
                </div>
              </form>
            )}

            {experienceList.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] italic">
                No work experience listed yet.
              </p>
            ) : (
              <div className="space-y-2">
                {experienceList.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)] flex items-start justify-between gap-4"
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                        {exp.title} • {exp.company}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] font-mono">
                        {new Date(exp.startDate).toLocaleDateString(undefined, { month: "short", year: "numeric" })} - {exp.isCurrent || !exp.endDate ? "Present" : new Date(exp.endDate).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                      </p>
                      {exp.description && (
                        <p className="text-xs text-[var(--text-secondary)] pt-1">
                          {exp.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteExperience(exp.id)}
                      className="text-[var(--text-secondary)] hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                      title="Delete experience"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
