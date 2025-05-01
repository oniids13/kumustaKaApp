/*
  Warnings:

  - Added the required column `anxietyScore` to the `initial_assessments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `depressionScore` to the `initial_assessments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stressScore` to the `initial_assessments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalScore` to the `initial_assessments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "initial_assessments" ADD COLUMN     "anxietyScore" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "depressionScore" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "stressScore" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalScore" DOUBLE PRECISION NOT NULL;
