/*
  Warnings:

  - You are about to drop the column `description` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `questions` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `answers` on the `QuizAttempt` table. All the data in the column will be lost.
  - Added the required column `correctAnswer` to the `Quiz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `points` to the `Quiz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `question` to the `Quiz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `selectedAnswer` to the `QuizAttempt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quiz" DROP COLUMN "description",
DROP COLUMN "questions",
DROP COLUMN "title",
ADD COLUMN     "correctAnswer" INTEGER NOT NULL,
ADD COLUMN     "explanation" TEXT,
ADD COLUMN     "options" TEXT[],
ADD COLUMN     "points" INTEGER NOT NULL,
ADD COLUMN     "question" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "QuizAttempt" DROP COLUMN "answers",
ADD COLUMN     "selectedAnswer" INTEGER NOT NULL;
