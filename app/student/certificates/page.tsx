"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { ShinyButton } from "@/app/components/ShinyButton";
import {
  Award,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Copy,
  Check,
  Printer,
  Download,
  Trophy,
  Sparkles,
} from "lucide-react";

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/me/certificates")
      .then((data: any) => {
        const list = Array.isArray(data)
          ? data
          : data?.data && Array.isArray(data.data)
          ? data.data
          : [];
        setCertificates(list);
      })
      .catch((err) => console.error("Failed to load certificates", err))
      .finally(() => setLoading(false));
  }, []);

  const handleCopyVerifyUrl = (code: string) => {
    const url = `${window.location.origin}/certificates/verify/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) return <LoadingState message="Loading your certificates..." />;

  const getBadgeForType = (type: string) => {
    switch (type) {
      case "WINNER":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Trophy size={13} /> WINNER CREDENTIAL
          </span>
        );
      case "PARTICIPATION":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck size={13} /> PARTICIPATION
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Award size={13} /> {type}
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
            Certificates & Verified Achievements
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Officially verified credentials cryptographically signed on the Nexora platform.
          </p>
        </div>

        <Link href="/hackathons">
          <ShinyButton variant="secondary" size="sm" className="gap-1.5 py-2 px-3 text-xs">
            <Trophy size={14} className="text-[#F97316]" />
            <span>Participate in More Events</span>
          </ShinyButton>
        </Link>
      </div>

      {certificates.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#14161b] border border-[#232630] space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Award size={28} />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-white">No Certificates Earned Yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 leading-relaxed">
              Complete hackathons and submit projects to earn authentic verified credentials, winner awards, and verifiable certificates.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/hackathons">
              <ShinyButton variant="primary" size="sm" className="py-2 px-4 text-xs">
                Explore Active Hackathons
              </ShinyButton>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {certificates.map((cert) => {
            const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/certificates/verify/${cert.verificationCode}`;

            return (
              <div
                key={cert.id}
                className="p-8 rounded-3xl bg-gradient-to-br from-[#16181d] to-[#121317] border border-[#232630] shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    {getBadgeForType(cert.type)}
                    <span className="text-[11px] font-mono text-zinc-400">
                      Code: <strong className="text-zinc-200">{cert.verificationCode}</strong>
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl font-display font-bold text-white">
                      {cert.hackathon?.title || "Hackathon Championship"}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Awarded for exemplary contribution and performance during the official event.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-zinc-400" />
                      Issued: {new Date(cert.issuedAt).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Verification & Action Buttons */}
                <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                  <a
                    href={`/api/v1/certificates/${cert.id}/download`}
                    download
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#F97316] hover:bg-orange-600 text-white shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={14} />
                    <span>Download PDF</span>
                  </a>

                  <Link
                    href={`/certificates/verify/${cert.verificationCode}`}
                    target="_blank"
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-white border border-zinc-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Verify Credential</span>
                    <ExternalLink size={13} />
                  </Link>

                  <button
                    onClick={() => handleCopyVerifyUrl(cert.verificationCode)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-orange-500/10 hover:bg-orange-500/20 text-[#F97316] border border-orange-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    {copiedCode === cert.verificationCode ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedCode === cert.verificationCode ? "Copied Link!" : "Copy Verification Link"}</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Printer size={13} />
                    <span>Print View</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

