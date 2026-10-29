import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET as getUsersHandler } from "@/app/api/v1/admin/users/route";
import { GET as getRolesHandler } from "@/app/api/v1/admin/roles/route";
import { GET as getSupportHandler } from "@/app/api/v1/admin/support/route";
import { GET as getHackathonsHandler } from "@/app/api/v1/admin/hackathons/route";
import { db } from "@/server/lib/db";
import { signAccessToken } from "@/server/modules/auth/tokens";

describe("Admin Route Handlers for Users, Roles, Support", () => {
  it("executes GET /api/v1/admin/users, /roles, /support, /hackathons successfully", async () => {
    const admin = await db.user.findFirst({
      where: { platformRole: "SUPER_ADMIN" },
    });
    expect(admin).toBeDefined();

    const token = await signAccessToken({
      userId: admin!.id,
      email: admin!.email,
      platformRole: "SUPER_ADMIN",
    });

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // 1. Test GET /admin/users
    const reqUsers = new NextRequest("http://localhost:3000/api/v1/admin/users", {
      method: "GET",
      headers,
    });
    const resUsers = await getUsersHandler(reqUsers);
    expect(resUsers.status).toBe(200);
    const usersBody = await resUsers.json();
    expect(Array.isArray(usersBody)).toBe(true);

    // 2. Test GET /admin/roles
    const reqRoles = new NextRequest("http://localhost:3000/api/v1/admin/roles", {
      method: "GET",
      headers,
    });
    const resRoles = await getRolesHandler(reqRoles);
    expect(resRoles.status).toBe(200);
    const rolesBody = await resRoles.json();
    expect(rolesBody.roles).toBeDefined();
    expect(rolesBody.permissions).toBeDefined();
    expect(rolesBody.systemPermissions).toBeDefined();

    // 3. Test GET /admin/support
    const reqSupport = new NextRequest("http://localhost:3000/api/v1/admin/support", {
      method: "GET",
      headers,
    });
    const resSupport = await getSupportHandler(reqSupport);
    expect(resSupport.status).toBe(200);
    const supportBody = await resSupport.json();
    expect(supportBody.recentUsers).toBeDefined();
    expect(supportBody.suspendedUsers).toBeDefined();

    // 4. Test GET /admin/hackathons
    const reqHacks = new NextRequest("http://localhost:3000/api/v1/admin/hackathons", {
      method: "GET",
      headers,
    });
    const resHacks = await getHackathonsHandler(reqHacks);
    expect(resHacks.status).toBe(200);
  });

  it("performs full CRUD for Users as Super Admin", async () => {
    const admin = await db.user.findFirst({
      where: { platformRole: "SUPER_ADMIN" },
    });
    const token = await signAccessToken({
      userId: admin!.id,
      email: admin!.email,
      platformRole: "SUPER_ADMIN",
    });

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // 1. CREATE USER
    const testEmail = `crud_user_${Date.now()}@example.com`;
    const { POST: createUserHandler } = await import("@/app/api/v1/admin/users/route");
    const reqCreate = new NextRequest("http://localhost:3000/api/v1/admin/users", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "CRUD Test User",
        email: testEmail,
        password: "Password123!",
        platformRole: "USER",
        status: "ACTIVE",
      }),
    });
    const resCreate = await createUserHandler(reqCreate);
    expect(resCreate.status).toBe(201);
    const createdUser = await resCreate.json();
    expect(createdUser.id).toBeDefined();
    expect(createdUser.email).toBe(testEmail);

    // 2. UPDATE USER
    const { PATCH: updateUserHandler, DELETE: deleteUserHandler } = await import(
      "@/app/api/v1/admin/users/[id]/route"
    );
    const reqUpdate = new NextRequest(
      `http://localhost:3000/api/v1/admin/users/${createdUser.id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          name: "Updated CRUD User",
          headline: "Lead Architect",
        }),
      }
    );
    const resUpdate = await updateUserHandler(reqUpdate, {
      params: Promise.resolve({ id: createdUser.id }),
    } as any);
    expect(resUpdate.status).toBe(200);
    const updatedUser = await resUpdate.json();
    expect(updatedUser.name).toBe("Updated CRUD User");

    // 3. DELETE USER
    const reqDelete = new NextRequest(
      `http://localhost:3000/api/v1/admin/users/${createdUser.id}`,
      {
        method: "DELETE",
        headers,
      }
    );
    const resDelete = await deleteUserHandler(reqDelete, {
      params: Promise.resolve({ id: createdUser.id }),
    } as any);
    expect(resDelete.status).toBe(200);

    const checkDb = await db.user.findUnique({ where: { id: createdUser.id } });
    expect(checkDb).toBeNull();
  });

  it("performs full CRUD for Hackathons as Super Admin", async () => {
    const admin = await db.user.findFirst({
      where: { platformRole: "SUPER_ADMIN" },
    });
    const org = await db.organization.findFirst();
    expect(org).toBeDefined();

    const token = await signAccessToken({
      userId: admin!.id,
      email: admin!.email,
      platformRole: "SUPER_ADMIN",
    });

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // 1. CREATE HACKATHON
    const { POST: createHackathonHandler } = await import(
      "@/app/api/v1/admin/hackathons/route"
    );
    const reqCreate = new NextRequest(
      "http://localhost:3000/api/v1/admin/hackathons",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: `CRUD Hackathon ${Date.now()}`,
          organizationId: org!.id,
          tagline: "Building autonomous systems",
          mode: "ONLINE",
          startsAt: new Date(Date.now() + 86400000).toISOString(),
          endsAt: new Date(Date.now() + 86400000 * 3).toISOString(),
          maxTeamSize: 4,
        }),
      }
    );
    const resCreate = await createHackathonHandler(reqCreate);
    expect(resCreate.status).toBe(201);
    const createdHackathon = await resCreate.json();
    expect(createdHackathon.id).toBeDefined();

    // 2. UPDATE HACKATHON
    const { PATCH: updateHackathonHandler, DELETE: deleteHackathonHandler } =
      await import("@/app/api/v1/admin/hackathons/[id]/route");
    const reqUpdate = new NextRequest(
      `http://localhost:3000/api/v1/admin/hackathons/${createdHackathon.id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status: "PUBLISHED",
          tagline: "Updated Tagline",
        }),
      }
    );
    const resUpdate = await updateHackathonHandler(reqUpdate, {
      params: Promise.resolve({ id: createdHackathon.id }),
    } as any);
    expect(resUpdate.status).toBe(200);
    const updatedHackathon = await resUpdate.json();
    expect(updatedHackathon.status).toBe("PUBLISHED");

    // 3. DELETE HACKATHON
    const reqDelete = new NextRequest(
      `http://localhost:3000/api/v1/admin/hackathons/${createdHackathon.id}`,
      {
        method: "DELETE",
        headers,
      }
    );
    const resDelete = await deleteHackathonHandler(reqDelete, {
      params: Promise.resolve({ id: createdHackathon.id }),
    } as any);
    expect(resDelete.status).toBe(200);

    const checkDb = await db.hackathon.findUnique({
      where: { id: createdHackathon.id },
    });
    expect(checkDb).toBeNull();
  });
});
