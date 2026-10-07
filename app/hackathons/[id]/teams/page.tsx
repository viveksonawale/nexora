"use client";

import { use, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { LoadingState } from "@/components/shared/states";
import { ShinyButton } from "@/app/components/ShinyButton";
import Link from "next/link";
import { Users, Plus, Shield, LogOut } from "lucide-react";

function TeamsContent({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [myTeam, setMyTeam] = useState<any>(null);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      let reg: any = null;
      try {
        reg = await apiFetch(`/hackathons/${id}/registrations/me`);
        setRegistration(reg);
      } catch (err: any) {
        if (err.status === 404) {
          setRegistration(null);
        } else {
          throw err;
        }
      }

      if (reg && reg.status === "APPROVED") {
        if (reg.teamMember) {
          const teamData = await apiFetch(`/hackathons/${id}/teams/${reg.teamMember.teamId}`);
          setMyTeam(teamData);
        } else {
          const teamsData = await apiFetch(`/hackathons/${id}/teams`) as any[];
          setTeams(teamsData);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) return <LoadingState message="Loading teams..." />;
  if (error) return <div className="text-red-500">{error}</div>;

  if (!registration || registration.status !== "APPROVED") {
    return (
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-12 text-center space-y-6">
        <Users size={48} className="mx-auto text-[var(--text-secondary)]" />
        <h2 className="text-2xl font-display font-bold text-[var(--text-primary)]">Teams are for participants only</h2>
        <p className="text-[var(--text-secondary)] font-sans">
          {registration?.status === "PENDING"
            ? "Your registration is currently pending approval. Please check back later."
            : registration?.status === "WAITLISTED"
            ? "You are on the waitlist. If a spot opens up, you'll be able to join teams."
            : "You must be fully registered and approved to browse or join teams."}
        </p>
        {!registration && (
          <div className="pt-4 flex justify-center">
            <Link href={`/hackathons/${id}/register`}>
              <ShinyButton variant="primary">Register Now</ShinyButton>
            </Link>
          </div>
        )}
      </div>
    );
  }

  if (myTeam) {
    const isLeader = myTeam.leaderId === registration.userId;

    return (
      <div className="space-y-8">
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-display font-bold text-[var(--text-primary)]">{myTeam.name}</h2>
              <p className="text-[var(--text-secondary)] font-sans mt-1">{myTeam.description || "No description provided."}</p>
            </div>
            {isLeader && (
              <div className="px-4 py-2 bg-orange-500/10 text-orange-500 font-bold text-sm rounded-xl border border-orange-500/20 flex items-center gap-2">
                <Shield size={16} /> Team Leader
              </div>
            )}
          </div>

          {isLeader && (
            <div className="mb-8 p-4 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)]">Invite Code</div>
                <div className="text-xs text-[var(--text-secondary)]">Share this code with others to let them join.</div>
              </div>
              <div className="text-xl font-mono font-bold tracking-widest text-[#F97316] bg-[#F97316]/10 px-4 py-2 rounded-lg">
                {myTeam.inviteCode}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-display font-bold text-lg">Team Members</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myTeam.members.map((m: any) => (
                <div key={m.id} className="flex items-center gap-4 p-4 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl">
                  <img
                    src={m.registration.user.profile?.avatarUrl || `https://ui-avatars.com/api/?name=${m.registration.user.name}`}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover bg-[var(--border)]"
                  />
                  <div>
                    <div className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                      {m.registration.user.name}
                      {m.role === "LEADER" && <Shield size={14} className="text-orange-500" />}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">{m.registration.user.profile?.headline || "Hacker"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Link href={`/hackathons/${id}/submission`}>
            <ShinyButton variant="primary">Manage Submission</ShinyButton>
          </Link>
          {!isLeader && (
            <button
              className="px-6 py-3 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl font-bold font-sans transition-colors flex items-center gap-2"
              onClick={async () => {
                if (confirm("Leave this team?")) {
                  await apiFetch(`/hackathons/${id}/teams/${myTeam.id}/leave`, { method: "POST" });
                  fetchData();
                }
              }}
            >
              <LogOut size={18} /> Leave Team
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-[var(--text-primary)]">Find a Team</h2>
          <p className="text-[var(--text-secondary)] font-sans">Browse existing teams looking for members, or create your own.</p>
        </div>
        <Link href={`/hackathons/${id}/teams/create`}>
          <ShinyButton variant="primary" className="flex items-center gap-2">
            <Plus size={18} /> Create Team
          </ShinyButton>
        </Link>
      </div>

      <div className="p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl">
        <h3 className="font-display font-bold mb-4">Join with Code</h3>
        <form
          className="flex gap-4"
          onSubmit={async (e: any) => {
            e.preventDefault();
            try {
              await apiFetch(`/hackathons/${id}/teams/join`, {
                method: "POST",
                body: JSON.stringify({ inviteCode: e.target.code.value }),
              });
              fetchData();
            } catch (err: any) {
              alert(err.message || "Failed to join");
            }
          }}
        >
          <input
            name="code"
            type="text"
            required
            placeholder="Enter invite code..."
            className="flex-1 px-4 py-2 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500"
          />
          <button type="submit" className="px-6 py-2 bg-[var(--bg-canvas)] border border-[var(--border)] hover:border-orange-500 text-[var(--text-primary)] rounded-xl font-bold font-sans transition-colors">
            Join
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.length === 0 ? (
          <div className="col-span-full p-8 text-center border border-[var(--border)] border-dashed rounded-2xl text-[var(--text-secondary)]">
            No public teams available right now. Why not create one?
          </div>
        ) : (
          teams.map(team => (
            <div key={team.id} className="p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl">
              <h4 className="font-display font-bold text-lg text-[var(--text-primary)]">{team.name}</h4>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{team.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs font-bold text-[var(--text-secondary)] uppercase">
                  {team._count.members} Members
                </div>
                {/* Normally we wouldn't let them join without invite, but if public they could request to join, omitted for brevity */}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function TeamsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  return (
    <RequireAuth requireVerified={true}>
      <TeamsContent id={id} />
    </RequireAuth>
  );
}
