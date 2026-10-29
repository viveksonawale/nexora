import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { AuthUser } from "@/server/policies/policy";
import {
  RequestedRole,
  VerificationStatus,
  OnboardingStatus,
  OrgRole,
  OrganizationStatus,
} from "@prisma/client";
import { z } from "zod";
import {
  SubmitVerificationSchema,
  ReviewVerificationSchema,
} from "./verification.schemas";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/server/lib/env";
import { queueEmail } from "@/server/modules/email/email.service";
import { slugify } from "@/server/utils/slugify";

let s3Client: S3Client | null = null;
function getS3(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

export class VerificationService {
  /**
   * Submit an onboarding verification request
   */
  static async submitRequest(user: AuthUser, input: z.infer<typeof SubmitVerificationSchema>) {
    if (user.platformRole === "SUPER_ADMIN") {
      throw AppError.businessRule("SUPER_ADMIN_EXEMPT", "Super Admin does not require verification.");
    }

    // Role-specific validation
    if (input.role === RequestedRole.STUDENT) {
      if (!input.organizationId) {
        throw AppError.badRequest("College selection is required for student verification.");
      }
      const org = await db.organization.findUnique({ where: { id: input.organizationId } });
      if (!org || org.status !== OrganizationStatus.ACTIVE) {
        throw AppError.badRequest("Selected college is not approved or active.");
      }
      if (!input.details.branch || !input.details.year || !input.details.rollNumber) {
        throw AppError.badRequest("Branch, Year, and Roll Number are required for students.");
      }

      // Auto-verify students immediately — no admin review needed!
      return await db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            name: input.details.fullName,
            onboardingStatus: OnboardingStatus.VERIFIED,
            requestedRole: RequestedRole.STUDENT,
          },
        });

        // Ensure profile is created/marked completed
        const profile = await tx.profile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            slug: `user-${user.id.slice(-6)}`,
            onboardingCompleted: true,
          },
          update: {
            onboardingCompleted: true,
          },
        });

        // Create education record immediately
        await tx.education.create({
          data: {
            profileId: profile.id,
            organizationId: input.organizationId || null,
            institution: org.name,
            fieldOfStudy: input.details.branch || "Computer Science",
            degree: input.details.year || "Undergraduate",
            startYear: new Date().getFullYear(),
            isCurrent: true,
          },
        });

        // Record verification as directly approved
        const existingReq = await tx.verificationRequest.findFirst({
          where: { userId: user.id },
        });

        if (existingReq) {
          return await tx.verificationRequest.update({
            where: { id: existingReq.id },
            data: {
              type: RequestedRole.STUDENT,
              status: VerificationStatus.APPROVED,
              organizationId: input.organizationId,
              details: input.details as any,
              idCardStorageKey: input.idCardStorageKey || null,
              reviewedAt: new Date(),
              rejectionReason: null,
            },
          });
        }

        return await tx.verificationRequest.create({
          data: {
            userId: user.id,
            type: RequestedRole.STUDENT,
            status: VerificationStatus.APPROVED,
            organizationId: input.organizationId,
            details: input.details as any,
            idCardStorageKey: input.idCardStorageKey || null,
            reviewedAt: new Date(),
          },
        });
      });
    } else if (input.role === RequestedRole.COLLEGE_ORGANIZER) {
      if (!input.organizationId && !input.newCollegeName) {
        throw AppError.badRequest("Please select an approved college or provide a new college name.");
      }
      if (!input.details.designation) {
        throw AppError.badRequest("Designation is required for organizers.");
      }
    } else if (input.role === RequestedRole.JUDGE) {
      if (!input.details.organization || !input.details.designation) {
        throw AppError.badRequest("Organization and Designation are required for judges.");
      }
    }

    if (!input.idCardStorageKey) {
      throw AppError.badRequest("Identification proof is required for role verification.");
    }

    // Create or update the pending verification request for admin review
    const existingPending = await db.verificationRequest.findFirst({
      where: { userId: user.id, status: VerificationStatus.PENDING },
    });

    let savedRequest;

    if (existingPending) {
      // Update existing pending request
      savedRequest = await db.verificationRequest.update({
        where: { id: existingPending.id },
        data: {
          type: input.role,
          organizationId: input.organizationId || null,
          details: input.details as any,
          idCardStorageKey: input.idCardStorageKey,
          rejectionReason: null,
          reviewedAt: null,
          reviewerId: null,
        },
      });

      await db.user.update({
        where: { id: user.id },
        data: {
          name: input.details.fullName,
          onboardingStatus: OnboardingStatus.PENDING_VERIFICATION,
          requestedRole: input.role,
        },
      });
    } else {
      savedRequest = await db.$transaction(async (tx) => {
        const req = await tx.verificationRequest.create({
          data: {
            userId: user.id,
            type: input.role,
            status: VerificationStatus.PENDING,
            organizationId: input.organizationId || null,
            details: input.details as any,
            idCardStorageKey: input.idCardStorageKey,
          },
        });

        await tx.user.update({
          where: { id: user.id },
          data: {
            name: input.details.fullName,
            onboardingStatus: OnboardingStatus.PENDING_VERIFICATION,
            requestedRole: input.role,
          },
        });

        await tx.profile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            slug: `user-${user.id.slice(-6)}`,
            onboardingCompleted: true,
          },
          update: {
            onboardingCompleted: true,
          },
        });

        return req;
      });
    }

    // Trigger in-app notifications for admins
    try {
      if (input.role === RequestedRole.COLLEGE_ORGANIZER && input.organizationId) {
        // Notify College Admins of this specific college
        const collegeAdmins = await db.organizationMember.findMany({
          where: {
            organizationId: input.organizationId,
            role: { in: [OrgRole.OWNER, OrgRole.ADMIN] },
          },
          select: { userId: true },
        });

        for (const admin of collegeAdmins) {
          await db.notification.create({
            data: {
              userId: admin.userId,
              type: "VERIFICATION_REQUEST",
              title: "New Organizer Verification Request",
              body: `${input.details.fullName} requested verification as College Organizer.`,
              data: {
                requestId: savedRequest.id,
                role: input.role,
                applicantName: input.details.fullName,
                organizationId: input.organizationId,
              },
            },
          });
        }
      } else {
        // Notify Platform Super Admins (for Judges or new college setup requests)
        const superAdmins = await db.user.findMany({
          where: { platformRole: "SUPER_ADMIN" },
          select: { id: true },
        });

        for (const admin of superAdmins) {
          await db.notification.create({
            data: {
              userId: admin.id,
              type: "VERIFICATION_REQUEST",
              title: input.role === RequestedRole.JUDGE ? "New Judge Verification Request" : "New College Setup Request",
              body: `${input.details.fullName} requested verification as ${input.role === RequestedRole.JUDGE ? "Judge" : "College Organizer"}.`,
              data: {
                requestId: savedRequest.id,
                role: input.role,
                applicantName: input.details.fullName,
              },
            },
          });
        }
      }
    } catch (notifErr) {
      console.error("Failed to dispatch admin notification:", notifErr);
    }

    return savedRequest;
  }

  /**
   * Get user's current verification request status
   */
  static async getMyStatus(user: AuthUser) {
    const latest = await db.verificationRequest.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
      },
    });

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { onboardingStatus: true, requestedRole: true, platformRole: true },
    });

    // Auto-verify students: students have NO verification pending layer
    const isStudent =
      dbUser?.requestedRole === "STUDENT" ||
      latest?.type === "STUDENT" ||
      (!dbUser?.requestedRole && dbUser?.platformRole === "USER");

    if (isStudent && (dbUser?.onboardingStatus === "PENDING_VERIFICATION" || latest?.status === "PENDING")) {
      await db.$transaction([
        db.user.update({
          where: { id: user.id },
          data: { onboardingStatus: OnboardingStatus.VERIFIED, requestedRole: RequestedRole.STUDENT },
        }),
        ...(latest && latest.status === "PENDING"
          ? [
              db.verificationRequest.update({
                where: { id: latest.id },
                data: { status: VerificationStatus.APPROVED, reviewedAt: new Date() },
              }),
            ]
          : []),
      ]);

      return {
        onboardingStatus: OnboardingStatus.VERIFIED,
        requestedRole: RequestedRole.STUDENT,
        platformRole: dbUser?.platformRole || "USER",
        request: latest
          ? {
              id: latest.id,
              type: RequestedRole.STUDENT,
              status: VerificationStatus.APPROVED,
              organization: latest.organization,
              details: latest.details,
              rejectionReason: null,
              createdAt: latest.createdAt,
              reviewedAt: new Date(),
            }
          : null,
      };
    }

    return {
      onboardingStatus: dbUser?.onboardingStatus || OnboardingStatus.NOT_STARTED,
      requestedRole: dbUser?.requestedRole || null,
      platformRole: dbUser?.platformRole || "USER",
      request: latest
        ? {
            id: latest.id,
            type: latest.type,
            status: latest.status,
            organization: latest.organization,
            details: latest.details,
            rejectionReason: latest.rejectionReason,
            createdAt: latest.createdAt,
            reviewedAt: latest.reviewedAt,
          }
        : null,
    };
  }

  /**
   * List pending verification requests for an authorized reviewer
   */
  static async getPendingRequestsForReviewer(user: AuthUser, orgId?: string) {
    if (user.platformRole === "SUPER_ADMIN") {
      // Super admin sees pending JUDGE and COLLEGE_ORGANIZER requests
      const where: any = {
        status: VerificationStatus.PENDING,
        type: { in: [RequestedRole.JUDGE, RequestedRole.COLLEGE_ORGANIZER] },
      };
      if (orgId) {
        where.organizationId = orgId;
      }

      const requests = await db.verificationRequest.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, createdAt: true } },
          organization: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      return requests.map((r) => ({
        id: r.id,
        type: r.type,
        status: r.status,
        details: r.details,
        user: r.user,
        organization: r.organization,
        createdAt: r.createdAt,
        hasIdCard: Boolean(r.idCardStorageKey),
      }));
    }

    // College Admin review:
    if (!orgId) {
      throw AppError.badRequest("Organization ID is required for college admin review queue.");
    }

    // Verify user is OWNER or ADMIN of this organization
    const membership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
    });

    if (!membership || (membership.role !== OrgRole.OWNER && membership.role !== OrgRole.ADMIN)) {
      throw AppError.forbidden("You do not have permission to review verification requests for this college.");
    }

    const requests = await db.verificationRequest.findMany({
      where: {
        status: VerificationStatus.PENDING,
        organizationId: orgId,
        type: RequestedRole.COLLEGE_ORGANIZER,
      },
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true } },
        organization: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return requests.map((r) => ({
      id: r.id,
      type: r.type,
      status: r.status,
      details: r.details,
      user: r.user,
      organization: r.organization,
      createdAt: r.createdAt,
      hasIdCard: Boolean(r.idCardStorageKey),
    }));
  }

  /**
   * Review (Approve or Reject) a verification request
   */
  static async reviewRequest(
    reviewer: AuthUser,
    requestId: string,
    input: z.infer<typeof ReviewVerificationSchema>
  ) {
    const request = await db.verificationRequest.findUnique({
      where: { id: requestId },
      include: { user: true, organization: true },
    });

    if (!request) throw AppError.notFound("Verification request not found.");
    if (request.status !== VerificationStatus.PENDING) {
      throw AppError.conflict("This verification request has already been reviewed.");
    }

    // Check authority
    const isSuperAdmin = reviewer.platformRole === "SUPER_ADMIN";
    let isAuthorizedCollegeAdmin = false;

    if (request.organizationId && !isSuperAdmin) {
      const membership = await db.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId: request.organizationId, userId: reviewer.id } },
      });
      if (membership?.role === OrgRole.OWNER || membership?.role === OrgRole.ADMIN) {
        isAuthorizedCollegeAdmin = true;
      }
    }

    if (!isSuperAdmin && !isAuthorizedCollegeAdmin) {
      throw AppError.forbidden("You do not have permission to review this verification request.");
    }

    // Judge requests and new college requests MUST be reviewed by Platform Admin
    if (request.type === RequestedRole.JUDGE && !isSuperAdmin) {
      throw AppError.forbidden("Judge verification requests can only be approved by a Platform Super Admin.");
    }

    if (!request.organizationId && !isSuperAdmin) {
      throw AppError.forbidden("New college setup requests can only be reviewed by a Platform Super Admin.");
    }

    if (input.decision === "REJECT" && !input.rejectionReason) {
      throw AppError.badRequest("Rejection reason is required when rejecting a verification request.");
    }

    return db.$transaction(async (tx) => {
      if (input.decision === "APPROVE") {
        const updatedReq = await tx.verificationRequest.update({
          where: { id: requestId },
          data: {
            status: VerificationStatus.APPROVED,
            reviewerId: reviewer.id,
            reviewedAt: new Date(),
          },
        });

        await tx.user.update({
          where: { id: request.userId },
          data: {
            onboardingStatus: OnboardingStatus.VERIFIED,
          },
        });

        // Grant role access based on requested type
        if (request.type === RequestedRole.COLLEGE_ORGANIZER) {
          if (request.organizationId) {
            // Existing college: add as staff/admin in organization
            await tx.organizationMember.upsert({
              where: {
                organizationId_userId: {
                  organizationId: request.organizationId,
                  userId: request.userId,
                },
              },
              create: {
                organizationId: request.organizationId,
                userId: request.userId,
                role: OrgRole.STAFF,
              },
              update: {
                role: OrgRole.STAFF,
              },
            });
          } else {
            // New college request: create new active organization and make user OWNER
            const details = request.details as any;
            const collegeName = details?.newCollegeName || details?.organization || "New College";
            let slug = slugify(collegeName);
            let counter = 1;
            while (await tx.organization.findUnique({ where: { slug } })) {
              slug = `${slugify(collegeName)}-${counter++}`;
            }

            const newOrg = await tx.organization.create({
              data: {
                name: collegeName,
                slug,
                status: OrganizationStatus.ACTIVE,
                members: {
                  create: {
                    userId: request.userId,
                    role: OrgRole.OWNER,
                  },
                },
              },
            });

            await tx.verificationRequest.update({
              where: { id: requestId },
              data: { organizationId: newOrg.id },
            });
          }
        } else if (request.type === RequestedRole.STUDENT && request.organizationId) {
          // Link college to student education profile
          const details = request.details as any;
          const userProfile = await tx.profile.findUnique({ where: { userId: request.userId } });
          if (userProfile) {
            await tx.education.create({
              data: {
                profileId: userProfile.id,
                organizationId: request.organizationId,
                institution: request.organization?.name || "College",
                degree: "Undergraduate",
                fieldOfStudy: details?.branch || "Computer Science",
                startYear: new Date().getFullYear() - 1,
                isCurrent: true,
              },
            });
          }
        }

        // In-app notification for user
        try {
          await tx.notification.create({
            data: {
              userId: request.userId,
              type: "VERIFICATION_APPROVED",
              title: "Verification Approved",
              body: `Your verification request as a ${request.type.replace("_", " ")} has been approved. You now have full access!`,
              data: { requestId: request.id, role: request.type },
            },
          });
        } catch {}

        // Send approval email
        try {
          await queueEmail({
            toEmail: request.user.email,
            template: "notification",
            payload: {
              subject: "Verification Approved - Nexora",
              message: `Congratulations ${request.user.name}! Your verification as a ${request.type} has been approved. You now have full verified access.`,
            },
          });
        } catch {
          // Best effort
        }

        return updatedReq;
      } else {
        // REJECT
        const updatedReq = await tx.verificationRequest.update({
          where: { id: requestId },
          data: {
            status: VerificationStatus.REJECTED,
            rejectionReason: input.rejectionReason,
            reviewerId: reviewer.id,
            reviewedAt: new Date(),
          },
        });

        await tx.user.update({
          where: { id: request.userId },
          data: {
            onboardingStatus: OnboardingStatus.REJECTED,
          },
        });

        // In-app notification for rejected user
        try {
          await tx.notification.create({
            data: {
              userId: request.userId,
              type: "VERIFICATION_REJECTED",
              title: "Verification Request Not Approved",
              body: `Your verification request as a ${request.type.replace("_", " ")} was not approved: "${input.rejectionReason}". Please update your details and re-submit.`,
              data: { requestId: request.id, role: request.type, reason: input.rejectionReason },
            },
          });
        } catch {}

        // Send rejection email with reason
        try {
          await queueEmail({
            toEmail: request.user.email,
            template: "notification",
            payload: {
              subject: "Verification Request Update - Nexora",
              message: `Hello ${request.user.name},\n\nYour verification request as a ${request.type} was not approved for the following reason:\n"${input.rejectionReason}"\n\nPlease log in to correct your details and re-submit.`,
            },
          });
        } catch {
          // Best effort
        }

        return updatedReq;
      }
    });
  }

  /**
   * Generate short-lived signed URL for reviewing the ID card (Reviewer only!)
   */
  static async getSignedIdCardUrl(reviewer: AuthUser, requestId: string) {
    const request = await db.verificationRequest.findUnique({
      where: { id: requestId },
      include: { organization: true },
    });

    if (!request || !request.idCardStorageKey) {
      throw AppError.notFound("Verification document not found.");
    }

    // Verify reviewer authority
    const isSuperAdmin = reviewer.platformRole === "SUPER_ADMIN";
    let isCollegeAdmin = false;

    if (request.organizationId && !isSuperAdmin) {
      const membership = await db.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId: request.organizationId, userId: reviewer.id } },
      });
      if (membership?.role === OrgRole.OWNER || membership?.role === OrgRole.ADMIN) {
        isCollegeAdmin = true;
      }
    }

    // Only authorized reviewer or the owner user themself can view their ID card
    const isOwner = request.userId === reviewer.id;
    if (!isSuperAdmin && !isCollegeAdmin && !isOwner) {
      throw AppError.forbidden("Access denied: You are not authorized to view this document.");
    }

    const s3 = getS3();
    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: request.idCardStorageKey,
    });

    let signedUrl = "";
    try {
      signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes TTL
    } catch {
      signedUrl = `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${request.idCardStorageKey}?mock=true`;
    }

    return {
      signedUrl,
      expiresInSeconds: 300,
    };
  }
}
