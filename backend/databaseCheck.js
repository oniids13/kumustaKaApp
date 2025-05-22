const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("Checking database for survey responses and mood entries...");

    // Get all students
    const students = await prisma.student.findMany({
      select: {
        id: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    console.log(`Found ${students.length} students`);

    // Check each student's survey responses and mood entries
    for (const student of students) {
      const fullName = `${student.user.firstName} ${student.user.lastName}`;
      console.log(`\n--- Checking data for ${fullName} ---`);

      // Get survey responses for this student
      const surveyResponses = await prisma.surveyResponse.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
      });

      console.log(`Survey responses: ${surveyResponses.length}`);

      // Get mood entries for this student
      const moodEntries = await prisma.moodEntry.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
      });

      console.log(`Mood entries: ${moodEntries.length}`);

      // Check for multiple entries on the same day
      const surveyDates = new Map();
      const moodDates = new Map();
      let duplicateSurveyDays = 0;
      let duplicateMoodDays = 0;

      // Check survey responses
      for (const response of surveyResponses) {
        const date = response.createdAt.toISOString().split("T")[0];
        if (surveyDates.has(date)) {
          duplicateSurveyDays++;
          console.log(`  ❌ DUPLICATE SURVEY: ${date}`);
        } else {
          surveyDates.set(date, true);
        }
      }

      // Check mood entries
      for (const entry of moodEntries) {
        const date = entry.createdAt.toISOString().split("T")[0];
        if (moodDates.has(date)) {
          duplicateMoodDays++;
          console.log(`  ❌ DUPLICATE MOOD: ${date}`);
        } else {
          moodDates.set(date, true);
        }
      }

      // Report results
      if (duplicateSurveyDays === 0 && duplicateMoodDays === 0) {
        console.log(`  ✅ All good! No duplicate entries found.`);
      } else {
        console.log(
          `  Found ${duplicateSurveyDays} days with multiple surveys`
        );
        console.log(
          `  Found ${duplicateMoodDays} days with multiple mood entries`
        );
      }
    }

    console.log("\n=== Summary ===");
    const totalSurveys = await prisma.surveyResponse.count();
    const totalMoods = await prisma.moodEntry.count();
    console.log(`Total survey responses in database: ${totalSurveys}`);
    console.log(`Total mood entries in database: ${totalMoods}`);
    console.log(
      `Average survey responses per student: ${(
        totalSurveys / students.length
      ).toFixed(1)}`
    );
    console.log(
      `Average mood entries per student: ${(
        totalMoods / students.length
      ).toFixed(1)}`
    );
  } catch (error) {
    console.error("Error checking database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase().catch(console.error);
