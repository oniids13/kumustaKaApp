const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const STUDENT_ID = "6926b287-6c08-4c3f-b2cb-bc72a4814ada";

async function checkStudentData() {
  try {
    // Get basic student info
    const student = await prisma.student.findUnique({
      where: { id: STUDENT_ID },
      include: {
        user: true,
      },
    });

    // Get mood entries for the last 30 days
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Get survey responses for the last 30 days
    const surveys = await prisma.surveyResponse.findMany({
      where: {
        studentId: STUDENT_ID,
        createdAt: {
          gte: thirtyDaysAgo,
          lte: today,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get initial assessment data
    try {
      const assessment = await prisma.initialAssessment.findUnique({
        where: { studentId: STUDENT_ID },
      });

      // Get mood entries for the last 30 days
      const moods = await prisma.moodEntry.findMany({
        where: {
          studentId: STUDENT_ID,
          createdAt: {
            gte: thirtyDaysAgo,
            lte: today,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      console.log("\nDEBUG SUMMARY:");
      console.log("This student should have zone calculated from:");

      if (surveys.length > 0 && surveys[0].zone) {
        console.log(`- Survey zone: ${surveys[0].zone}`);
      } else if (moods.length > 0) {
        const validMoods = moods.filter((m) => typeof m.moodLevel === "number");
        if (validMoods.length > 0) {
          const avgMood =
            validMoods.reduce((sum, m) => sum + m.moodLevel, 0) /
            validMoods.length;
          console.log(
            `- Calculated from ${
              validMoods.length
            } mood entries: ${avgMood.toFixed(2)}`
          );
          console.log(
            `  This should put them in: ${
              avgMood <= 2 ? "Red" : avgMood <= 3.5 ? "Yellow" : "Green"
            } zone`
          );
        } else {
          console.log(
            `- Has ${moods.length} mood entries but all have invalid moodLevel values`
          );
        }
      }
    } catch (error) {
      console.error("Error fetching initial assessment:", error);
    }
  } catch (error) {
    console.error("Error checking student data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudentData();
