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

    console.log("STUDENT INFO:");
    console.log(
      JSON.stringify(
        {
          id: student.id,
          name: `${student.user.firstName} ${student.user.lastName}`,
          email: student.user.email,
        },
        null,
        2
      )
    );

    // Get mood entries for the last 30 days
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    console.log(
      `\nFetching mood data from ${thirtyDaysAgo.toISOString()} to ${today.toISOString()}`
    );

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

    console.log("\nMOOD ENTRIES:");
    console.log(`Found ${moods.length} mood entries`);

    // Display mood entries with detailed information
    moods.forEach((mood, index) => {
      console.log(`\nMood Entry #${index + 1}:`);
      console.log(`  ID: ${mood.id}`);
      console.log(
        `  Mood Level: ${mood.moodLevel} (type: ${typeof mood.moodLevel})`
      );
      console.log(`  Created At: ${mood.createdAt}`);
      console.log(`  Notes: ${mood.notes || "No notes"}`);
    });

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

    console.log("\nSURVEY RESPONSES:");
    console.log(`Found ${surveys.length} survey responses`);

    // Display survey responses with detailed information
    surveys.forEach((survey, index) => {
      console.log(`\nSurvey Response #${index + 1}:`);
      console.log(`  ID: ${survey.id}`);
      console.log(`  Zone: ${survey.zone || "No zone"}`);
      console.log(`  Score: ${survey.score}`);
      console.log(`  Created At: ${survey.createdAt}`);
    });

    // Get initial assessment data
    try {
      const assessment = await prisma.initialAssessment.findUnique({
        where: { studentId: STUDENT_ID },
      });

      console.log("\nINITIAL ASSESSMENT:");
      if (assessment) {
        console.log(
          `  Depression Score: ${
            assessment.depressionScore
          } (type: ${typeof assessment.depressionScore})`
        );
        console.log(
          `  Anxiety Score: ${
            assessment.anxietyScore
          } (type: ${typeof assessment.anxietyScore})`
        );
        console.log(
          `  Stress Score: ${
            assessment.stressScore
          } (type: ${typeof assessment.stressScore})`
        );
        console.log(`  Total Score: ${assessment.totalScore}`);
        console.log(`  Created At: ${assessment.createdAt}`);
      } else {
        console.log("  No initial assessment found");
      }
    } catch (error) {
      console.error("Error fetching initial assessment:", error);
    }

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
    console.error("Error checking student data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudentData();
