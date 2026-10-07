import { describe, it, expect, beforeEach } from "vitest";
import { can, AuthUser } from "../server/policies/policy";

describe("Policy Tests", () => {
  it("user from org A cannot read or modify org B's resources", () => {
    const userA: AuthUser = {
      id: "u1",
      email: "a@a.com",
      platformRole: "USER",
      emailVerified: true,
      status: "ACTIVE",
    };

    // User A is an OWNER of Org A
    const canUpdateOrgA = can(userA, "org:update", { orgRole: "OWNER" });
    expect(canUpdateOrgA).toBe(true);

    // User A has no role in Org B (orgRole is undefined/null)
    const canUpdateOrgB = can(userA, "org:update", { orgRole: undefined });
    expect(canUpdateOrgB).toBe(false);

    const canReadOrgB = can(userA, "org:read", { orgRole: undefined });
    expect(canReadOrgB).toBe(false);
  });
});
