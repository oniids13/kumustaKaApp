-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('COMPLETED', 'INCOMPLETE', 'EMPTY');

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "weekNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_goal_summaries" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalGoals" INTEGER NOT NULL DEFAULT 0,
    "completed" INTEGER NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL,
    "status" "GoalStatus" NOT NULL,

    CONSTRAINT "weekly_goal_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "goals_studentId_weekNumber_year_idx" ON "goals"("studentId", "weekNumber", "year");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_goal_summaries_studentId_weekNumber_year_key" ON "weekly_goal_summaries"("studentId", "weekNumber", "year");

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_goal_summaries" ADD CONSTRAINT "weekly_goal_summaries_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
