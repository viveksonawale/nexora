"use client";

import { Award, ShieldCheck, Download, CheckCircle2, Search } from "lucide-react";

export default function AdminCertificatesPage() {
  const certificateTemplates = [
    {
      id: "1",
      name: "Global Winner Certificate",
      type: "First Place",
      hackathon: "Nexora 2026",
      issued: 3,
      status: "ACTIVE",
    },
    {
      id: "2",
      name: "Participant of Excellence",
      type: "Participation",
      hackathon: "IIT Delhi Hackathon",
      issued: 96,
      status: "ACTIVE",
    },
    {
      id: "3",
      name: "Track Specialist Award",
      type: "Track Winner",
      hackathon: "IIT Bombay Hackathon",
      issued: 8,
      status: "ACTIVE",
    },
  ];

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text-primary)] tracking-tight">
            Certificates & Credentials
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-sans">
            Cryptographically signed certificates of participation and winner credentials.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#F97316] text-white hover:bg-orange-600 transition-colors shadow-sm">
          <Award size={16} />
          <span>New Certificate Template</span>
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-[var(--bg-canvas)]/40 border-b border-[var(--border)] text-[var(--text-secondary)] font-medium text-[11px] uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">Certificate Name</th>
              <th className="px-6 py-4 font-semibold">Award Category</th>
              <th className="px-6 py-4 font-semibold">Hackathon</th>
              <th className="px-6 py-4 font-semibold">Issued Count</th>
              <th className="px-6 py-4 font-semibold">Signature Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {certificateTemplates.map((cert) => (
              <tr key={cert.id} className="hover:bg-[var(--bg-canvas)]/60 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                      <Award size={15} />
                    </div>
                    <span className="font-semibold text-[var(--text-primary)]">{cert.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-[var(--text-secondary)] font-medium">{cert.type}</td>
                <td className="px-6 py-4 font-medium text-[var(--text-primary)]">{cert.hackathon}</td>
                <td className="px-6 py-4 font-mono font-medium text-[var(--text-primary)]">{cert.issued}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <ShieldCheck size={12} />
                    ED25519 VERIFIED
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-[var(--text-secondary)] hover:text-[#F97316] p-1 rounded-md transition-colors">
                    <Download size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

