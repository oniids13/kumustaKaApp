/*
  Warnings:

  - A unique constraint covering the columns `[postId,type,studentId,teacherId]` on the table `reactions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "reactions_postId_studentId_teacherId_key";

-- CreateIndex
CREATE UNIQUE INDEX "reactions_postId_type_studentId_teacherId_key" ON "reactions"("postId", "type", "studentId", "teacherId");
