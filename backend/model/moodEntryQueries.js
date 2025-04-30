const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getTodayRange, getDateOfWeek } = require("../utils/dateUtils");

const checkTodaySubmission = async (userId) => {
  const { todayStart, todayEnd } = getTodayRange();

  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });

  return await prisma.moodEntry.findFirst({
    where: {
      studentId: student.id,
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    select: {
      id: true,
      moodLevel: true,
      createdAt: true,
    },
  });
};

const createMoodEntry = async (userId, moodLevel, notes) => {
  try {
    const numericMood = Number(moodLevel);
    if (![1, 2, 3, 4, 5].includes(numericMood)) {
      throw new Error("Mood level must be between 1-5");
    }

    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    const existingEntry = await checkTodaySubmission(userId);

    if (existingEntry) {
      throw new Error("Already submitted mood entry today");
    }

    const now = new Date();
    const phTime = new Date(
      now.getTime() - now.getTimezoneOffset() * 60 * 1000
    );

    const moodEntry = await prisma.moodEntry.create({
      data: {
        studentId: student.id,
        moodLevel: numericMood,
        notes: notes || null,
        createdAt: phTime,
      },
      select: {
        id: true,
        moodLevel: true,
        notes: true,
        createdAt: true,
      },
    });

    return moodEntry;
  } catch (error) {
    console.error("Database Error Details:", error);
    throw error;
  }
};

const getRecentMoodEntry = async (userId, weekNumber) => {
  try {
    const year = new Date().getFullYear();

    const startDate = getDateOfWeek(weekNumber, year);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    const entries = await prisma.moodEntry.findMany({
      where: {
        studentId: student.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const weekData = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);

      const entry = entries.find(
        (e) =>
          e.createdAt.toISOString().split("T")[0] ===
          day.toISOString().split("T")[0]
      );

      weekData.push(entry || null);
    }

    return weekData;
  } catch (error) {
    throw new Error("Error getting mood entries");
  }
};

module.exports = { createMoodEntry, getRecentMoodEntry, checkTodaySubmission };
