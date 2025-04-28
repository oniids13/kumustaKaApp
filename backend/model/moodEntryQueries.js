const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const existingEntry = await prisma.moodEntry.findFirst({
      where: {
        studentId: student.id,
        createdAt: { gte: today },
      },
    });

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

const getAllMoodEntry = async (userId) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    const allMoodEntry = await prisma.moodEntry.findMany({
      where: {
        studentId: student.id,
      },
      select: {
        id: true,
        moodLevel: true,
        notes: true,
        createdAt: true,
      },
    });

    return allMoodEntry;
  } catch (error) {
    throw new Error("Error getting mood entries");
  }
};

module.exports = { createMoodEntry, getAllMoodEntry };
