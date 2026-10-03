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

export class TeamService {
  /**
   * Helper to ensure hackathon submission deadline hasn't passed
   */
  private static async ensureNotLocked(hackathonId: string) {
    const hackathon = await db.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw AppError.notFound("Hackathon not found");
    if (hackathon.submissionDeadline && new Date() > hackathon.submissionDeadline) {
      throw AppError.businessRule("TEAM_LOCKED", "Team modifications are locked after the submission deadline.");
    }
    return hackathon;
  }

  private static generateInviteCode() {
    return randomBytes(4).toString("hex").toUpperCase();
  }

  static async createTeam(user: AuthUser, hackathonId: string, data: z.infer<typeof CreateTeamSchema>) {
    const hackathon = await this.ensureNotLocked(hackathonId);

    // Verify registration
    const reg = await db.registration.findUnique({
      where: { hackathonId_userId: { hackathonId, userId: user.id } },
      include: { teamMember: true },
    });

    if (!reg || reg.status !== "APPROVED") {
      throw AppError.businessRule("INVALID_STATE", "You must have an APPROVED registration to create a team.");
    }
    if (reg.teamMember) {
      throw AppError.businessRule("ALREADY_IN_TEAM", "You are already in a team.");
    }

    const existingName = await db.team.findUnique({
      where: { hackathonId_name: { hackathonId, name: data.name } },
    });
    if (existingName) {
      throw AppError.conflict("A team with this name already exists in this hackathon.");
    }

    const inviteCode = this.generateInviteCode();

    return db.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          hackathonId,
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
      });
      return team;
    });
  }

  static async getTeams(user: AuthUser, hackathonId: string, query: z.infer<typeof QueryTeamsSchema>) {
    // Only registered users can browse teams usually
    const reg = await db.registration.findUnique({
      where: { hackathonId_userId: { hackathonId, userId: user.id } },
    });
    if (!reg) throw AppError.forbidden("Must be registered to browse teams.");

    const where: any = { hackathonId };
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

    const memberCount = await db.teamMember.count({ where: { teamId: team.id } });
    if (memberCount >= hackathon.maxTeamSize) {
      throw AppError.businessRule("TEAM_FULL", "This team is already full.");
    }

    return db.teamMember.create({
      data: {
        hackathonId: team.hackathonId,
        teamId: team.id,
        registrationId: reg.id,
        role: "MEMBER",
      },
    });
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
    const team = await db.team.findUnique({ where: { id: teamId }, include: { _count: { select: { members: true } } } });
    if (!team) throw AppError.notFound("Team not found");
    if (team.leaderId !== user.id) throw AppError.forbidden("Only the leader can invite members.");

    const hackathon = await this.ensureNotLocked(team.hackathonId);
    if (team._count.members >= hackathon.maxTeamSize) throw AppError.businessRule("TEAM_FULL", "Team is full.");

    let targetUserId = data.userId;
    let targetEmail = data.email;

    if (!targetUserId && targetEmail) {
      const u = await db.user.findUnique({ where: { email: targetEmail } });
      if (u) {
        targetUserId = u.id;
        targetEmail = undefined;
      }
    }

    if (targetUserId) {
      const existing = await db.teamMember.findFirst({
        where: { teamId, registration: { userId: targetUserId } },
      });
      if (existing) throw AppError.businessRule("ALREADY_IN_TEAM", "User is already in the team.");
    }

    return db.teamInvite.create({
      data: {
        teamId,
        invitedById: user.id,
        invitedUserId: targetUserId,
        email: targetEmail,
        tokenHash: require("crypto").randomBytes(16).toString("hex"),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  static async getMyInvites(user: AuthUser) {
    return db.teamInvite.findMany({
      where: {
        OR: [
          { invitedUserId: user.id },
          { email: user.email },
        ],
        status: "PENDING",
      },
      include: {
        team: { select: { name: true, hackathon: { select: { title: true } } } },
        invitedBy: { select: { name: true } },
      },
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
      return tx.teamMember.create({
        data: {
          hackathonId: invite.team.hackathonId,
          teamId: invite.teamId,
          registrationId: reg.id,
          role: "MEMBER",
        },
      });
    });
  }

  static async declineInvite(user: AuthUser, inviteId: string) {
    const invite = await db.teamInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.status !== "PENDING") throw AppError.notFound("Invite not found or already processed.");

    if (invite.invitedUserId && invite.invitedUserId !== user.id) throw AppError.forbidden("Not your invite.");
    if (!invite.invitedUserId && invite.email && invite.email !== user.email) throw AppError.forbidden("Not your invite.");

    return db.teamInvite.update({ where: { id: inviteId }, data: { status: "DECLINED" } });
  }

  static async revokeInvite(user: AuthUser, inviteId: string) {
    const invite = await db.teamInvite.findUnique({ where: { id: inviteId }, include: { team: true } });
    if (!invite) throw AppError.notFound("Invite not found.");
    if (invite.team.leaderId !== user.id) throw AppError.forbidden("Only leader can revoke invites.");

    await db.teamInvite.delete({ where: { id: inviteId } });
    return { success: true };
  }
}
