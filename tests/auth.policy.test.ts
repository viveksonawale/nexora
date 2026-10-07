import { describe, it, expect } from "vitest";
import { can, AuthUser } from "@/server/policies/policy";

describe("Policy Engine", () => {
  const activeUser: AuthUser = {
    id: "u1",
    email: "user@test.com",
    platformRole: "USER",
    emailVerified: true,
    status: "ACTIVE",
  };

  const unverifiedUser: AuthUser = {
    id: "u2",
    email: "unverified@test.com",
    platformRole: "USER",
    emailVerified: false,
    status: "ACTIVE",
  };

  const suspendedUser: AuthUser = {
    id: "u3",
    email: "suspended@test.com",
    platformRole: "USER",
    emailVerified: true,
    status: "SUSPENDED",
  };

  const superAdmin: AuthUser = {
    id: "u4",
    email: "admin@test.com",
    platformRole: "SUPER_ADMIN",
    emailVerified: true,
    status: "ACTIVE",
  };

  it("super admin can perform any action", () => {
    expect(can(superAdmin, "admin:access")).toBe(true);
    expect(can(superAdmin, "hackathon:create")).toBe(true);
    expect(can(superAdmin, "org:delete")).toBe(true);
  });

  it("suspended user is denied from everything", () => {
    expect(can(suspendedUser, "org:create")).toBe(false);
    expect(can(suspendedUser, "org:read")).toBe(false);
  });

  it("unverified user cannot create organizations", () => {
    expect(can(unverifiedUser, "org:create")).toBe(false);
    expect(can(activeUser, "org:create")).toBe(true);
  });

  it("enforces organization roles correctly", () => {
    expect(can(activeUser, "org:update", { orgRole: "OWNER" })).toBe(true);
    expect(can(activeUser, "org:update", { orgRole: "ADMIN" })).toBe(true);
    expect(can(activeUser, "org:update", { orgRole: "STAFF" })).toBe(false);
    expect(can(activeUser, "org:update", { orgRole: null })).toBe(false);

    expect(can(activeUser, "org:read", { orgRole: "STAFF" })).toBe(true);
  });

  it("enforces judge staff roles for scoring", () => {
    expect(can(activeUser, "hackathon:score", { staffRole: "JUDGE" })).toBe(true);
    expect(can(activeUser, "hackathon:score", { staffRole: "MENTOR" })).toBe(false);
    expect(can(activeUser, "hackathon:score", { staffRole: "VOLUNTEER" })).toBe(false);
  });
});
