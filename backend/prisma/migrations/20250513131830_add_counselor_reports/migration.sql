-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "counselorId" TEXT NOT NULL,
    "studentId" TEXT,
    "reportType" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "includeCharts" BOOLEAN NOT NULL DEFAULT false,
    "includeTables" BOOLEAN NOT NULL DEFAULT false,
    "includeRecommendations" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_counselorId_idx" ON "reports"("counselorId");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "counselors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
