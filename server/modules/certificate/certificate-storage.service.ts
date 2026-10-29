import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { env } from "@/server/lib/env";
import { AppError } from "@/server/lib/errors";

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

const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".data/private/certificates");

function ensureLocalDir() {
  if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
  }
}

export class CertificateStorageService {
  /**
   * Save certificate PDF to private storage (S3 with local persistence fallback).
   */
  static async storePdf(hackathonId: string, certificateId: string, pdfBuffer: Buffer): Promise<string> {
    const storageKey = `certificates/${hackathonId}/${certificateId}.pdf`;

    // 1. Always write locally for fast retrieval / test isolation
    ensureLocalDir();
    const localHackathonDir = path.join(LOCAL_STORAGE_DIR, hackathonId);
    if (!fs.existsSync(localHackathonDir)) {
      fs.mkdirSync(localHackathonDir, { recursive: true });
    }
    const localFilePath = path.join(localHackathonDir, `${certificateId}.pdf`);
    fs.writeFileSync(localFilePath, pdfBuffer);

    // 2. Upload to S3 if not in test mode
    if (env.NODE_ENV !== "test") {
      try {
        const s3 = getS3();
        await s3.send(
          new PutObjectCommand({
            Bucket: env.S3_BUCKET,
            Key: storageKey,
            Body: pdfBuffer,
            ContentType: "application/pdf",
          })
        );
      } catch (err) {
        // Fallback to local storage if S3 fails
        console.warn("S3 upload failed for certificate, using local storage:", err);
      }
    }

    return storageKey;
  }

  /**
   * Fetch certificate PDF buffer from local cache or S3.
   */
  static async getPdfBuffer(storageKey: string): Promise<Buffer> {
    // 1. Check local filesystem
    ensureLocalDir();
    const localPath = path.join(process.cwd(), ".data/private", storageKey);
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }

    // 2. Fetch from S3
    try {
      const s3 = getS3();
      const res = await s3.send(
        new GetObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: storageKey,
        })
      );

      if (!res.Body) {
        throw new AppError("NOT_FOUND", "Certificate file not found in storage", 404);
      }

      const stream = res.Body as Readable;
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      return Buffer.concat(chunks);
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError("NOT_FOUND", "Certificate file could not be retrieved", 404);
    }
  }
}
