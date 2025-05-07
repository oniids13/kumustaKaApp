const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { startOfWeek, endOfWeek, getISOWeek } = require("date-fns");

// Getting current ISO week number and year

function getCurrentWek() {
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

const createGoal = async (userId, title) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    const { weekNumber, year } = getCurrentWek();

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
      },
    });
  } catch (error) {
    console.error("Error creating goals:", error);
    throw new Error("Failed to create goals.");
  }
};

// Toggle goal completion status

const toggleGoalCompletion = async (goalId) => {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
  });

  return prisma.goal.update({
    where: { id: goalId },
    data: { isCompleted: !goal.isCompleted },
  });
};

// Getting goals for the current week

const getWeeklyGoals = async (userId) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    const { weekNumber, year } = getCurrentWek();

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
