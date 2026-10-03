import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { z } from "zod";
import {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  AddMemberSchema,
  UpdateMemberRoleSchema,
} from "./organization.schemas";
import { slugify } from "@/server/utils/slugify";
import { AuthUser, can } from "@/server/policies/policy";
import { OrgRole, OrganizationStatus } from "@prisma/client";

export class OrganizationService {
  /**
   * Apply for a new organization.
   */
  static async createOrganization(user: AuthUser, data: z.infer<typeof CreateOrganizationSchema>) {
    if (!can(user, "org:create")) {
      throw AppError.forbidden("You must verify your email to create an organization.");
    }

    let slug = slugify(data.name);
    // ensure unique slug
    let counter = 1;
    while (await db.organization.findUnique({ where: { slug } })) {
      slug = `${slugify(data.name)}-${counter++}`;
    }

    const org = await db.organization.create({
      data: {
        name: data.name,
        slug,
        type: data.type,
        city: data.city,
        country: data.country,
        description: data.description,
        allowedEmailDomains: data.allowedEmailDomains,
        status: OrganizationStatus.PENDING,
        members: {
          create: {
            userId: user.id,
            role: OrgRole.OWNER,
          },
        },
      },
    });

    return org;
  }

  /**
   * Get organization by slug (Public view).
   */
  static async getOrganizationBySlug(slug: string) {
    const org = await db.organization.findUnique({
      where: { slug },
      include: {
        hackathons: {
          where: { status: "PUBLISHED" }, // Or whatever logic you prefer
          orderBy: { startsAt: "asc" },
        },
      },
    });

    if (!org) {
      throw AppError.notFound("Organization not found.");
    }

    return org;
  }

  /**
   * Update organization details.
   */
  static async updateOrganization(
    user: AuthUser,
    orgId: string,
    data: z.infer<typeof UpdateOrganizationSchema>
  ) {
    const membership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
    });

    if (!can(user, "org:update", { orgRole: membership?.role })) {
      throw AppError.forbidden("You do not have permission to update this organization.");
    }

    const org = await db.organization.update({
      where: { id: orgId },
      data,
    });

    return org;
  }

  /**
   * List members of an organization.
   */
  static async getOrganizationMembers(user: AuthUser, orgId: string) {
    const membership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
    });

    if (!can(user, "org:read", { orgRole: membership?.role })) {
      throw AppError.forbidden("You do not have permission to view members.");
    }

    const members = await db.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return members;
  }

  /**
   * Add a member to the organization by email.
   */
  static async addMember(user: AuthUser, orgId: string, data: z.infer<typeof AddMemberSchema>) {
    const requesterMembership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
    });

    if (!can(user, "org:manage_members", { orgRole: requesterMembership?.role })) {
      throw AppError.forbidden("You do not have permission to manage members.");
    }

    const targetUser = await db.user.findUnique({ where: { email: data.email } });
    if (!targetUser) {
      throw AppError.notFound("User with this email not found.");
    }

    const existingMembership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: targetUser.id } },
    });

    if (existingMembership) {
      throw AppError.badRequest("User is already a member of this organization.");
    }

    const member = await db.organizationMember.create({
      data: {
        organizationId: orgId,
        userId: targetUser.id,
        role: data.role,
      },
    });

    return member;
  }

  /**
   * Update a member's role.
   */
  static async updateMemberRole(
    user: AuthUser,
    orgId: string,
    targetUserId: string,
    data: z.infer<typeof UpdateMemberRoleSchema>
  ) {
    const requesterMembership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
    });

    if (!can(user, "org:manage_members", { orgRole: requesterMembership?.role })) {
      throw AppError.forbidden("You do not have permission to manage members.");
    }

    // Check if we are demoting the last owner
    if (data.role !== OrgRole.OWNER) {
      const targetMembership = await db.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId: orgId, userId: targetUserId } },
      });
      if (targetMembership?.role === OrgRole.OWNER) {
        const ownerCount = await db.organizationMember.count({
          where: { organizationId: orgId, role: OrgRole.OWNER },
        });
        if (ownerCount <= 1) {
          throw AppError.badRequest("Cannot demote the last owner of the organization.");
        }
      }
    }

    const member = await db.organizationMember.update({
      where: { organizationId_userId: { organizationId: orgId, userId: targetUserId } },
      data: { role: data.role },
    });

    return member;
  }

  /**
   * Remove a member from the organization.
   */
  static async removeMember(user: AuthUser, orgId: string, targetUserId: string) {
    const requesterMembership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
    });

    if (!can(user, "org:manage_members", { orgRole: requesterMembership?.role })) {
      throw AppError.forbidden("You do not have permission to manage members.");
    }

    const targetMembership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: targetUserId } },
    });

    if (!targetMembership) {
      throw AppError.notFound("Member not found in this organization.");
    }

    // Cannot remove the last owner
    if (targetMembership.role === OrgRole.OWNER) {
      const ownerCount = await db.organizationMember.count({
        where: { organizationId: orgId, role: OrgRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw AppError.badRequest("Cannot remove the last owner of the organization.");
      }
    }

    await db.organizationMember.delete({
      where: { organizationId_userId: { organizationId: orgId, userId: targetUserId } },
    });

    return { success: true };
  }

  /**
   * Get organizations for the logged-in user.
   */
  static async getUserOrganizations(user: AuthUser) {
    const memberships = await db.organizationMember.findMany({
      where: { userId: user.id },
      include: {
        organization: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map(m => ({
      ...m.organization,
      myRole: m.role,
    }));
  }
}
