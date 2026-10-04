/**
 * Imports the website's existing local hackathon list (app/data/hackathons.ts) into the database,
 * so web and mobile read the same records. Run: npx tsx scripts/seed.ts
 *
 * Needs SEED_ORGANIZER_EMAIL and SEED_ORGANIZER_PASSWORD in .env (the owner of seeded events).
 * The field mapper below is defensive; adjust `map()` if your data file uses different names.
 */
import bcrypt from "bcryptjs";
import { PrismaClient, type HackathonMode, type HackathonStatus } from "@prisma/client";
import * as mod from "../app/data/hackathons";

const db = new PrismaClient();
/* eslint-disable @typescript-eslint/no-explicit-any */
const rows: any[] = (Object.values(mod).find((v) => Array.isArray(v)) as any[]) ?? [];

const status = (v: any): HackathonStatus => {
  const s = String(v ?? "").toUpperCase();
  return (["LIVE", "OPEN", "UPCOMING", "ENDED"].includes(s) ? s : "UPCOMING") as HackathonStatus;
};
const mode = (v: any): HackathonMode => {
  const s = String(v ?? "").toUpperCase();
  return (["ONLINE", "OFFLINE", "HYBRID"].includes(s) ? s : "ONLINE") as HackathonMode;
};
const num = (v: any) => Number(String(v ?? "0").replace(/[^\d]/g, "")) || 0;

function map(r: any) {
  return {
    name: String(r.name ?? r.title ?? "Untitled"),
    college: String(r.college ?? r.organizer ?? ""),
    location: String(r.location ?? ""),
    mode: mode(r.mode ?? r.type),
    status: status(r.status),
    theme: String(r.theme ?? ""),
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
    description: String(r.description ?? ""),
    prize: num(r.prize),
    startDate: new Date(r.startDate ?? r.date ?? Date.now()),
  };
}

async function main() {
  const email = process.env.SEED_ORGANIZER_EMAIL;
  const password = process.env.SEED_ORGANIZER_PASSWORD;
  if (!email || !password) throw new Error("Set SEED_ORGANIZER_EMAIL and SEED_ORGANIZER_PASSWORD");
  const owner = await db.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Nexora Organizer", passwordHash: await bcrypt.hash(password, 10), role: "ORGANIZER", emailVerified: true },
  });
  let created = 0;
  for (const r of rows) {
    const d = map(r);
    if (Number.isNaN(d.startDate.getTime())) d.startDate = new Date();
    const exists = await db.hackathon.findFirst({ where: { name: d.name, organizerId: owner.id } });
    if (!exists) { await db.hackathon.create({ data: { ...d, organizerId: owner.id } }); created++; }
  }
  console.log(`Seeded ${created} of ${rows.length} hackathons.`);
}
main().finally(() => db.$disconnect());
