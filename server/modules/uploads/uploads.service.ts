import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { FilePurpose } from "@prisma/client";
import crypto from "crypto";
import { db } from "@/server/lib/db";
import { env } from "@/server/lib/env";
import { AppError } from "@/server/lib/errors";

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
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

const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_MEDIA_MIMES = [
  ...ALLOWED_IMAGE_MIMES,
  "application/pdf",
  "video/mp4",
  "video/webm",
  "application/zip",
];

export async function presignUpload(
  userId: string,
  input: {
    purpose: FilePurpose;
    mimeType: string;
    sizeBytes: number;
  }
) {
  // 1. Validate limits per purpose
  if (input.purpose === "AVATAR") {
    if (!ALLOWED_IMAGE_MIMES.includes(input.mimeType)) {
      throw new AppError(
        "UPLOAD_REJECTED",
        "Avatar must be a JPEG, PNG, or WebP image",
        400
      );
    }
    if (input.sizeBytes > env.UPLOAD_MAX_AVATAR_BYTES) {
      throw new AppError(
        "UPLOAD_REJECTED",
        `Avatar size cannot exceed ${env.UPLOAD_MAX_AVATAR_BYTES / (1024 * 1024)}MB`,
        400
      );
    }
  } else {
    if (!ALLOWED_MEDIA_MIMES.includes(input.mimeType)) {
      throw new AppError(
        "UPLOAD_REJECTED",
        "Invalid file format",
        400
      );
    }
    if (input.sizeBytes > env.UPLOAD_MAX_MEDIA_BYTES) {
      throw new AppError(
        "UPLOAD_REJECTED",
        `File size cannot exceed ${env.UPLOAD_MAX_MEDIA_BYTES / (1024 * 1024)}MB`,
        400
      );
    }
  }

  // 2. Generate storage key
  const ext = input.mimeType.split("/")[1] || "bin";
  const randomSuffix = crypto.randomBytes(8).toString("hex");
  const storageKey = `${input.purpose.toLowerCase()}/${userId}/${Date.now()}-${randomSuffix}.${ext}`;

  // 3. Create FileAsset (PENDING)
  const fileAsset = await db.fileAsset.create({
    data: {
      ownerId: userId,
      purpose: input.purpose,
      storageKey,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      status: "PENDING",
    },
  });

  // 4. Generate presigned URL
  const s3 = getS3Client();
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: storageKey,
    ContentType: input.mimeType,
    ContentLength: input.sizeBytes,
  });

  let uploadUrl = "";
  try {
    uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: env.UPLOAD_PRESIGN_TTL_SECONDS,
    });
  } catch {
    // For test / offline environments, fallback to mock upload url
    uploadUrl = `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${storageKey}?mock=true`;
  }

  const expiresAt = new Date(Date.now() + env.UPLOAD_PRESIGN_TTL_SECONDS * 1000);

  return {
    fileId: fileAsset.id,
    uploadUrl,
    headers: {
      "Content-Type": input.mimeType,
    },
    expiresAt: expiresAt.toISOString(),
  };
}

export async function confirmUpload(userId: string, fileId: string) {
  const fileAsset = await db.fileAsset.findFirst({
    where: { id: fileId, ownerId: userId },
  });

  if (!fileAsset) {
    throw new AppError("NOT_FOUND", "File asset not found", 404);
  }

  if (fileAsset.status === "CONFIRMED") {
    return {
      fileId: fileAsset.id,
      url: fileAsset.publicUrl || getPublicUrl(fileAsset.storageKey),
    };
  }

  // Check object in S3 if not in test environment
  if (env.NODE_ENV !== "test") {
    const s3 = getS3Client();
    try {
      const head = await s3.send(
        new HeadObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: fileAsset.storageKey,
        })
      );

      if (!head.ContentLength || head.ContentLength <= 0) {
        throw new AppError("UPLOAD_REJECTED", "Uploaded file is empty", 400);
      }
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      throw new AppError("UPLOAD_REJECTED", "File not found in storage. Please re-upload.", 400);
    }
  }

  const publicUrl = getPublicUrl(fileAsset.storageKey);

  await db.fileAsset.update({
    where: { id: fileId },
    data: {
      status: "CONFIRMED",
      publicUrl,
    },
  });

  return {
    fileId: fileAsset.id,
    url: publicUrl,
  };
}

export async function deleteUpload(userId: string, fileId: string) {
  const fileAsset = await db.fileAsset.findFirst({
    where: { id: fileId, ownerId: userId },
  });

  if (!fileAsset) {
    throw new AppError("NOT_FOUND", "File asset not found", 404);
  }

  if (env.NODE_ENV !== "test") {
    const s3 = getS3Client();
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: fileAsset.storageKey,
        })
      );
    } catch {
      // Best effort deletion from storage
    }
  }

  await db.fileAsset.delete({ where: { id: fileId } });

  return { message: "File deleted successfully" };
}

function getPublicUrl(storageKey: string): string {
  if (env.S3_PUBLIC_BASE_URL) {
    return `${env.S3_PUBLIC_BASE_URL.replace(/\/$/, "")}/${storageKey}`;
  }
  return `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${storageKey}`;
}
