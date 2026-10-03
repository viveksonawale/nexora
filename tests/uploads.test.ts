import { describe, it, expect, vi } from "vitest";
import { presignUpload } from "@/server/modules/uploads/uploads.service";
import { db } from "@/server/lib/db";

describe("Uploads Service", () => {
  it("rejects invalid MIME types for avatar", async () => {
    await expect(
      presignUpload("u_test", {
        purpose: "AVATAR",
        mimeType: "application/pdf",
        sizeBytes: 1000,
      })
    ).rejects.toThrow("Avatar must be a JPEG, PNG, or WebP image");
  });

  it("rejects avatars exceeding 2MB size limit", async () => {
    await expect(
      presignUpload("u_test", {
        purpose: "AVATAR",
        mimeType: "image/png",
        sizeBytes: 3 * 1024 * 1024, // 3MB > 2MB
      })
    ).rejects.toThrow("cannot exceed 2MB");
  });

  it("generates presigned upload URL and PENDING file asset for valid media", async () => {
    vi.spyOn(db.fileAsset, "create").mockResolvedValueOnce({
      id: "file_asset_1",
      ownerId: "u_test",
      purpose: "AVATAR",
      storageKey: "avatar/u_test/123-abc.png",
      mimeType: "image/png",
      sizeBytes: 50000,
      status: "PENDING",
      publicUrl: null,
      createdAt: new Date(),
    });

    const result = await presignUpload("u_test", {
      purpose: "AVATAR",
      mimeType: "image/png",
      sizeBytes: 50000,
    });

    expect(result.fileId).toBe("file_asset_1");
    expect(result.uploadUrl).toBeDefined();
    expect(result.headers["Content-Type"]).toBe("image/png");
    expect(result.expiresAt).toBeDefined();
  });
});
