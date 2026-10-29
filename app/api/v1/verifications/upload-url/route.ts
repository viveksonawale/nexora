import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AppError } from "@/server/lib/errors";
import { z } from "zod";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/server/lib/env";

const UploadUrlSchema = z.object({
  mimeType: z.enum(["image/jpeg", "image/png", "application/pdf"], {
    message: "Only JPG, PNG, and PDF documents are accepted.",
  }),
  sizeBytes: z.number().max(5 * 1024 * 1024, "File size must not exceed 5MB."),
});

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

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const body = await req.json();
  const { mimeType, sizeBytes } = UploadUrlSchema.parse(body);

  const ext = mimeType === "application/pdf" ? "pdf" : mimeType === "image/png" ? "png" : "jpg";
  const randomSuffix = crypto.randomBytes(8).toString("hex");
  const storageKey = `verifications/${ctx.user!.id}/${Date.now()}-${randomSuffix}.${ext}`;

  const s3 = getS3();
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: storageKey,
    ContentType: mimeType,
    ContentLength: sizeBytes,
  });

  let uploadUrl = "";
  try {
    uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  } catch {
    uploadUrl = `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${storageKey}?mock=true`;
  }

  return NextResponse.json({
    storageKey,
    uploadUrl,
    headers: {
      "Content-Type": mimeType,
    },
    expiresInSeconds: 300,
  });
});
