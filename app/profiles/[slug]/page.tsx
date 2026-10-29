"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import {
  User,
  Globe,
  MapPin,
  Mail,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Code2,
  Award,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Lock,
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

export default function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/profiles/${slug}`)
      .then((data: any) => setProfile(data))
      .catch((err: any) => {
        setError(err.message || "This profile is private or does not exist.");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingState message="Loading developer portfolio..." />;

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#0d0e11] text-zinc-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full rounded-3xl bg-[#14161b] border border-[#232630] p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
            <Lock size={28} />
          </div>
          <h2 className="text-xl font-display font-bold text-white">Profile Unavailable</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {error || "This profile is either set to private or does not exist."}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-zinc-700 transition-colors"
            >
              Back to Nexora Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const education = profile.education || [];
  const experiences = profile.experiences || [];
  const projects = profile.projects || [];
  const skills = profile.skills || [];
  const achievements = profile.achievements || [];

  return (
    <div className="min-h-screen bg-[#0d0e11] text-zinc-100 font-sans pb-16">
      {/* Top Banner / Navbar */}
      <header className="h-16 border-b border-[#1e2026] bg-[#111215]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-[#F97316] font-display font-bold flex items-center justify-center text-xs">
            N
          </div>
          <span className="font-display font-bold text-base text-white tracking-tight">Nexora</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/hackathons"
            className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Explore Hackathons
          </Link>
          <Link
            href="/?auth=signup"
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#F97316] hover:bg-orange-600 text-white transition-colors"
          >
            Create Your Profile
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 space-y-8">
        {/* Profile Identity Card */}
        <div className="p-8 rounded-3xl bg-[#14161b] border border-[#232630] shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-[#0d0e11] border border-zinc-700 flex items-center justify-center text-3xl font-bold font-display text-white overflow-hidden shrink-0 shadow-lg">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                (profile.name || "U").charAt(0).toUpperCase()
              )}
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                  {profile.name}
                </h1>
                <span className="text-xs font-mono text-zinc-500">@{profile.slug}</span>
                {profile.lookingForTeam && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Sparkles size={11} /> Open to Teams
                  </span>
                )}
              </div>

              {profile.headline && (
                <p className="text-sm font-medium text-[#F97316]">{profile.headline}</p>
              )}

              {profile.location && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <MapPin size={13} className="text-zinc-500" />
                  <span>{profile.location}</span>
                </div>
              )}
            </div>
          </div>

          {profile.bio && (
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mt-6 pt-6 border-t border-[#1e2026]">
              {profile.bio}
            </p>
          )}

          {/* Social Links */}
          <div className="flex flex-wrap items-center gap-3 pt-6 mt-6 border-t border-[#1e2026]">
            {profile.githubUrl && (
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-zinc-700 transition-colors flex items-center gap-2"
              >
                <GithubIcon size={13} />
                <span>GitHub</span>
              </a>
            )}

            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-zinc-700 transition-colors flex items-center gap-2"
              >
                <LinkedinIcon size={13} />
                <span>LinkedIn</span>
              </a>
            )}

            {profile.portfolioUrl && (
              <a
                href={profile.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-zinc-700 transition-colors flex items-center gap-2"
              >
                <Globe size={13} />
                <span>Portfolio</span>
              </a>
            )}

            {profile.twitterUrl && (
              <a
                href={profile.twitterUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-zinc-700 transition-colors flex items-center gap-2"
              >
                <TwitterIcon size={13} />
                <span>Twitter / X</span>
              </a>
            )}

            {profile.contactEmail && (
              <a
                href={`mailto:${profile.contactEmail}`}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-zinc-700 transition-colors flex items-center gap-2"
              >
                <Mail size={13} />
                <span>{profile.contactEmail}</span>
              </a>
            )}
          </div>
        </div>

        {/* Skills Section */}
        {skills.length > 0 && (
          <div className="p-7 rounded-3xl bg-[#14161b] border border-[#232630] space-y-4">
            <div className="flex items-center gap-2">
              <Code2 size={18} className="text-[#F97316]" />
              <h2 className="text-lg font-display font-bold text-white">Skills & Technologies</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((s: any, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0d0e11] border border-zinc-700 text-zinc-200"
                >
                  {s.skill?.name || s.name}
                  {s.level && (
                    <span className="ml-1.5 text-[10px] font-mono text-zinc-400 font-normal">
                      • {s.level.toLowerCase()}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Projects Section */}
        {projects.length > 0 && (
          <div className="p-7 rounded-3xl bg-[#14161b] border border-[#232630] space-y-4">
            <div className="flex items-center gap-2">
              <FolderGit2 size={18} className="text-blue-400" />
              <h2 className="text-lg font-display font-bold text-white">Projects</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj: any) => (
                <div
                  key={proj.id}
                  className="p-5 rounded-2xl bg-[#0d0e11] border border-[#1e2026] flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-base text-white">{proj.title}</h3>
                    <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                      {proj.description || "No project description provided."}
                    </p>

                    {proj.techStack && proj.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {proj.techStack.map((tech: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] text-zinc-300"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-[#1e2026]">
                    {proj.repoUrl && (
                      <a
                        href={proj.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1"
                      >
                        <GithubIcon size={13} />
                        <span>Source</span>
                      </a>
                    )}
                    {proj.liveUrl && (
                      <a
                        href={proj.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-[#F97316] hover:underline flex items-center gap-1"
                      >
                        <ExternalLink size={13} />
                        <span>Live Demo</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education & Experience */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {education.length > 0 && (
            <div className="p-7 rounded-3xl bg-[#14161b] border border-[#232630] space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap size={18} className="text-emerald-400" />
                <h2 className="text-lg font-display font-bold text-white">Education</h2>
              </div>

              <div className="space-y-4">
                {education.map((edu: any) => (
                  <div key={edu.id} className="space-y-1">
                    <h3 className="font-display font-bold text-sm text-white">{edu.institution}</h3>
                    <p className="text-xs text-[#F97316]">
                      {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                    </p>
                    <span className="text-[11px] font-mono text-zinc-500 block">
                      {edu.startYear} - {edu.isCurrent ? "Present" : edu.endYear || "Graduated"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {experiences.length > 0 && (
            <div className="p-7 rounded-3xl bg-[#14161b] border border-[#232630] space-y-4">
              <div className="flex items-center gap-2">
                <Briefcase size={18} className="text-amber-400" />
                <h2 className="text-lg font-display font-bold text-white">Experience</h2>
              </div>

              <div className="space-y-4">
                {experiences.map((exp: any) => (
                  <div key={exp.id} className="space-y-1">
                    <h3 className="font-display font-bold text-sm text-white">{exp.title}</h3>
                    <p className="text-xs text-amber-400">{exp.company}</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">{exp.description}</p>
                    <span className="text-[11px] font-mono text-zinc-500 block">
                      {new Date(exp.startDate).toLocaleDateString(undefined, {
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      -{" "}
                      {exp.isCurrent
                        ? "Present"
                        : exp.endDate
                        ? new Date(exp.endDate).toLocaleDateString(undefined, {
                            month: "short",
                            year: "numeric",
                          })
                        : "Past"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
