/*
  Warnings:

  - Added the required column `percentage` to the `survey_responses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zone` to the `survey_responses` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SurveyType" AS ENUM ('DAILY', 'WEEKLY', 'INITIAL');

-- AlterTable
ALTER TABLE "survey_responses" ADD COLUMN     "percentage" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "zone" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "surveys" ADD COLUMN     "type" "SurveyType" NOT NULL DEFAULT 'DAILY';
