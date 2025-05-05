/*
  Warnings:

  - Added the required column `phDate` to the `survey_responses` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "survey_responses_studentId_surveyId_createdAt_idx";

-- AlterTable
ALTER TABLE "survey_responses" ADD COLUMN     "phDate" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "survey_responses_studentId_phDate_idx" ON "survey_responses"("studentId", "phDate");
