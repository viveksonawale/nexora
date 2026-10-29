import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { AuthUser } from "@/server/policies/policy";
import { z } from "zod";
import {
  CreateTeamSchema,
  UpdateTeamSchema,
  QueryTeamsSchema,
  JoinTeamSchema,
  InviteMemberSchema,
  TransferLeadershipSchema,
} from "./team.schemas";
import { randomBytes } from "crypto";
import { HackathonStatus } from "@prisma/client";
import { HackathonLifecycle } from "@/server/modules/hackathon/hackathon-lifecycle";
import { queueEmail } from "@/server/modules/email/email.service";

export class TeamService {
  /**
   * Helper to ensure hackathon submission deadline hasn't passed
   */
  private static async ensureNotLocked(hackathonId: string) {
    const isCuid = hackathonId.length >= 24;
    const hackathon = await db.hackathon.findFirst({
      where: isCuid ? { id: hackathonId } : { slug: hackathonId },
    });
    if (!hackathon) throw AppError.notFound("Hackathon not found");

    HackathonLifecycle.assertState(
      hackathon.status,
      [
        HackathonStatus.REGISTRATION_OPEN,
        HackathonStatus.REGISTRATION_CLOSED,
        HackathonStatus.LIVE,
        HackathonStatus.PUBLISHED,
      ],
      "Team Modification"
    );

    if (hackathon.submissionDeadline && new Date() > hackathon.submissionDeadline) {
      throw AppError.conflict("Team modifications are locked after the submission deadline.");
    }
    return hackathon;
  }

  private static generateInviteCode() {
    return randomBytes(4).toString("hex").toUpperCase();
  }

  static async createTeam(user: AuthUser, hackathonId: string, data: z.infer<typeof CreateTeamSchema>) {
    const hackathon = await this.ensureNotLocked(hackathonId);
    const resolvedHackathonId = hackathon.id;

    // Verify registration
    const reg = await db.registration.findUnique({
      where: { hackathonId_userId: { hackathonId: resolvedHackathonId, userId: user.id } },
      include: { teamMember: true },
    });

    if (!reg || reg.status !== "APPROVED") {
      throw AppError.businessRule("INVALID_STATE", "You must have an APPROVED registration to create a team.");
    }
    if (reg.teamMember) {
      throw AppError.businessRule("ALREADY_IN_TEAM", "You are already in a team.");
    }

    const existingName = await db.team.findUnique({
      where: { hackathonId_name: { hackathonId: resolvedHackathonId, name: data.name } },
    });
    if (existingName) {
      throw AppError.conflict("A team with this name already exists in this hackathon.");
    }

    const inviteCode = this.generateInviteCode();

    return db.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          hackathonId: resolvedHackathonId,
          leaderId: user.id,
          name: data.name,
          description: data.description,
          lookingForMembers: data.lookingForMembers,
          lookingForSkills: data.lookingForSkills,
          inviteCode,
          members: {
            create: {
              registrationId: reg.id,
              role: "LEADER",
            },
          },
        },
        include: {
          members: true,
        },
      });
      return team;
    });
  }

  static async getTeams(user: AuthUser, hackathonId: string, query: z.infer<typeof QueryTeamsSchema>) {
    const isCuid = hackathonId.length >= 24;
    const hackathon = await db.hackathon.findFirst({
      where: isCuid ? { id: hackathonId } : { slug: hackathonId },
      select: { id: true, organizationId: true },
    });
    if (!hackathon) throw AppError.notFound("Hackathon not found");
    const resolvedHackathonId = hackathon.id;

    // Allow if registered participant, super admin, or org member of this hackathon
    const isSuperAdmin = user.platformRole === "SUPER_ADMIN";
    let isStaffOrOrg = false;
    if (!isSuperAdmin) {
      const membership = await db.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId: hackathon.organizationId, userId: user.id } },
      });
      if (membership) isStaffOrOrg = true;
    }

    if (!isSuperAdmin && !isStaffOrOrg) {
      const reg = await db.registration.findUnique({
        where: { hackathonId_userId: { hackathonId: resolvedHackathonId, userId: user.id } },
      });
      if (!reg) throw AppError.forbidden("Must be registered or staff to browse teams.");
    }

    const where: any = { hackathonId: resolvedHackathonId };
    if (query.lookingForMembers === "true") where.lookingForMembers = true;
    if (query.lookingForMembers === "false") where.lookingForMembers = false;
    if (query.skill) where.lookingForSkills = { has: query.skill };

    return db.team.findMany({
      where,
      include: {
        leader: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getTeam(user: AuthUser, id: string) {
    const team = await db.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            registration: {
              include: { user: { select: { id: true, name: true, profile: { select: { avatarUrl: true, headline: true } } } } },
            },
          },
        },
      },
    });
    if (!team) throw AppError.notFound("Team not found");

    const isMember = team.members.some(m => m.registration.user.id === user.id);
    
    // Hide invite code if not a member
    if (!isMember) {
      (team as any).inviteCode = undefined;
    }

    return team;
  }

  static async updateTeam(user: AuthUser, id: string, data: z.infer<typeof UpdateTeamSchema>) {
    const team = await db.team.findUnique({ where: { id } });
    if (!team) throw AppError.notFound("Team not found");
    if (team.leaderId !== user.id) throw AppError.forbidden("Only the leader can update the team.");

    await this.ensureNotLocked(team.hackathonId);

    if (data.name && data.name !== team.name) {
      const existingName = await db.team.findUnique({
        where: { hackathonId_name: { hackathonId: team.hackathonId, name: data.name } },
      });
      if (existingName) throw AppError.conflict("Team name already exists.");
    }

    return db.team.update({ where: { id }, data });
  }

  static async deleteTeam(user: AuthUser, id: string) {
    const team = await db.team.findUnique({ where: { id }, include: { submission: true } });
    if (!team) throw AppError.notFound("Team not found");
    if (team.leaderId !== user.id) throw AppError.forbidden("Only the leader can delete the team.");

    await this.ensureNotLocked(team.hackathonId);

    if (team.submission && team.submission.status !== "DRAFT") {
      throw AppError.businessRule("INVALID_STATE", "Cannot delete a team after a submission has been made.");
    }

    await db.team.delete({ where: { id } });
    return { success: true };
  }

  static async joinWithCode(user: AuthUser, data: z.infer<typeof JoinTeamSchema>) {
    const team = await db.team.findUnique({ where: { inviteCode: data.inviteCode } });
    if (!team) throw AppError.notFound("Invalid invite code");

    const hackathon = await this.ensureNotLocked(team.hackathonId);

    const reg = await db.registration.findUnique({
      where: { hackathonId_userId: { hackathonId: team.hackathonId, userId: user.id } },
      include: { teamMember: true },
    });

    if (!reg || reg.status !== "APPROVED") {
      throw AppError.businessRule("INVALID_STATE", "You must have an APPROVED registration to join a team.");
    }
    if (reg.teamMember) {
      throw AppError.businessRule("ALREADY_IN_TEAM", "You are already in a team.");
    }

    const maxAllowedSize = Math.min(hackathon.maxTeamSize || 4, 4);
    const memberCount = await db.teamMember.count({ where: { teamId: team.id } });
    if (memberCount >= maxAllowedSize) {
      throw AppError.conflict("This team is already full (maximum 4 members).");
    }

    const member = await db.teamMember.create({
      data: {
        hackathonId: team.hackathonId,
        teamId: team.id,
        registrationId: reg.id,
        role: "MEMBER",
      },
    });

    try {
      const leader = await db.user.findUnique({ where: { id: team.leaderId }, select: { email: true } });
      if (leader) {
        await queueEmail({
          toEmail: leader.email,
          template: "notification",
          payload: {
            subject: `New member joined ${team.name}`,
            message: `A new member has joined your team: ${team.name}.`,
          },
        });
      }
    } catch {
      // Best effort notification
    }

    return member;
  }

  static async leaveTeam(user: AuthUser, id: string) {
    const team = await db.team.findUnique({ where: { id } });
    if (!team) throw AppError.notFound("Team not found");
    
    await this.ensureNotLocked(team.hackathonId);

    if (team.leaderId === user.id) {
      throw AppError.businessRule("INVALID_STATE", "Leader cannot leave the team. Transfer leadership or delete the team.");
    }

    const reg = await db.registration.findUnique({
      where: { hackathonId_userId: { hackathonId: team.hackathonId, userId: user.id } },
      include: { teamMember: true },
    });

    if (!reg?.teamMember || reg.teamMember.teamId !== id) {
      throw AppError.notFound("You are not a member of this team.");
    }

    await db.teamMember.delete({ where: { id: reg.teamMember.id } });
    return { success: true };
  }

  static async removeMember(user: AuthUser, teamId: string, targetUserId: string) {
    const team = await db.team.findUnique({ where: { id: teamId } });
    if (!team) throw AppError.notFound("Team not found");
    if (team.leaderId !== user.id) throw AppError.forbidden("Only the leader can remove members.");
    if (user.id === targetUserId) throw AppError.businessRule("INVALID_STATE", "Cannot remove yourself.");

    await this.ensureNotLocked(team.hackathonId);

    const reg = await db.registration.findUnique({
      where: { hackathonId_userId: { hackathonId: team.hackathonId, userId: targetUserId } },
      include: { teamMember: true },
    });

    if (!reg?.teamMember || reg.teamMember.teamId !== teamId) {
      throw AppError.notFound("User is not a member of this team.");
    }

    await db.teamMember.delete({ where: { id: reg.teamMember.id } });
    return { success: true };
  }

  static async transferLeadership(user: AuthUser, teamId: string, data: z.infer<typeof TransferLeadershipSchema>) {
    const team = await db.team.findUnique({ where: { id: teamId } });
    if (!team) throw AppError.notFound("Team not found");
    if (team.leaderId !== user.id) throw AppError.forbidden("Only the leader can transfer leadership.");
    if (user.id === data.userId) throw AppError.businessRule("INVALID_STATE", "You are already the leader.");

    await this.ensureNotLocked(team.hackathonId);

    const targetReg = await db.registration.findUnique({
      where: { hackathonId_userId: { hackathonId: team.hackathonId, userId: data.userId } },
      include: { teamMember: true },
    });

    if (!targetReg?.teamMember || targetReg.teamMember.teamId !== teamId) {
      throw AppError.notFound("Target user is not a member of this team.");
    }

    return db.$transaction(async (tx) => {
      // Demote current leader
      const currentReg = await tx.registration.findUnique({
        where: { hackathonId_userId: { hackathonId: team.hackathonId, userId: user.id } },
        include: { teamMember: true },
      });
      if (currentReg?.teamMember) {
        await tx.teamMember.update({ where: { id: currentReg.teamMember.id }, data: { role: "MEMBER" } });
      }

      // Promote new leader
      await tx.teamMember.update({ where: { id: targetReg!.teamMember!.id }, data: { role: "LEADER" } });
      
      return tx.team.update({ where: { id: teamId }, data: { leaderId: data.userId } });
    });
  }

  static async rotateCode(user: AuthUser, teamId: string) {
    const team = await db.team.findUnique({ where: { id: teamId } });
    if (!team) throw AppError.notFound("Team not found");
    if (team.leaderId !== user.id) throw AppError.forbidden("Only the leader can rotate the invite code.");

    return db.team.update({
      where: { id: teamId },
      data: { inviteCode: this.generateInviteCode() },
    });
  }

  static async inviteMember(user: AuthUser, teamId: string, data: z.infer<typeof InviteMemberSchema>) {
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        _count: { select: { members: true } },
        hackathon: { select: { id: true, title: true, maxTeamSize: true } }
      }
    });
    if (!team) throw AppError.notFound("Team not found");
    if (team.leaderId !== user.id) throw AppError.forbidden("Only the leader can invite members.");

    const hackathon = await this.ensureNotLocked(team.hackathonId);
    if (team._count.members >= hackathon.maxTeamSize) throw AppError.businessRule("TEAM_FULL", "Team is full.");

    // Case 1: Shareable link generation
    if (data.isShareLink) {
      const token = randomBytes(24).toString("hex");
      return db.teamInvite.create({
        data: {
          teamId,
          invitedById: user.id,
          invitedUserId: null,
          email: null,
          tokenHash: token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    let targetUserId = data.userId;
    let targetEmail = data.email;

    if (!targetUserId && targetEmail) {
      const u = await db.user.findUnique({ where: { email: targetEmail } });
      if (u) {
        targetUserId = u.id;
        targetEmail = undefined;
      }
    }

    if (targetUserId && targetUserId === user.id) {
      throw AppError.businessRule("INVALID_STATE", "You cannot invite yourself.");
    }

    if (targetUserId) {
      const existing = await db.teamMember.findFirst({
        where: { teamId, registration: { userId: targetUserId } },
      });
      if (existing) throw AppError.businessRule("ALREADY_IN_TEAM", "User is already in the team.");

      // Check if user already in another team in this hackathon
      const otherTeam = await db.teamMember.findFirst({
        where: { hackathonId: team.hackathonId, registration: { userId: targetUserId } },
      });
      if (otherTeam) throw AppError.businessRule("ALREADY_IN_TEAM", "User is already in another team for this hackathon.");
    }

    // Check duplicate active pending invite
    const existingInvite = await db.teamInvite.findFirst({
      where: {
        teamId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
        OR: [
          ...(targetUserId ? [{ invitedUserId: targetUserId }] : []),
          ...(targetEmail ? [{ email: targetEmail }] : []),
        ],
      },
    });
    if (existingInvite) {
      throw AppError.conflict("An active invitation has already been sent to this user.");
    }

    const invite = await db.teamInvite.create({
      data: {
        teamId,
        invitedById: user.id,
        invitedUserId: targetUserId,
        email: targetEmail,
        tokenHash: randomBytes(16).toString("hex"),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Notify recipient in-app
    if (targetUserId) {
      try {
        await db.notification.create({
          data: {
            userId: targetUserId,
            type: "TEAM_INVITATION",
            title: "New Team Invitation",
            body: `${user.name || "A team leader"} invited you to join "${team.name}" for ${team.hackathon.title}.`,
            data: {
              teamId: team.id,
              teamName: team.name,
              hackathonId: team.hackathon.id,
              hackathonTitle: team.hackathon.title,
              inviteId: invite.id,
              token: invite.tokenHash,
              inviterId: user.id,
              inviterName: user.name || "Team Leader",
            },
          },
        });
      } catch {
        // Best effort notification
      }
    }

    return invite;
  }

  static async createInviteLink(user: AuthUser, teamId: string) {
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        _count: { select: { members: true } },
        hackathon: { select: { maxTeamSize: true } }
      }
    });
    if (!team) throw AppError.notFound("Team not found");
    if (team.leaderId !== user.id) throw AppError.forbidden("Only the leader can generate invitation links.");

    const hackathon = await this.ensureNotLocked(team.hackathonId);
    if (team._count.members >= hackathon.maxTeamSize) throw AppError.businessRule("TEAM_FULL", "Team is full.");

    const token = randomBytes(24).toString("hex");
    return db.teamInvite.create({
      data: {
        teamId,
        invitedById: user.id,
        invitedUserId: null,
        email: null,
        tokenHash: token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  static async resendInvite(user: AuthUser, inviteId: string) {
    const invite = await db.teamInvite.findUnique({
      where: { id: inviteId },
      include: { team: { select: { id: true, name: true, leaderId: true, hackathonId: true } } }
    });
    if (!invite) throw AppError.notFound("Invite not found.");
    if (invite.team.leaderId !== user.id) throw AppError.forbidden("Only leader can resend invites.");

    await this.ensureNotLocked(invite.team.hackathonId);

    const updated = await db.teamInvite.update({
      where: { id: inviteId },
      data: {
        status: "PENDING",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      },
      include: {
        team: { select: { name: true, hackathon: { select: { title: true } } } }
      }
    });

    if (updated.invitedUserId) {
      try {
        await db.notification.create({
          data: {
            userId: updated.invitedUserId,
            type: "TEAM_INVITATION",
            title: "Team Invitation Reminder",
            body: `${user.name || "A team leader"} resent you an invitation to join "${updated.team.name}".`,
            data: {
              teamId: updated.teamId,
              inviteId: updated.id,
              token: updated.tokenHash,
            }
          }
        });
      } catch {
        // Best effort
      }
    }

    return updated;
  }

  static async getInviteByToken(user: AuthUser | null, token: string) {
    const invite = await db.teamInvite.findUnique({
      where: { tokenHash: token },
      include: {
        team: {
          include: {
            leader: {
              select: {
                id: true,
                name: true,
                profile: { select: { avatarUrl: true, headline: true } }
              }
            },
            members: {
              include: {
                registration: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        profile: { select: { avatarUrl: true, headline: true } }
                      }
                    }
                  }
                }
              }
            },
            hackathon: {
              select: {
                id: true,
                title: true,
                slug: true,
                bannerUrl: true,
                mode: true,
                status: true,
                startsAt: true,
                endsAt: true,
                submissionDeadline: true,
                minTeamSize: true,
                maxTeamSize: true,
                requireApproval: true,
              }
            }
          }
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            profile: { select: { avatarUrl: true, headline: true } }
          }
        }
      }
    });

    if (!invite) {
      return {
        valid: false,
        error: "INVALID_TOKEN",
        message: "This invitation link is invalid or does not exist.",
      };
    }

    const isExpired = invite.status === "PENDING" && new Date() > invite.expiresAt;
    const currentStatus = isExpired ? "EXPIRED" : invite.status;

    if (currentStatus === "REVOKED") {
      return {
        valid: false,
        status: "REVOKED",
        error: "REVOKED",
        message: "This invitation has been revoked by the team leader.",
        teamName: invite.team.name,
        hackathonTitle: invite.team.hackathon.title,
      };
    }

    if (currentStatus === "DECLINED") {
      return {
        valid: false,
        status: "DECLINED",
        error: "DECLINED",
        message: "This invitation was previously declined.",
        teamName: invite.team.name,
        hackathonTitle: invite.team.hackathon.title,
      };
    }

    if (currentStatus === "EXPIRED") {
      return {
        valid: false,
        status: "EXPIRED",
        error: "EXPIRED",
        message: "This invitation has expired.",
        teamName: invite.team.name,
        hackathonTitle: invite.team.hackathon.title,
      };
    }

    if (currentStatus === "ACCEPTED" && invite.invitedUserId) {
      return {
        valid: false,
        status: "ACCEPTED",
        error: "ALREADY_ACCEPTED",
        message: "This invitation has already been accepted.",
        teamName: invite.team.name,
        hackathonTitle: invite.team.hackathon.title,
      };
    }

    const memberCount = invite.team.members.length;
    const maxTeamSize = invite.team.hackathon.maxTeamSize || 4;
    const isTeamFull = memberCount >= maxTeamSize;

    let userStatus = {
      isAuthenticated: !!user,
      isRegistered: false,
      registrationStatus: null as string | null,
      isAlreadyMember: false,
      isAlreadyInAnotherTeam: false,
      canAccept: false,
      reason: "" as string,
    };

    if (user) {
      const reg = await db.registration.findUnique({
        where: { hackathonId_userId: { hackathonId: invite.team.hackathonId, userId: user.id } },
        include: { teamMember: true },
      });

      if (!reg) {
        userStatus.isRegistered = false;
        userStatus.canAccept = false;
        userStatus.reason = "REGISTRATION_REQUIRED";
      } else {
        userStatus.isRegistered = true;
        userStatus.registrationStatus = reg.status;

        if (reg.status !== "APPROVED") {
          userStatus.canAccept = false;
          userStatus.reason = "REGISTRATION_PENDING";
        } else if (reg.teamMember) {
          if (reg.teamMember.teamId === invite.teamId) {
            userStatus.isAlreadyMember = true;
            userStatus.canAccept = false;
            userStatus.reason = "ALREADY_MEMBER";
          } else {
            userStatus.isAlreadyInAnotherTeam = true;
            userStatus.canAccept = false;
            userStatus.reason = "IN_OTHER_TEAM";
          }
        } else if (isTeamFull) {
          userStatus.canAccept = false;
          userStatus.reason = "TEAM_FULL";
        } else {
          userStatus.canAccept = true;
        }
      }
    }

    return {
      valid: true,
      invite: {
        id: invite.id,
        token: invite.tokenHash,
        status: currentStatus,
        expiresAt: invite.expiresAt,
        invitedBy: invite.invitedBy,
      },
      team: {
        id: invite.team.id,
        name: invite.team.name,
        description: invite.team.description,
        leader: invite.team.leader,
        memberCount,
        maxTeamSize,
        isFull: isTeamFull,
        members: invite.team.members.map(m => ({
          id: m.id,
          role: m.role,
          user: m.registration.user,
        })),
      },
      hackathon: invite.team.hackathon,
      userStatus,
    };
  }

  static async acceptInviteByToken(user: AuthUser, token: string) {
    const invite = await db.teamInvite.findUnique({
      where: { tokenHash: token },
      include: { team: true },
    });
    if (!invite) throw AppError.notFound("Invitation not found or invalid token.");

    if (invite.status === "REVOKED") {
      throw AppError.businessRule("INVALID_STATE", "This invitation has been revoked by the team leader.");
    }
    if (invite.status === "DECLINED") {
      throw AppError.businessRule("INVALID_STATE", "This invitation was declined.");
    }
    if (invite.status === "ACCEPTED" && invite.invitedUserId) {
      throw AppError.businessRule("INVALID_STATE", "This invitation has already been accepted.");
    }
    if (new Date() > invite.expiresAt) {
      throw AppError.businessRule("INVALID_STATE", "This invitation has expired.");
    }

    if (invite.invitedUserId && invite.invitedUserId !== user.id) {
      throw AppError.forbidden("This invitation was sent to a different user.");
    }
    if (!invite.invitedUserId && invite.email && invite.email !== user.email) {
      throw AppError.forbidden("This invitation was sent to a different email address.");
    }

    const hackathon = await this.ensureNotLocked(invite.team.hackathonId);

    const reg = await db.registration.findUnique({
      where: { hackathonId_userId: { hackathonId: invite.team.hackathonId, userId: user.id } },
      include: { teamMember: true },
    });

    if (!reg || reg.status !== "APPROVED") {
      throw AppError.businessRule("INVALID_STATE", "You must have an APPROVED registration for this hackathon to join a team.");
    }
    if (reg.teamMember) {
      if (reg.teamMember.teamId === invite.teamId) {
        throw AppError.businessRule("ALREADY_IN_TEAM", "You are already a member of this team.");
      }
      throw AppError.businessRule("ALREADY_IN_TEAM", "You are already a member of another team in this hackathon.");
    }

    return db.$transaction(async (tx) => {
      const memberCount = await tx.teamMember.count({ where: { teamId: invite.teamId } });
      if (memberCount >= hackathon.maxTeamSize) {
        throw AppError.businessRule("TEAM_FULL", "This team has reached its maximum capacity.");
      }

      await tx.teamInvite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED", invitedUserId: user.id },
      });

      const member = await tx.teamMember.create({
        data: {
          hackathonId: invite.team.hackathonId,
          teamId: invite.teamId,
          registrationId: reg.id,
          role: "MEMBER",
        },
        include: {
          team: { select: { id: true, name: true } },
        }
      });

      try {
        await tx.notification.create({
          data: {
            userId: invite.team.leaderId,
            type: "TEAM_INVITATION_ACCEPTED",
            title: "Team Invitation Accepted",
            body: `${user.name || "A new member"} accepted the invitation to join ${invite.team.name}.`,
            data: {
              teamId: invite.teamId,
              teamName: invite.team.name,
              hackathonId: invite.team.hackathonId,
              userId: user.id,
              userName: user.name || "A new member",
            }
          }
        });
      } catch {
        // Best effort
      }

      return member;
    });
  }

  static async declineInviteByToken(user: AuthUser, token: string) {
    const invite = await db.teamInvite.findUnique({
      where: { tokenHash: token },
      include: { team: true },
    });
    if (!invite) throw AppError.notFound("Invitation not found or invalid token.");

    if (invite.status !== "PENDING") {
      throw AppError.businessRule("INVALID_STATE", "Invitation is no longer pending.");
    }

    if (invite.invitedUserId && invite.invitedUserId !== user.id) {
      throw AppError.forbidden("This invitation was sent to a different user.");
    }

    const updated = await db.teamInvite.update({
      where: { id: invite.id },
      data: { status: "DECLINED", invitedUserId: user.id },
    });

    try {
      await db.notification.create({
        data: {
          userId: invite.team.leaderId,
          type: "TEAM_INVITATION_DECLINED",
          title: "Team Invitation Declined",
          body: `${user.name || "A student"} declined the invitation to join ${invite.team.name}.`,
          data: {
            teamId: invite.teamId,
            teamName: invite.team.name,
            hackathonId: invite.team.hackathonId,
            userId: user.id,
            userName: user.name || "A student",
          }
        }
      });
    } catch {
      // Best effort
    }

    return updated;
  }

  static async searchCandidateUsers(user: AuthUser, hackathonId: string | undefined, query: string) {
    const cleanQ = query.trim();
    if (cleanQ.length === 0) return [];

    const users = await db.user.findMany({
      where: {
        status: "ACTIVE",
        id: { not: user.id },
        OR: [
          { name: { contains: cleanQ, mode: "insensitive" } },
          { email: { contains: cleanQ, mode: "insensitive" } },
          { profile: { slug: { contains: cleanQ, mode: "insensitive" } } },
        ],
      },
      take: 15,
      select: {
        id: true,
        name: true,
        email: true,
        profile: {
          select: {
            slug: true,
            avatarUrl: true,
            headline: true,
            education: {
              take: 1,
              select: { institution: true, degree: true },
              orderBy: { startYear: "desc" },
            },
          },
        },
        registrations: hackathonId ? {
          where: { hackathonId },
          include: {
            teamMember: {
              select: { id: true, teamId: true }
            }
          }
        } : false,
        receivedTeamInvites: hackathonId ? {
          where: {
            status: "PENDING",
            team: { hackathonId },
            expiresAt: { gt: new Date() }
          },
          select: { id: true, teamId: true }
        } : false,
      },
    });

    return users.map(u => {
      const reg = (u as any).registrations?.[0];
      const pendingInvite = (u as any).receivedTeamInvites?.[0];

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        slug: u.profile?.slug || null,
        avatarUrl: u.profile?.avatarUrl || null,
        headline: u.profile?.headline || null,
        college: u.profile?.education?.[0]?.institution || null,
        degree: u.profile?.education?.[0]?.degree || null,
        isRegistered: !!reg,
        registrationStatus: reg?.status || null,
        isAlreadyInTeam: !!reg?.teamMember,
        existingTeamId: reg?.teamMember?.teamId || null,
        hasPendingInvite: !!pendingInvite,
        pendingInviteTeamId: pendingInvite?.teamId || null,
      };
    });
  }

  static async getMyTeams(user: AuthUser) {
    const memberships = await db.teamMember.findMany({
      where: {
        registration: { userId: user.id }
      },
      include: {
        team: {
          include: {
            leader: {
              select: { id: true, name: true, profile: { select: { avatarUrl: true, headline: true } } }
            },
            members: {
              include: {
                registration: {
                  include: {
                    user: {
                      select: { id: true, name: true, profile: { select: { avatarUrl: true, headline: true } } }
                    }
                  }
                }
              }
            },
            hackathon: {
              select: {
                id: true,
                title: true,
                slug: true,
                bannerUrl: true,
                mode: true,
                status: true,
                startsAt: true,
                endsAt: true,
                submissionDeadline: true,
                minTeamSize: true,
                maxTeamSize: true,
              }
            },
            invites: {
              orderBy: { createdAt: "desc" },
              include: {
                invitedUser: {
                  select: { id: true, name: true, email: true, profile: { select: { avatarUrl: true } } }
                }
              }
            },
            submission: {
              select: {
                id: true,
                title: true,
                tagline: true,
                status: true,
                repoUrl: true,
                demoUrl: true,
                submittedAt: true,
              }
            }
          }
        }
      },
      orderBy: { joinedAt: "desc" }
    });

    return memberships.map(m => {
      const isLeader = m.team.leaderId === user.id;
      return {
        ...m.team,
        myRole: m.role,
        isLeader,
        joinedAt: m.joinedAt,
        invites: isLeader ? m.team.invites : [],
      };
    });
  }

  static async getTeamInvitesForTeam(user: AuthUser, teamId: string) {
    const team = await db.team.findUnique({ where: { id: teamId } });
    if (!team) throw AppError.notFound("Team not found");
    if (team.leaderId !== user.id) throw AppError.forbidden("Only the leader can view team invitations.");

    return db.teamInvite.findMany({
      where: { teamId },
      include: {
        invitedUser: {
          select: { id: true, name: true, email: true, profile: { select: { avatarUrl: true, headline: true } } }
        },
        invitedBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getMyInvites(user: AuthUser, all = false) {
    const where: any = {
      OR: [
        { invitedUserId: user.id },
        { email: user.email },
      ],
    };

    if (!all) {
      where.status = "PENDING";
    }

    const invites = await db.teamInvite.findMany({
      where,
      include: {
        team: {
          include: {
            hackathon: {
              select: {
                id: true,
                title: true,
                slug: true,
                bannerUrl: true,
                status: true,
                startsAt: true,
                endsAt: true,
                submissionDeadline: true,
              }
            },
            leader: {
              select: { id: true, name: true, profile: { select: { avatarUrl: true, headline: true } } }
            },
            _count: { select: { members: true } }
          }
        },
        invitedBy: {
          select: { id: true, name: true, profile: { select: { avatarUrl: true, headline: true } } }
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return invites.map(inv => {
      const isExpired = inv.status === "PENDING" && new Date() > inv.expiresAt;
      return {
        ...inv,
        status: isExpired ? "EXPIRED" : inv.status,
      };
    });
  }

  static async acceptInvite(user: AuthUser, inviteId: string) {
    const invite = await db.teamInvite.findUnique({ where: { id: inviteId }, include: { team: true } });
    if (!invite || invite.status !== "PENDING") throw AppError.notFound("Invite not found or already processed.");
    
    if (invite.invitedUserId && invite.invitedUserId !== user.id) throw AppError.forbidden("Not your invite.");
    if (!invite.invitedUserId && invite.email && invite.email !== user.email) throw AppError.forbidden("Not your invite.");

    const hackathon = await this.ensureNotLocked(invite.team.hackathonId);

    const reg = await db.registration.findUnique({
      where: { hackathonId_userId: { hackathonId: invite.team.hackathonId, userId: user.id } },
      include: { teamMember: true },
    });

    if (!reg || reg.status !== "APPROVED") {
      throw AppError.businessRule("INVALID_STATE", "You must have an APPROVED registration to join a team.");
    }
    if (reg.teamMember) {
      throw AppError.businessRule("ALREADY_IN_TEAM", "You are already in a team.");
    }

    const memberCount = await db.teamMember.count({ where: { teamId: invite.teamId } });
    if (memberCount >= hackathon.maxTeamSize) {
      throw AppError.businessRule("TEAM_FULL", "Team is full.");
    }

    return db.$transaction(async (tx) => {
      await tx.teamInvite.update({ where: { id: inviteId }, data: { status: "ACCEPTED" } });
      const member = await tx.teamMember.create({
        data: {
          hackathonId: invite.team.hackathonId,
          teamId: invite.teamId,
          registrationId: reg.id,
          role: "MEMBER",
        },
      });

      try {
        await tx.notification.create({
          data: {
            userId: invite.team.leaderId,
            type: "TEAM_INVITATION_ACCEPTED",
            title: "Team Invitation Accepted",
            body: `${user.name || "A member"} accepted your invitation to join ${invite.team.name}.`,
            data: {
              teamId: invite.teamId,
              hackathonId: invite.team.hackathonId,
              userId: user.id,
            }
          }
        });
      } catch {
        // Best effort
      }

      return member;
    });
  }

  static async declineInvite(user: AuthUser, inviteId: string) {
    const invite = await db.teamInvite.findUnique({ where: { id: inviteId }, include: { team: true } });
    if (!invite || invite.status !== "PENDING") throw AppError.notFound("Invite not found or already processed.");

    if (invite.invitedUserId && invite.invitedUserId !== user.id) throw AppError.forbidden("Not your invite.");
    if (!invite.invitedUserId && invite.email && invite.email !== user.email) throw AppError.forbidden("Not your invite.");

    const updated = await db.teamInvite.update({ where: { id: inviteId }, data: { status: "DECLINED" } });

    try {
      await db.notification.create({
        data: {
          userId: invite.team.leaderId,
          type: "TEAM_INVITATION_DECLINED",
          title: "Team Invitation Declined",
          body: `${user.name || "A student"} declined the invitation to join ${invite.team.name}.`,
          data: {
            teamId: invite.teamId,
            hackathonId: invite.team.hackathonId,
            userId: user.id,
          }
        }
      });
    } catch {
      // Best effort
    }

    return updated;
  }

  static async revokeInvite(user: AuthUser, inviteId: string) {
    const invite = await db.teamInvite.findUnique({ where: { id: inviteId }, include: { team: true } });
    if (!invite) throw AppError.notFound("Invite not found.");
    if (invite.team.leaderId !== user.id) throw AppError.forbidden("Only leader can revoke invites.");

    await db.teamInvite.update({
      where: { id: inviteId },
      data: { status: "REVOKED" }
    });
    return { success: true };
  }
}
