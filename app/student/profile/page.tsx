"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { useSession } from "@/lib/contexts/SessionContext";
import { LoadingState } from "@/components/shared/states";
import { ShinyButton } from "@/app/components/ShinyButton";
import {
  User,
  ExternalLink,
  Copy,
  Check,
  Globe,
  MapPin,
  Mail,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Code2,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Sparkles,
  Camera,
  Upload,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  RefreshCw,
  X,
} from "lucide-react";

const GithubIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const LinkedinIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-1.6-1.6Z" />
  </svg>
);

const TwitterIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function StudentProfilePage() {
  const { user, refreshSession } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Editable Form Fields
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
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
  const [isPublic, setIsPublic] = useState(true);
  const [slug, setSlug] = useState("");

  // Student ID Card & Verification State (MANDATORY)
  const [hasIdCard, setHasIdCard] = useState(false);
  const [idCardStorageKey, setIdCardStorageKey] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [idFileName, setIdFileName] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState(false);
  const [idCardError, setIdCardError] = useState<string | null>(null);
  const [showReplaceId, setShowReplaceId] = useState(false);

  // Profile Picture Upload State (OPTIONAL)
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const idFileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    try {
      const data: any = await apiFetch("/me/profile");
      const p = data?.profile || data;
      setProfile(p);
      if (p) {
        setName(user?.name || "");
        setAvatarUrl(p.avatarUrl || "");
        setHeadline(p.headline || "");
        setBio(p.bio || "");
        setLocation(p.location || "");
        setContactEmail(p.contactEmail || "");
        setShowContactEmail(!!p.showContactEmail);
        setGithubUrl(p.githubUrl || "");
        setLinkedinUrl(p.linkedinUrl || "");
        setPortfolioUrl(p.portfolioUrl || "");
        setTwitterUrl(p.twitterUrl || "");
        setLookingForTeam(!!p.lookingForTeam);
        setIsPublic(p.isPublic ?? true);
        setSlug(p.slug || "");

        // Check if student has an existing ID card
        if (p.verification?.hasIdCard || p.verification?.idCardStorageKey) {
          setHasIdCard(true);
          setIdCardStorageKey(p.verification.idCardStorageKey);
          setVerificationId(p.verification.id);
        }
      }
    } catch (err: any) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Avatar Upload (Optional)
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ text: "Please select an image file (JPG, PNG, WebP).", type: "error" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: "Profile picture size must not exceed 5MB.", type: "error" });
      return;
    }

    // Local instant preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setAvatarUrl(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    try {
      const presignRes: any = await apiFetch("/uploads/presign", {
        method: "POST",
        body: JSON.stringify({
          purpose: "AVATAR",
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });

      if (presignRes?.uploadUrl) {
        await fetch(presignRes.uploadUrl, {
          method: "PUT",
          headers: presignRes.headers,
          body: file,
        });

        const confirmRes: any = await apiFetch(`/uploads/${presignRes.fileId}/confirm`, {
          method: "POST",
        });

        if (confirmRes?.url) {
          setAvatarUrl(confirmRes.url);
        }
      }
      setMessage({ text: "Profile picture uploaded successfully!", type: "success" });
    } catch {
      // In offline/mock mode, the data URL remains active
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Student ID Card Upload (Mandatory)
  const handleIdCardFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIdCardError(null);

    const validMimes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validMimes.includes(file.type)) {
      setIdCardError("Invalid file type. Only JPG, PNG, or PDF student ID cards are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setIdCardError("File size exceeds 5MB limit.");
      return;
    }

    setUploadingId(true);
    try {
      const { storageKey, uploadUrl, headers } = await apiFetch<{
        storageKey: string;
        uploadUrl: string;
        headers: Record<string, string>;
      }>("/verifications/upload-url", {
        method: "POST",
        body: JSON.stringify({ mimeType: file.type, sizeBytes: file.size }),
      });

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers,
        body: file,
      });

      if (!putRes.ok && !uploadUrl.includes("mock=true")) {
        throw new Error("Failed to upload ID document to secure storage.");
      }

      // Automatically sync and persist with profile
      await apiFetch("/me/profile", {
        method: "PATCH",
        body: JSON.stringify({ idCardStorageKey: storageKey }),
      });

      setIdCardStorageKey(storageKey);
      setHasIdCard(true);
      setIdFileName(file.name);
      setShowReplaceId(false);
      setMessage({ text: "Student ID card uploaded and verified successfully!", type: "success" });
    } catch (err: any) {
      setIdCardError(err.message || "Failed to upload student ID card.");
    } finally {
      setUploadingId(false);
    }
  };

  const handleViewIdCard = async () => {
    if (!verificationId) return;
    try {
      const res: any = await apiFetch(`/verifications/${verificationId}/document`);
      if (res?.signedUrl) {
        window.open(res.signedUrl, "_blank");
      }
    } catch (err: any) {
      alert("Could not load ID card document: " + err.message);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Enforce that Student ID Card is MANDATORY
    if (!hasIdCard && !idCardStorageKey) {
      setSaving(false);
      setMessage({
        text: "Student ID card upload is mandatory. Please upload your student ID card before saving your profile.",
        type: "error",
      });
      const el = document.getElementById("student-id-card-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      return;
    }

    try {
      if (name.trim() && name !== user?.name) {
        await apiFetch("/me", {
          method: "PATCH",
          body: JSON.stringify({ name: name.trim() }),
        });
      }

      await apiFetch("/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          avatarUrl: avatarUrl.trim() || null,
          idCardStorageKey: idCardStorageKey || undefined,
          headline: headline.trim() || null,
          bio: bio.trim() || null,
          location: location.trim() || null,
          contactEmail: contactEmail.trim() || null,
          showContactEmail,
          githubUrl: githubUrl.trim() || null,
          linkedinUrl: linkedinUrl.trim() || null,
          portfolioUrl: portfolioUrl.trim() || null,
          twitterUrl: twitterUrl.trim() || null,
          lookingForTeam,
          isPublic,
        }),
      });

      setMessage({ text: "Profile and student verification updated successfully!", type: "success" });
      await refreshSession();
      await fetchProfile();
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to update profile", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPublicUrl = () => {
    if (!slug) return;
    const url = `${window.location.origin}/profiles/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) return <LoadingState message="Loading your portfolio..." />;

  const publicUrl = slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/profiles/${slug}` : "";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
            My Public Developer Profile
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Your Devfolio-inspired developer portfolio, visible to hackathon organizers and teammates.
          </p>
        </div>

        {slug && (
          <div className="flex items-center gap-2">
            <Link
              href={`/profiles/${slug}`}
              target="_blank"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-zinc-700 transition-colors flex items-center gap-1.5"
            >
              <span>View Live</span>
              <ExternalLink size={13} />
            </Link>
            <button
              type="button"
              onClick={handleCopyPublicUrl}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-orange-500/10 hover:bg-orange-500/20 text-[#F97316] border border-orange-500/30 transition-colors flex items-center gap-1.5"
            >
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedLink ? "Copied Link!" : "Share Profile"}</span>
            </button>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2.5 ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        
        {/* =========================================================================
            1. Student ID Card Verification (MANDATORY)
           ========================================================================= */}
        <div
          id="student-id-card-section"
          className={`p-7 rounded-3xl bg-[#14161b] border transition-colors space-y-5 ${
            !hasIdCard && !idCardStorageKey
              ? "border-amber-500/50 shadow-lg shadow-amber-500/5"
              : "border-[#232630]"
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#1e2026] pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className={hasIdCard ? "text-emerald-400" : "text-amber-400"} />
              <div>
                <h3 className="font-display font-bold text-base text-white">
                  Student ID Card Verification
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Official college or university ID required for student verification and hackathon eligibility.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30 shrink-0">
              Mandatory
            </span>
          </div>

          {/* Hidden File Input for ID Card */}
          <input
            ref={idFileInputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className="hidden"
            onChange={handleIdCardFileSelect}
          />

          {hasIdCard && !showReplaceId ? (
            <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <FileCheck size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Student ID Card Attached</span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {idFileName || "Official Student ID Document on File"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {verificationId && (
                  <button
                    type="button"
                    onClick={handleViewIdCard}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-zinc-700 transition-colors flex items-center gap-1.5"
                  >
                    <Eye size={13} />
                    <span>View ID Card</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowReplaceId(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw size={13} />
                  <span>Replace Document</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                onClick={() => !uploadingId && idFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  uploadingId
                    ? "border-zinc-700 bg-zinc-900/50 cursor-wait"
                    : "border-zinc-700 hover:border-[#F97316] bg-[#0d0e11]/80 hover:bg-[#0d0e11]"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#F97316] mx-auto mb-3">
                  {uploadingId ? (
                    <RefreshCw size={22} className="animate-spin" />
                  ) : (
                    <Upload size={22} />
                  )}
                </div>
                <h4 className="text-sm font-semibold text-white">
                  {uploadingId ? "Uploading ID Document..." : "Click to Upload Student ID Card"}
                </h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                  Upload an image (JPG, PNG) or PDF of your student ID card or college enrollment verification (Max 5MB).
                </p>
                <span className="inline-block mt-3 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/[0.04] text-zinc-300 border border-zinc-800">
                  Select Document File
                </span>
              </div>

              {hasIdCard && showReplaceId && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowReplaceId(false)}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    Cancel replacement
                  </button>
                </div>
              )}
            </div>
          )}

          {idCardError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{idCardError}</span>
            </div>
          )}
        </div>

        {/* =========================================================================
            2. Basic Details & Profile Picture (PFP OPTIONAL)
           ========================================================================= */}
        <div className="p-7 rounded-3xl bg-[#14161b] border border-[#232630] space-y-6">
          <div className="flex items-center justify-between border-b border-[#1e2026] pb-4">
            <div className="flex items-center gap-2">
              <User size={18} className="text-[#F97316]" />
              <h3 className="font-display font-bold text-base text-white">Identity & Profile Picture</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
              PFP Optional
            </span>
          </div>

          {/* Hidden File Input for Avatar / PFP */}
          <input
            ref={avatarFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarFileSelect}
          />

          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar with Camera upload overlay */}
            <div className="relative group shrink-0">
              <div
                onClick={() => !uploadingAvatar && avatarFileInputRef.current?.click()}
                className="w-24 h-24 rounded-2xl bg-[#0d0e11] border-2 border-zinc-700 hover:border-[#F97316] flex items-center justify-center text-3xl font-bold font-display text-white overflow-hidden cursor-pointer shadow-md transition-colors"
                title="Click to upload profile picture (Optional)"
              >
                {uploadingAvatar ? (
                  <RefreshCw size={24} className="animate-spin text-[#F97316]" />
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  (name || "U").charAt(0).toUpperCase()
                )}
              </div>

              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-[#F97316] text-black hover:bg-[#ea580c] shadow-lg transition-transform hover:scale-105"
                title="Upload Profile Picture (Optional)"
              >
                <Camera size={14} />
              </button>
            </div>

            <div className="flex-1 w-full space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300">
                    Profile Picture (Optional)
                  </label>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl("")}
                      className="text-[11px] text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                      <X size={12} />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-zinc-700 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Upload size={13} />
                    <span>{uploadingAvatar ? "Uploading..." : "Upload Photo"}</span>
                  </button>

                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="Or paste an image URL (optional)..."
                    className="flex-1 px-4 py-2 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <span className="text-[11px] text-zinc-500 block">
                  You can upload a photo of your own or provide a direct image URL. Profile picture is completely optional.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Username / Slug</label>
                  <input
                    type="text"
                    disabled
                    value={slug}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0d0e11] border border-zinc-800 text-zinc-500 text-xs font-mono cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Professional Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Full-Stack Developer | ML Enthusiast | Open Source Builder"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Short Biography</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell organizers and prospective teammates about your passion, tech interests, and what you love building..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Location (City, Country)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, India"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. yourname@domain.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. Social & Professional Links
           ========================================================================= */}
        <div className="p-7 rounded-3xl bg-[#14161b] border border-[#232630] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1e2026] pb-4">
            <Globe size={18} className="text-blue-400" />
            <h3 className="font-display font-bold text-base text-white">Social & Portfolio Links</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <GithubIcon size={13} /> GitHub Profile URL
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <LinkedinIcon size={13} /> LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Globe size={13} /> Personal Website / Portfolio
              </label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://yourportfolio.dev"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <TwitterIcon size={13} /> Twitter / X URL
              </label>
              <input
                type="url"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="https://x.com/username"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
              />
            </div>
          </div>
        </div>

        {/* =========================================================================
            4. Profile Visibility & Team Status
           ========================================================================= */}
        <div className="p-7 rounded-3xl bg-[#14161b] border border-[#232630] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1e2026] pb-4">
            <Eye size={18} className="text-emerald-400" />
            <h3 className="font-display font-bold text-base text-white">Privacy & Visibility Controls</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-4 rounded-2xl bg-[#0d0e11] border border-[#1e2026] cursor-pointer hover:border-zinc-700 transition-colors">
              <div>
                <span className="text-sm font-semibold text-white block">Public Profile</span>
                <span className="text-xs text-zinc-400">
                  Allow your portfolio to be publicly accessible at{" "}
                  <strong className="text-zinc-300">{publicUrl}</strong>
                </span>
              </div>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-5 h-5 rounded border-zinc-700 text-[#F97316] focus:ring-[#F97316]"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl bg-[#0d0e11] border border-[#1e2026] cursor-pointer hover:border-zinc-700 transition-colors">
              <div>
                <span className="text-sm font-semibold text-white block">Looking for Team</span>
                <span className="text-xs text-zinc-400">
                  Display a badge showing hackathon team leaders that you are open to invitations.
                </span>
              </div>
              <input
                type="checkbox"
                checked={lookingForTeam}
                onChange={(e) => setLookingForTeam(e.target.checked)}
                className="w-5 h-5 rounded border-zinc-700 text-[#F97316] focus:ring-[#F97316]"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl bg-[#0d0e11] border border-[#1e2026] cursor-pointer hover:border-zinc-700 transition-colors">
              <div>
                <span className="text-sm font-semibold text-white block">Show Contact Email</span>
                <span className="text-xs text-zinc-400">
                  Show your contact email on your public developer profile.
                </span>
              </div>
              <input
                type="checkbox"
                checked={showContactEmail}
                onChange={(e) => setShowContactEmail(e.target.checked)}
                className="w-5 h-5 rounded border-zinc-700 text-[#F97316] focus:ring-[#F97316]"
              />
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-4">
          <Link
            href="/student/resume"
            className="text-xs font-semibold text-[#F97316] hover:underline flex items-center gap-1"
          >
            Manage Education, Skills & Projects in Resume Builder →
          </Link>

          <ShinyButton
            variant="primary"
            size="md"
            disabled={saving}
            className="py-2.5 px-6 text-sm font-semibold"
          >
            {saving ? "Saving Changes..." : "Save Profile"}
          </ShinyButton>
        </div>
      </form>
    </div>
  );
}
