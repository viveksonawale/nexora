"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { ShieldCheck, XCircle, Ban, ArrowRight, Building, Award, Calendar, Hash } from "lucide-react";

interface VerificationResult {
  valid: boolean;
  status?: "VALID" | "REVOKED" | "NOT_FOUND" | "PENDING";
  holder?: string;
  hackathon?: string;
  college?: string;
  type?: string;
  certificateId?: string;
  issuedAt?: string;
  revokedAt?: string;
  revocationReason?: string;
}

export default function CertificateVerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/certificates/verify/${code}`)
      .then((data: any) => setResult(data))
      .catch(() => setResult({ valid: false, status: "NOT_FOUND" }))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <LoadingState message="Verifying certificate authenticity..." />;

  const status = result?.status || (result?.valid ? "VALID" : "NOT_FOUND");

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full rounded-3xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 shadow-xl text-center space-y-6">
        {status === "VALID" && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck size={36} />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-2">
                VERIFIED CREDENTIAL
              </span>
              <h1 className="text-2xl font-display font-bold text-[var(--text-primary)]">
                Authentic Certificate
              </h1>
              {result?.certificateId && (
                <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">
                  ID: {result.certificateId}
                </p>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border)] text-left space-y-3.5">
              <div>
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                  Certificate Holder
                </span>
                <span className="font-display font-bold text-base text-[var(--text-primary)]">
                  {result?.holder || "Participant"}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                  Hackathon Event
                </span>
                <span className="font-medium text-sm text-[var(--text-primary)]">
                  {result?.hackathon}
                </span>
              </div>

              {result?.college && (
                <div>
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Host Institution / College
                  </span>
                  <span className="font-medium text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                    <Building size={14} className="text-[#EA580C]" />
                    {result.college}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                <div>
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Type
                  </span>
                  <span className="font-medium text-xs text-[#EA580C] font-mono">
                    {result?.type || "PARTICIPATION"}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Issued Date
                  </span>
                  <span className="font-mono text-xs text-[var(--text-secondary)]">
                    {result?.issuedAt ? new Date(result.issuedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }) : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              This digital certificate was officially issued and verified through the Nexora platform.
            </p>
          </>
        )}

        {status === "REVOKED" && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto shadow-sm">
              <Ban size={36} />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-2">
                REVOKED CREDENTIAL
              </span>
              <h1 className="text-2xl font-display font-bold text-[var(--text-primary)]">
                Certificate Revoked
              </h1>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">
                Code: {code}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border)] text-left space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                  Original Holder
                </span>
                <span className="font-display font-bold text-base text-[var(--text-primary)]">
                  {result?.holder || "Participant"}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                  Hackathon
                </span>
                <span className="font-medium text-sm text-[var(--text-primary)]">
                  {result?.hackathon}
                </span>
              </div>

              {result?.college && (
                <div>
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                    College / Organization
                  </span>
                  <span className="font-medium text-sm text-[var(--text-primary)]">
                    {result.college}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-[var(--border)] text-xs text-red-400">
                <span className="font-semibold block text-[11px] uppercase">Revocation Note</span>
                <span>{result?.revocationReason || "Revoked by event administrator."}</span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              This certificate has been officially withdrawn and is no longer recognized as valid.
            </p>
          </>
        )}

        {status === "NOT_FOUND" && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center mx-auto shadow-sm">
              <XCircle size={36} />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-500/10 text-red-500 border border-red-500/20 mb-2">
                NOT FOUND
              </span>
              <h1 className="text-2xl font-display font-bold text-[var(--text-primary)]">
                Certificate Not Found
              </h1>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">
                Identifier: {code}
              </p>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              We could not find an authentic certificate record matching this identifier. Please verify the code or QR link and try again.
            </p>
          </>
        )}

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[var(--bg-canvas)] border border-[var(--border)] hover:border-[#EA580C]/50 text-[var(--text-primary)] transition-colors"
          >
            <span>Back to Nexora Home</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
