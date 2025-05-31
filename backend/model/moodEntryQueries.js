const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getTodayRange, getWeekDateRange } = require("../utils/dateUtils");

const checkTodaySubmission = async (userId, clientTime = null) => {
  // If client time is provided, use it for better timezone accuracy
  const dateRange = getTodayRange(clientTime);
  const { todayStart, todayEnd, debugInfo } = dateRange;

  console.log(
    `[DEBUG] Checking mood for user ${userId} between ${todayStart.toISOString()} and ${todayEnd.toISOString()}
    Client time provided: ${clientTime ? "Yes" : "No"}
    ${clientTime ? `Client time: ${clientTime.toISOString()}` : ""}`
  );

  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      console.log(`[DEBUG] Student not found for userId ${userId}`);
      return { entry: null, debugInfo };
    }

    console.log(`[DEBUG] Found student ID ${student.id} for user ${userId}`);

    const entry = await prisma.moodEntry.findFirst({
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
        notes: true,
        createdAt: true,
      },
    });

    console.log(
      `[DEBUG] Mood entry result for student ${student.id}: ${
        entry
          ? `Found entry (ID: ${
              entry.id
            }, Created: ${entry.createdAt.toISOString()})`
          : "No entry found"
      }`
    );

    return { entry, debugInfo };
  } catch (error) {
    console.error(
      `[ERROR] Error checking today's mood submission: ${error.message}`
    );
    throw error;
  }
};

const createMoodEntry = async (
  userId,
  moodLevel,
  notes,
  forceCreate = false
) => {
  try {
    const numericMood = Number(moodLevel);
    if (![1, 2, 3, 4, 5].includes(numericMood)) {
      throw new Error("Mood level must be between 1-5");
    }

    // Use a transaction to prevent race conditions
    return await prisma.$transaction(async (tx) => {
      const student = await tx.student.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      // Get the date range within the transaction
      const { todayStart, todayEnd } = getTodayRange();

      console.log(
        `[DEBUG] Creating mood entry for student ${student.id} with date range:
        - Start: ${todayStart.toISOString()}
        - End: ${todayEnd.toISOString()}`
      );

      // Only check for existing entries if forceCreate is false
      if (!forceCreate) {
        // Check for existing entry within the transaction
        const existingEntry = await tx.moodEntry.findFirst({
          where: {
            studentId: student.id,
            createdAt: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
        });

        if (existingEntry) {
          console.log(
            `[INFO] User ${userId} already has a mood entry for today (ID: ${
              existingEntry.id
            }, Created: ${existingEntry.createdAt.toISOString()})`
          );
          throw new Error("Already submitted mood entry today");
        }
      }

      console.log(
        `[INFO] Creating new mood entry for user ${userId} with mood level ${numericMood}`
      );

      // Create the entry within the transaction
      const moodEntry = await tx.moodEntry.create({
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

      console.log(
        `[INFO] Successfully created mood entry with ID: ${
          moodEntry.id
        }, Created: ${moodEntry.createdAt.toISOString()}`
      );
      return moodEntry;
    });
  } catch (error) {
    console.error(
      `[ERROR] Database Error in createMoodEntry: ${error.message}`
    );
    throw error;
  }
};

const getRecentMoodEntry = async (userId, weekNumber) => {
  try {
    const year = new Date().getFullYear();
    const { startDate, endDate } = getWeekDateRange(weekNumber, year);

    console.log(`[DEBUG] Getting mood entries for user ${userId}, week ${weekNumber}:
      - Start: ${startDate.toISOString()}
      - End: ${endDate.toISOString()}`);

    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      console.log(`[DEBUG] Student not found for userId ${userId}`);
      return [];
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
      select: {
        id: true,
        moodLevel: true,
        notes: true,
        createdAt: true,
      },
    });

    console.log(`[DEBUG] Found ${entries.length} mood entries for week ${weekNumber}`);
    entries.forEach(entry => {
      console.log(`[DEBUG] Entry ID ${entry.id}: ${entry.createdAt.toISOString()}, mood: ${entry.moodLevel}`);
    });

    return entries;
  } catch (error) {
    console.error(`[ERROR] Error getting mood entries: ${error.message}`);
    return [];
  }
};

const getAllMoodEntries = async (userId) => {
  try {
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return entries;
  } catch (error) {
    console.error("Error getting all mood entries:", error);
    throw new Error("Error getting all mood entries");
  }
};

module.exports = {
  createMoodEntry,
  getRecentMoodEntry,
  checkTodaySubmission,
  getAllMoodEntries,
};
