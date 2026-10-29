-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "AttendanceMethod" AS ENUM ('QR', 'MANUAL');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "link" TEXT;

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" TEXT NOT NULL,
    "hackathonId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "secret" TEXT NOT NULL,
    "displayKeyHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "method" "AttendanceMethod" NOT NULL DEFAULT 'QR',
    "markedById" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AttendanceSession_hackathonId_status_idx" ON "AttendanceSession"("hackathonId", "status");

-- CreateIndex
CREATE INDEX "AttendanceSession_createdById_idx" ON "AttendanceSession"("createdById");

-- CreateIndex
CREATE INDEX "AttendanceSession_displayKeyHash_idx" ON "AttendanceSession"("displayKeyHash");

-- CreateIndex
CREATE INDEX "AttendanceRecord_sessionId_markedAt_idx" ON "AttendanceRecord"("sessionId", "markedAt");

-- CreateIndex
CREATE INDEX "AttendanceRecord_userId_idx" ON "AttendanceRecord"("userId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_registrationId_idx" ON "AttendanceRecord"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_sessionId_userId_key" ON "AttendanceRecord"("sessionId", "userId");

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
