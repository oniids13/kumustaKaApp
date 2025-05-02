/*
  Warnings:

  - You are about to drop the column `anwers` on the `initial_assessments` table. All the data in the column will be lost.
  - Added the required column `answers` to the `initial_assessments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "initial_assessments" DROP COLUMN "anwers",
ADD COLUMN     "answers" JSONB NOT NULL;
