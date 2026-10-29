import { describe, it, expect } from "vitest";
import { AdminService } from "@/server/modules/admin/admin.service";
import { AuthUser } from "@/server/policies/policy";

describe("Admin Dashboard Metrics Service", () => {
  const superAdminUser: AuthUser = {
    id: "admin-test-id",
    email: "admin@nexora.app",
    platformRole: "SUPER_ADMIN",
    status: "ACTIVE",
    emailVerified: true,
    orgMemberships: [],
    staffRoles: [],
  };

  it("fetches live aggregated dashboard metrics and real hackathons", async () => {
    const data = await AdminService.getDashboardStats(superAdminUser);

    expect(data).toBeDefined();
    expect(data.stats).toBeDefined();
    expect(data.stats.totalHackathons).toBeGreaterThanOrEqual(4);
    expect(data.stats.totalOrganizations).toBeGreaterThanOrEqual(8);
    expect(data.stats.totalRegistrations).toBeGreaterThanOrEqual(100);
    expect(data.stats.totalTeams).toBeGreaterThanOrEqual(20);
    expect(data.stats.totalSubmissions).toBeGreaterThanOrEqual(10);

    expect(Array.isArray(data.hackathons)).toBe(true);
    expect(data.hackathons.length).toBeGreaterThan(0);
    const firstHack = data.hackathons[0];
    expect(firstHack).toHaveProperty("title");
    expect(firstHack).toHaveProperty("registrations");
    expect(firstHack).toHaveProperty("teams");
    expect(firstHack).toHaveProperty("submissions");

    expect(Array.isArray(data.registrationsByHackathon)).toBe(true);
    expect(Array.isArray(data.deadlines)).toBe(true);
    expect(Array.isArray(data.activities)).toBe(true);
  });
});

