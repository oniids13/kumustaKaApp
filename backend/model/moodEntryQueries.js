const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getTodayRange } = require("../utils/dateUtils");

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

    const moodEntry = await prisma.moodEntry.create({
      data: {
        studentId: student.id,
        moodLevel: numericMood,
        notes: notes || null,
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

const getRecentMoodEntry = async (userId, days = 7) => {
  try {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    const weeklyMoodEntry = await prisma.moodEntry.findMany({
      where: {
        studentId: student.id,
        createdAt: { gte: date },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return weeklyMoodEntry;
  } catch (error) {
    throw new Error("Error getting mood entries");
  }
};

module.exports = { createMoodEntry, getRecentMoodEntry, checkTodaySubmission };
