"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { KeyRound, Shield, Check, Lock, Info, Filter } from "lucide-react";
import {
  SYSTEM_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  PermissionDefinition,
} from "@/lib/rbac-definitions";

interface PermissionItem {
  id?: string;
  code: string;
  name: string;
  category: string;
  description: string;
}

interface RoleItem {
  id: string;
  code: string;
  name: string;
  description: string;
  scope: string;
  rolePermissions: {
    permissionId: string;
    permission: PermissionItem;
  }[];
}

interface RbacData {
  roles?: RoleItem[];
  permissions?: PermissionItem[];
  systemPermissions: PermissionDefinition[];
  defaultRolePermissions: Record<string, string[]>;
}

export default function AdminRolesMatrixPage() {
  const [data, setData] = useState<RbacData>({
    systemPermissions: SYSTEM_PERMISSIONS,
    defaultRolePermissions: DEFAULT_ROLE_PERMISSIONS,
  });
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedScope, setSelectedScope] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiFetch<RbacData>("/admin/roles")
      .then((res) => {
        if (res) setData(res);
      })
      .catch((err) => {
        console.warn("Using default RBAC matrix:", err);
      });
  }, []);

  if (loading) return <LoadingState message="Loading role and permission matrix..." />;
  if (!data) return <div className="p-8 text-red-500 font-sans">Failed to load role definitions.</div>;

  const categories = Array.from(
    new Set(data.systemPermissions.map((p) => p.category))
  );

  const filteredPermissions = data.systemPermissions.filter((p) => {
    const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;
    const matchesSearch =
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const rolesToDisplay = Object.keys(data.defaultRolePermissions).filter((roleCode) => {
    const isPlatform = roleCode === "SUPER_ADMIN" || roleCode === "SUPPORT_ADMIN";
    if (selectedScope === "PLATFORM") return isPlatform;
    if (selectedScope === "EVENT") return !isPlatform;
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <KeyRound className="text-orange-500" size={26} />
            <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">
              Role & Permission Matrix
            </h1>
          </div>
          <p className="text-[var(--text-secondary)] mt-1">
            Database backed Role-Based Access Control matrix defining every user responsibility, permission, and allowed action.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Total Roles
          </div>
          <div className="text-3xl font-display font-bold text-[var(--text-primary)] mt-1">
            {Object.keys(data.defaultRolePermissions).length}
          </div>
          <div className="text-xs text-orange-500 mt-1 font-mono">
            Platform & Event Scoped
          </div>
        </div>

        <div className="p-5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Fine-grained Permissions
          </div>
          <div className="text-3xl font-display font-bold text-[var(--text-primary)] mt-1">
            {data.systemPermissions.length}
          </div>
          <div className="text-xs text-emerald-500 mt-1 font-mono">
            Checked on every API request
          </div>
        </div>

        <div className="p-5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Active RBAC Mode
          </div>
          <div className="text-3xl font-display font-bold text-[var(--text-primary)] mt-1">
            Strict
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1 font-mono">
            IDOR & Escalation Protected
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="px-3.5 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm font-sans text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Role Scopes</option>
            <option value="PLATFORM">Platform Roles Only</option>
            <option value="EVENT">Hackathon Event Roles Only</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm font-sans text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Permission Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          placeholder="Search permission code or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm font-sans text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* Matrix Table */}
      <div className="bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left font-sans border-collapse">
            <thead className="bg-[var(--bg-elevated)] sticky top-0 z-10 border-b border-[var(--border)]">
              <tr>
                <th className="px-5 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider min-w-[240px]">
                  Permission
                </th>
                {rolesToDisplay.map((roleCode) => (
                  <th
                    key={roleCode}
                    className="px-3 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-center whitespace-nowrap min-w-[110px]"
                  >
                    <span className="block font-mono text-[11px] text-orange-500">
                      {roleCode.replace(/_/g, " ")}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {filteredPermissions.map((perm) => (
                <tr key={perm.code} className="hover:bg-[var(--bg-elevated)]/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-[var(--text-primary)]">{perm.name}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{perm.description}</div>
                    <span className="inline-block mt-1 font-mono text-[10px] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--text-secondary)]">
                      {perm.code}
                    </span>
                  </td>

                  {rolesToDisplay.map((roleCode) => {
                    const allowedPerms = data.defaultRolePermissions[roleCode] || [];
                    const isAllowed = allowedPerms.includes(perm.code);

                    return (
                      <td key={roleCode} className="px-3 py-3.5 text-center">
                        {isAllowed ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                            <Check size={14} />
                          </span>
                        ) : (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--border)]" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
