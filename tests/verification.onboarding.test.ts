import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/lib/db";
import { VerificationService } from "@/server/modules/verification/verification.service";
import { AuthUser } from "@/server/policies/policy";
import { AppError } from "@/server/lib/errors";
import { RequestedRole, OrgRole, OrganizationStatus, OnboardingStatus } from "@prisma/client";

describe("Verification & Onboarding Flow Integration Tests", () => {
  let collegeA: any;
  let collegeB: any;
  let collegeAdminA: AuthUser;
  let collegeAdminB: AuthUser;
  let studentUser: AuthUser;
  let organizerUser: AuthUser;
  let platformAdmin: AuthUser;

  beforeAll(async () => {
    // 1. Create two isolated colleges
    collegeA = await db.organization.create({
      data: {
        name: `College Alpha ${Date.now()}`,
        slug: `college-alpha-${Date.now()}`,
        type: "COLLEGE",
        status: OrganizationStatus.ACTIVE,
      },
    });

    collegeB = await db.organization.create({
      data: {
        name: `College Beta ${Date.now()}`,
        slug: `college-beta-${Date.now()}`,
        type: "COLLEGE",
        status: OrganizationStatus.ACTIVE,
      },
    });

    // 2. Create College Admin for College A
    const adminAUser = await db.user.create({
      data: {
        name: "Admin Alpha",
        email: `admin-alpha-${Date.now()}@collegea.edu`,
        platformRole: "USER",
        status: "ACTIVE",
      },
    });
    await db.organizationMember.create({
      data: {
        organizationId: collegeA.id,
        userId: adminAUser.id,
        role: OrgRole.OWNER,
      },
    });
    collegeAdminA = {
      id: adminAUser.id,
      email: adminAUser.email,
      platformRole: "USER",
      emailVerified: true,
      status: "ACTIVE",
    };

    // 3. Create College Admin for College B
    const adminBUser = await db.user.create({
      data: {
        name: "Admin Beta",
        email: `admin-beta-${Date.now()}@collegeb.edu`,
        platformRole: "USER",
        status: "ACTIVE",
      },
    });
    await db.organizationMember.create({
      data: {
        organizationId: collegeB.id,
        userId: adminBUser.id,
        role: OrgRole.OWNER,
      },
    });
    collegeAdminB = {
      id: adminBUser.id,
      email: adminBUser.email,
      platformRole: "USER",
      emailVerified: true,
      status: "ACTIVE",
    };

    // 4. Create Student User
    const student = await db.user.create({
      data: {
        name: "Student One",
        email: `student-${Date.now()}@test.com`,
        platformRole: "USER",
        status: "ACTIVE",
      },
    });
    studentUser = {
      id: student.id,
      email: student.email,
      platformRole: "USER",
      emailVerified: true,
      status: "ACTIVE",
    };

    // 5. Create Organizer User
    const organizer = await db.user.create({
      data: {
        name: "Organizer Applicant",
        email: `organizer-${Date.now()}@test.com`,
        platformRole: "USER",
        status: "ACTIVE",
      },
    });
    organizerUser = {
      id: organizer.id,
      email: organizer.email,
      platformRole: "USER",
      emailVerified: true,
      status: "ACTIVE",
    };

    // 6. Create Super Admin
    const superAdmin = await db.user.create({
      data: {
        name: "Platform Super Admin",
        email: `superadmin-${Date.now()}@nexora.app`,
        platformRole: "SUPER_ADMIN",
        status: "ACTIVE",
      },
    });
    platformAdmin = {
      id: superAdmin.id,
      email: superAdmin.email,
      platformRole: "SUPER_ADMIN",
      emailVerified: true,
      status: "ACTIVE",
    };
  });

  afterAll(async () => {
    try {
      await db.notification.deleteMany({
        where: { userId: { in: [studentUser.id, organizerUser.id, collegeAdminA.id, collegeAdminB.id, platformAdmin.id] } },
      });
      await db.verificationRequest.deleteMany({
        where: { userId: { in: [studentUser.id, organizerUser.id, collegeAdminA.id, collegeAdminB.id, platformAdmin.id] } },
      });
      await db.education.deleteMany({
        where: { profile: { userId: { in: [studentUser.id, organizerUser.id] } } },
      });
      await db.organizationMember.deleteMany({
        where: { organizationId: { in: [collegeA.id, collegeB.id] } },
      });
      await db.organization.deleteMany({ where: { id: { in: [collegeA.id, collegeB.id] } } });
      await db.user.deleteMany({ where: { id: { in: [studentUser.id, organizerUser.id, collegeAdminA.id, collegeAdminB.id, platformAdmin.id] } } });
    } catch {}
  });

  it("SUPER_ADMIN bypasses onboarding verification", async () => {
    await expect(
      VerificationService.submitRequest(platformAdmin, {
        role: RequestedRole.STUDENT,
        organizationId: collegeA.id,
        details: { fullName: "Super Admin", branch: "CS", year: "4th", rollNumber: "SA-01" },
        idCardStorageKey: "verifications/sa/id.jpg",
      })
    ).rejects.toThrow("Super Admin does not require verification");
  });

  it("Students are auto-verified immediately: no admin approval or pending queue needed", async () => {
    const req = await VerificationService.submitRequest(studentUser, {
      role: RequestedRole.STUDENT,
      organizationId: collegeA.id,
      details: {
        fullName: "Student One",
        branch: "Computer Science",
        year: "3rd Year",
        rollNumber: "21CS099",
      },
    });

    expect(req.status).toBe("APPROVED");
    expect(req.type).toBe("STUDENT");
    expect(req.organizationId).toBe(collegeA.id);

    // Verify user in DB has immediate VERIFIED standing
    const userInDb = await db.user.findUnique({ where: { id: studentUser.id } });
    expect(userInDb?.onboardingStatus).toBe(OnboardingStatus.VERIFIED);
    expect(userInDb?.requestedRole).toBe(RequestedRole.STUDENT);

    // Verify education record created automatically
    const profile = await db.profile.findUnique({
      where: { userId: studentUser.id },
      include: { education: true },
    });
    expect(profile?.education.length).toBeGreaterThan(0);
    expect(profile?.education[0].institution).toBe(collegeA.name);

    // Verify students are NOT in any admin pending queue
    const queue = await VerificationService.getPendingRequestsForReviewer(collegeAdminA, collegeA.id);
    expect(queue.some((r) => r.user.id === studentUser.id)).toBe(false);
  });

  it("College Organizer request creates PENDING request and notifies College Admin", async () => {
    const req = await VerificationService.submitRequest(organizerUser, {
      role: RequestedRole.COLLEGE_ORGANIZER,
      organizationId: collegeA.id,
      details: {
        fullName: "Organizer Applicant",
        designation: "Faculty Advisor",
        officialEmail: "advisor@collegea.edu",
      },
      idCardStorageKey: `verifications/${organizerUser.id}/faculty-id.jpg`,
    });

    expect(req.status).toBe("PENDING");
    expect(req.type).toBe("COLLEGE_ORGANIZER");

    // Verify user is in PENDING_VERIFICATION state
    const userInDb = await db.user.findUnique({ where: { id: organizerUser.id } });
    expect(userInDb?.onboardingStatus).toBe(OnboardingStatus.PENDING_VERIFICATION);

    // Verify Admin A received in-app Notification on bell icon
    const adminNotifications = await db.notification.findMany({
      where: { userId: collegeAdminA.id, type: "VERIFICATION_REQUEST" },
    });
    expect(adminNotifications.length).toBeGreaterThan(0);
    expect(adminNotifications[0].title).toContain("Organizer");
  });

  it("Cross-College Isolation: College Admin B cannot see College A's verification requests", async () => {
    // College Admin A sees Organizer's request for College A
    const queueA = await VerificationService.getPendingRequestsForReviewer(collegeAdminA, collegeA.id);
    expect(queueA.some((r) => r.user.id === organizerUser.id)).toBe(true);

    // College Admin B requesting queue for College A is strictly FORBIDDEN (403)
    await expect(
      VerificationService.getPendingRequestsForReviewer(collegeAdminB, collegeA.id)
    ).rejects.toThrow("You do not have permission to review verification requests for this college");

    // College Admin B looking at their own queue (College B) sees nothing from College A
    const queueB = await VerificationService.getPendingRequestsForReviewer(collegeAdminB, collegeB.id);
    expect(queueB.some((r) => r.user.id === organizerUser.id)).toBe(false);
  });

  it("Cross-College Isolation: College Admin B cannot review or approve College A's requests", async () => {
    const pendingReq = await db.verificationRequest.findFirst({
      where: { userId: organizerUser.id, status: "PENDING" },
    });
    expect(pendingReq).toBeDefined();

    await expect(
      VerificationService.reviewRequest(collegeAdminB, pendingReq!.id, { decision: "APPROVE" })
    ).rejects.toThrow("You do not have permission to review this verification request");
  });

  it("ID Card Security: Unauthorized user cannot read applicant's ID document", async () => {
    const pendingReq = await db.verificationRequest.findFirst({
      where: { userId: organizerUser.id, status: "PENDING" },
    });

    // College Admin B cannot get signed URL for College A organizer's ID
    await expect(
      VerificationService.getSignedIdCardUrl(collegeAdminB, pendingReq!.id)
    ).rejects.toThrow("Access denied: You are not authorized to view this document");

    // College Admin A CAN securely get the signed URL
    const docAccess = await VerificationService.getSignedIdCardUrl(collegeAdminA, pendingReq!.id);
    expect(docAccess.signedUrl).toBeDefined();
    expect(docAccess.expiresInSeconds).toBe(300);
  });

  it("College Admin A can approve Organizer; status becomes VERIFIED and added as staff", async () => {
    const pendingReq = await db.verificationRequest.findFirst({
      where: { userId: organizerUser.id, status: "PENDING" },
    });

    const approved = await VerificationService.reviewRequest(collegeAdminA, pendingReq!.id, {
      decision: "APPROVE",
    });

    expect(approved.status).toBe("APPROVED");

    const updatedUser = await db.user.findUnique({ where: { id: organizerUser.id } });
    expect(updatedUser?.onboardingStatus).toBe(OnboardingStatus.VERIFIED);

    // Membership in college organization granted as STAFF
    const membership = await db.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: collegeA.id,
          userId: organizerUser.id,
        },
      },
    });
    expect(membership?.role).toBe(OrgRole.STAFF);

    // Applicant received in-app approval notification
    const userNotifs = await db.notification.findMany({
      where: { userId: organizerUser.id, type: "VERIFICATION_APPROVED" },
    });
    expect(userNotifs.length).toBeGreaterThan(0);
  });

  it("Rejection flow: Reviewer rejection updates status to REJECTED, records reason and notifies user", async () => {
    // Create new test user for rejection testing
    const rejectedApplicant = await db.user.create({
      data: {
        name: "Applicant To Reject",
        email: `reject-test-${Date.now()}@test.com`,
        platformRole: "USER",
        status: "ACTIVE",
      },
    });

    const applicantAuth: AuthUser = {
      id: rejectedApplicant.id,
      email: rejectedApplicant.email,
      platformRole: "USER",
      emailVerified: true,
      status: "ACTIVE",
    };

    const req = await VerificationService.submitRequest(applicantAuth, {
      role: RequestedRole.COLLEGE_ORGANIZER,
      organizationId: collegeA.id,
      details: { fullName: "Applicant", designation: "Volunteer", officialEmail: "bad@test.com" },
      idCardStorageKey: `verifications/${rejectedApplicant.id}/blurry.jpg`,
    });

    // Reject with reason
    await VerificationService.reviewRequest(collegeAdminA, req.id, {
      decision: "REJECT",
      rejectionReason: "ID card image is blurry and illegible. Please resubmit with clear photo.",
    });

    const userStatus = await VerificationService.getMyStatus(applicantAuth);
    expect(userStatus.onboardingStatus).toBe(OnboardingStatus.REJECTED);
    expect(userStatus.request?.rejectionReason).toContain("blurry and illegible");

    // Verify rejection in-app notification received
    const notifs = await db.notification.findMany({
      where: { userId: rejectedApplicant.id, type: "VERIFICATION_REJECTED" },
    });
    expect(notifs.length).toBeGreaterThan(0);
    expect(notifs[0].body).toContain("blurry and illegible");

    // Clean up
    await db.notification.deleteMany({ where: { userId: rejectedApplicant.id } });
    await db.verificationRequest.deleteMany({ where: { userId: rejectedApplicant.id } });
    await db.user.delete({ where: { id: rejectedApplicant.id } });
  });
});
