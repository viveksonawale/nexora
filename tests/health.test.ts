import { describe, it, expect, vi } from "vitest";
import { GET } from "../app/api/v1/health/route";
import { NextRequest, NextResponse } from "next/server";

vi.mock("../server/lib/db", () => ({
  db: {
    $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
  },
}));

describe("Health API", () => {
  it("should return 200 OK", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/health");
    const res = await GET(req) as unknown as NextResponse;
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.status).toBe("ok");
    expect(data.data.timestamp).toBeDefined();
  });
});
