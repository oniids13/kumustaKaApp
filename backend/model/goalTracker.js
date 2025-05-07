const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { startOfWeek, endOfWeek, getISOWeek } = require("date-fns");

// Getting current ISO week number and year
function getCurrentWeek() {
  const now = new Date();
  return {
    weekNumber: getISOWeek(now),
    year: now.getFullYear(),
  };
}

// Calculate completion percentage and status
function calculateWeeklyStatus(goals) {
  const total = goals.length;
  const completed = goals.filter((g) => g.isCompleted).length;

  return {
    totalGoals: total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    status:
      total === 0 ? "EMPTY" : completed === total ? "COMPLETED" : "INCOMPLETE",
  };
}

const createGoal = async (userId, title, description = "") => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    const { weekNumber, year } = getCurrentWeek();

    const existingGoals = await prisma.goal.findMany({
      where: {
        studentId: student.id,
        weekNumber,
        year,
      },
    });

    if (existingGoals.length >= 5) {
      throw new Error("Maximum of 5 goals per week allowed");
    }

    return prisma.goal.create({
      data: {
        title,
        studentId: student.id,
        weekNumber,
        year,
        description,
      },
    });
  } catch (error) {
    console.error("Error creating goals:", error);
    throw error;
  }
};

// Toggle goal completion status
const toggleGoalCompletion = async (goalId) => {
  try {
    // Validate the goal exists
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw new Error(`Goal with ID ${goalId} not found`);
    }

    // Update the goal completion status
    return await prisma.goal.update({
      where: { id: goalId },
      data: { isCompleted: !goal.isCompleted },
    });
  } catch (error) {
    console.error(`Error toggling goal completion for goal ${goalId}:`, error);
    throw error;
  }
};

// Getting goals for the current week
const getWeeklyGoals = async (userId) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    const { weekNumber, year } = getCurrentWeek();

    return prisma.goal.findMany({
      where: {
        studentId: student.id,
        weekNumber,
        year,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  } catch (error) {
    console.error("Error fetching goals", error);
    throw new Error("Failed to fetch goals.");
  }
};

// Update weekly summary for a specific student
const updateWeeklySummaryForStudent = async (studentId) => {
  try {
    const { weekNumber, year } = getCurrentWeek();

    // Get goals directly from database for this student, week and year
    const goals = await prisma.goal.findMany({
      where: {
        studentId,
        weekNumber,
        year,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const { totalGoals, completed, percentage, status } =
      calculateWeeklyStatus(goals);

    return prisma.weeklyGoalSummary.upsert({
      where: {
        studentId_weekNumber_year: {
          studentId,
          weekNumber,
          year,
        },
      },
      create: {
        studentId,
        weekNumber,
        year,
        totalGoals,
        completed,
        percentage,
        status,
      },
      update: {
        totalGoals,
        completed,
        percentage,
        status,
      },
    });
  } catch (error) {
    console.error(
      `Error updating weekly summary for student ${studentId}:`,
      error
    );
    throw error;
  }
};

// Update weekly summary for a user
const updateWeeklySummary = async (userId) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      throw new Error(`Student not found for user ID ${userId}`);
    }

    return updateWeeklySummaryForStudent(student.id);
  } catch (error) {
    console.error("Error updating weekly summary:", error);
    throw new Error("Failed to update weekly summary.");
  }
};

// Get calendar view (all weeks of year)
const getYearlySummary = async (userId, year = new Date().getFullYear()) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    return prisma.weeklyGoalSummary.findMany({
      where: {
        studentId: student.id,
        year,
      },
      orderBy: [{ year: "asc" }, { weekNumber: "asc" }],
    });
  } catch (error) {
    console.error("Error fetching yearly summary", error);
    throw new Error("Failed to fetch yearly summary.");
  }
};

// Reset weekly goals for a specific student
const resetWeeklyGoalsForStudent = async (studentId) => {
  try {
    const { weekNumber, year } = getCurrentWeek();

    return prisma.goal.updateMany({
      where: {
        studentId,
        weekNumber,
        year,
      },
      data: {
        isCompleted: false,
      },
    });
  } catch (error) {
    console.error(
      `Error resetting weekly goals for student ${studentId}:`,
      error
    );
    throw error;
  }
};

// Reset weekly goals for a user
const resetWeeklyGoals = async (userId) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      throw new Error(`Student not found for user ID ${userId}`);
    }

    return resetWeeklyGoalsForStudent(student.id);
  } catch (error) {
    console.error("Error resetting weekly goals:", error);
    throw new Error("Failed to reset weekly goals.");
  }
};

// Scheduled tasks
// Run in cron job setup
const sundayNightUpdate = async () => {
  try {
    console.log("Starting Sunday night update for all students...");
    const students = await prisma.student.findMany({
      select: {
        id: true,
      },
    });

    console.log(`Found ${students.length} students to update summaries for`);
    const results = await Promise.all(
      students.map((student) => updateWeeklySummaryForStudent(student.id))
    );

    console.log(
      `Successfully updated weekly summaries for ${results.length} students`
    );
    return results;
  } catch (error) {
    console.error("Error during Sunday night update:", error);
    throw error;
  }
};

const mondayMorningReset = async () => {
  try {
    console.log("Starting Monday morning reset for all students...");
    const students = await prisma.student.findMany({
      select: {
        id: true,
      },
    });

    console.log(`Found ${students.length} students to reset goals for`);
    const results = await Promise.all(
      students.map((student) => resetWeeklyGoalsForStudent(student.id))
    );

    console.log(
      `Successfully reset weekly goals for ${results.length} students`
    );
    return results;
  } catch (error) {
    console.error("Error during Monday morning reset:", error);
    throw error;
  }
};

module.exports = {
  createGoal,
  toggleGoalCompletion,
  getWeeklyGoals,
  getYearlySummary,
  updateWeeklySummary,
  resetWeeklyGoals,
  sundayNightUpdate,
  mondayMorningReset,
};
