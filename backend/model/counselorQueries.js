const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const PDFDocument = require("pdfkit");
const { createObjectCsvStringifier } = require("csv-writer");
const { Pool } = require("pg");
const { normalizeZoneName } = require("./surveyQueries");

// Initialize database connection pool if DATABASE_URL is defined
let pool = null;
try {
  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  } else {
  }
} catch (error) {}

/**
 * Get counselor by user ID
 */
const getCounselorByUserId = async (userId) => {
  try {
    return await prisma.counselor.findFirst({
      where: {
        userId,
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get all students for counselor view
 */
const getAllStudents = async () => {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        user: {
          lastName: "asc",
        },
      },
    });

    // Format the student data
    return students.map((student) => ({
      id: student.id,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      email: student.user.email,
      avatar: student.user.avatar,
    }));
  } catch (error) {
    throw error;
  }
};

/**
 * Get surveys for a specific student
 */
const getStudentSurveys = async (studentId, startDate, endDate) => {
  try {
    // Special debugging for Ana Garcia
    const isAnaGarcia = studentId === "6926b287-6c08-4c3f-b2cb-bc72a4814ada";

    // Create date filter if provided
    let dateFilter = {};
    if (startDate && endDate) {
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999); // Include all of end date

      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: adjustedEndDate,
        },
      };
    }

    // Fetch surveys for this student
    const surveys = await prisma.surveyResponse.findMany({
      where: {
        studentId,
        ...dateFilter,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        answers: true,
        score: true,
        percentage: true,
        zone: true,
        createdAt: true,
        student: {
          select: {
            id: true,
          },
        },
      },
    });

    // Normalize zone names for all surveys
    const normalizedSurveys = surveys.map((survey) => ({
      ...survey,
      zone: normalizeZoneName(survey.zone),
    }));

    return normalizedSurveys;
  } catch (error) {
    throw error;
  }
};

/**
 * Get mood entries for a specific student
 */
const getStudentMoods = async (studentId, startDate, endDate) => {
  try {
    // Special debugging for Ana Garcia
    const isAnaGarcia = studentId === "6926b287-6c08-4c3f-b2cb-bc72a4814ada";

    // Create date filter if provided
    let dateFilter = {};
    if (startDate && endDate) {
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999); // Include all of end date

      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: adjustedEndDate,
        },
      };
    }

    // Fetch mood entries for this student
    const moods = await prisma.moodEntry.findMany({
      where: {
        studentId,
        ...dateFilter,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        moodLevel: true,
        notes: true,
        createdAt: true,
      },
    });

    return moods;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all interventions for a counselor
 */
const getCounselorInterventions = async (counselorId) => {
  try {
    return await prisma.intervention.findMany({
      where: {
        counselorId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new intervention plan
 */
const createIntervention = async (data) => {
  try {
    return await prisma.intervention.create({
      data,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get intervention by ID
 */
const getInterventionById = async (interventionId, counselorId) => {
  try {
    return await prisma.intervention.findFirst({
      where: {
        id: interventionId,
        counselorId,
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Update an existing intervention
 */
const updateIntervention = async (interventionId, data) => {
  try {
    return await prisma.intervention.update({
      where: {
        id: interventionId,
      },
      data,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Delete an intervention
 */
const deleteIntervention = async (interventionId) => {
  try {
    return await prisma.intervention.delete({
      where: {
        id: interventionId,
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Create a report record
 */
const createReport = async (data) => {
  try {
    return await prisma.report.create({
      data,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get all reports for a counselor
 */
const getCounselorReports = async (counselorId) => {
  try {
    return await prisma.report.findMany({
      where: {
        counselorId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get report by ID
 */
const getReportById = async (reportId, counselorId) => {
  try {
    return await prisma.report.findFirst({
      where: {
        id: reportId,
        counselorId,
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get student name by ID
 */
const getStudentName = async (studentId) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (student) {
      return `${student.user.firstName} ${student.user.lastName}`;
    }
    return "Unknown Student";
  } catch (error) {
    return "Unknown Student";
  }
};

/**
 * Generate report data based on parameters
 */
const generateReportData = async (
  counselorId,
  studentId,
  startDate,
  endDate,
  reportType
) => {
  try {
    // Calculate weekly averages
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDifference = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const weeksDifference = Math.max(1, Math.ceil(daysDifference / 7));

    // Get trends data for the period
    const moodTrends = await getMoodTrends(null, startDate, endDate);
    const dailyMoodTrends = await getDailyMoodTrends(startDate, endDate);
    const timeframeTrends = await getTimeframeTrends(null, startDate, endDate);

    // Calculate total responses from mood trends data
    const totalResponses = moodTrends
      ? moodTrends.reduce((total, trend) => {
          return (
            total +
            (trend["Green (Positive)"] || 0) +
            (trend["Yellow (Moderate)"] || 0) +
            (trend["Red (Needs Attention)"] || 0)
          );
        }, 0)
      : 0;

    // Calculate total mood entries from dailyMoodTrends
    const totalMoodEntries = dailyMoodTrends
      ? dailyMoodTrends.reduce((total, day) => {
          return (
            total +
            (day.positive || 0) +
            (day.moderate || 0) +
            (day.needsAttention || 0)
          );
        }, 0)
      : 0;

    // Calculate weekly averages
    const avgSurveyResponsesPerWeek = Math.round(
      totalResponses / weeksDifference
    );
    const avgMoodEntriesPerWeek = Math.round(
      totalMoodEntries / weeksDifference
    );

    // Calculate average mood
    const averageMood = calculateAverageMood(moodTrends || []);

    // Generate recommendations
    const recommendedActions = generateRecommendedActions({
      moodTrends: moodTrends || [],
      dailyMoodTrends: dailyMoodTrends || [],
      timeframeTrends: timeframeTrends || [],
    });

    // Format the date range for display
    const formattedStartDate = new Date(startDate).toLocaleDateString();
    const formattedEndDate = new Date(endDate).toLocaleDateString();

    return {
      title: `Mental Health Trends Report - ${
        reportType.charAt(0).toUpperCase() + reportType.slice(1)
      }`,
      period: `${formattedStartDate} to ${formattedEndDate}`,
      studentInfo:
        studentId === "all" ? "All Students" : await getStudentName(studentId),
      summary: {
        totalResponses: totalResponses,
        totalMoodEntries: totalMoodEntries,
        avgSurveyResponsesPerWeek: avgSurveyResponsesPerWeek,
        avgMoodEntriesPerWeek: avgMoodEntriesPerWeek,
        weeksCovered: weeksDifference,
        averageMood: averageMood,
        recommendedActions: recommendedActions,
      },
      charts: [
        { title: "Mental Health Zone Trends", type: "line" },
        { title: "Daily Mood Trends", type: "bar" },
        { title: "Time of Day Reporting", type: "pie" },
      ],
      // Include the trends data as well
      trends: {
        moodTrends: moodTrends || [],
        dailyMoodTrends: dailyMoodTrends || [],
        timeframeTrends: timeframeTrends || [],
      },
    };
  } catch (error) {
    console.error("Error generating report data:", error);
    throw new Error("Failed to generate report data");
  }
};

// Helper functions for counselor reports
const calculateAverageMood = (moodTrends) => {
  if (!moodTrends.length) return "No Data";

  let totalGreen = 0;
  let totalYellow = 0;
  let totalRed = 0;

  moodTrends.forEach((period) => {
    totalGreen += period["Green (Positive)"] || 0;
    totalYellow += period["Yellow (Moderate)"] || 0;
    totalRed += period["Red (Needs Attention)"] || 0;
  });

  const total = totalGreen + totalYellow + totalRed;

  if (total === 0) return "No Data";

  const weightedScore =
    (totalGreen * 3 + totalYellow * 2 + totalRed * 1) / total;

  if (weightedScore >= 2.5) return "Positive";
  if (weightedScore >= 1.5) return "Neutral";
  return "Negative";
};

const generateRecommendedActions = (trendsData) => {
  const recommendations = [];

  // Get the predominant mood
  const moodTrends = trendsData.moodTrends || [];
  const averageMood = calculateAverageMood(moodTrends);

  // Add mood-based recommendations
  if (averageMood === "Negative") {
    recommendations.push(
      "Schedule individual counseling sessions for students in red zones"
    );
    recommendations.push(
      "Implement group therapy sessions for stress management"
    );
    recommendations.push("Develop crisis intervention protocols");
  } else if (averageMood === "Neutral") {
    recommendations.push(
      "Monitor students closely and provide preventive interventions"
    );
    recommendations.push("Conduct mental health awareness workshops");
    recommendations.push("Establish peer support programs");
  } else if (averageMood === "Positive") {
    recommendations.push("Continue current supportive practices");
    recommendations.push(
      "Maintain regular check-ins to sustain positive trends"
    );
    recommendations.push("Share successful strategies with other counselors");
  } else {
    // No data case
    recommendations.push(
      "Encourage student participation in mental health assessments"
    );
    recommendations.push("Implement regular mental health screening programs");
    recommendations.push(
      "Provide information about available counseling resources"
    );
  }

  return recommendations.slice(0, 3); // Return top 3 recommendations
};

/**
 * Generate PDF report
 */
const generatePdfReport = (doc, data, options) => {
  try {
    // Add title and header
    doc
      .fontSize(24)
      .text(data.title || "Mental Health Trends Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Period: ${data.period}`, { align: "center" });
    doc.fontSize(12).text(`Student: ${data.studentInfo}`, { align: "center" });
    doc.moveDown(2);

    // Add summary section with weekly averages
    doc.fontSize(18).text("Summary", { underline: true });
    doc.moveDown();

    // Survey and Mood submission statistics
    doc.fontSize(14).text("Submission Statistics", { underline: true });
    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .text(`Period Covered: ${data.summary?.weeksCovered || 0} weeks`);
    doc.moveDown(0.3);
    doc.text(`Total Survey Responses: ${data.summary?.totalResponses || 0}`);
    doc.moveDown(0.3);
    doc.text(
      `Average Survey Responses per Week: ${
        data.summary?.avgSurveyResponsesPerWeek || 0
      }`
    );
    doc.moveDown(0.3);
    doc.text(`Total Mood Entries: ${data.summary?.totalMoodEntries || 0}`);
    doc.moveDown(0.3);
    doc.text(
      `Average Mood Entries per Week: ${
        data.summary?.avgMoodEntriesPerWeek || 0
      }`
    );
    doc.moveDown(0.3);
    doc.text(`Overall Mood Trend: ${data.summary?.averageMood || "No Data"}`);
    doc.moveDown(2);

    // Add recommendations section
    const recommendations = data.summary?.recommendedActions || [];
    if (recommendations.length > 0) {
      doc.fontSize(14).text("Recommended Actions", { underline: true });
      doc.moveDown(0.5);

      recommendations.forEach((action, index) => {
        doc.fontSize(12).text(`${index + 1}. ${action}`);
        doc.moveDown(0.4);
      });
      doc.moveDown();
    }

    // Add Mental Health Zone Trends Chart Data
    const moodTrends = data.trends?.moodTrends || [];
    if (moodTrends.length > 0) {
      doc.addPage();
      doc.fontSize(18).text("Mental Health Zone Trends", { underline: true });
      doc.moveDown();

      doc
        .fontSize(12)
        .text(
          "This data represents the distribution of students across mental health zones over time:",
          { align: "left" }
        );
      doc.moveDown();

      // Create a table for mood trends
      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidth = 110;

      // Table header
      doc.fontSize(11).fillColor("black");
      doc.text("Period", tableLeft, tableTop, { width: colWidth });
      doc.text("Green (Positive)", tableLeft + colWidth, tableTop, {
        width: colWidth,
      });
      doc.text("Yellow (Moderate)", tableLeft + colWidth * 2, tableTop, {
        width: colWidth,
      });
      doc.text("Red (Needs Attention)", tableLeft + colWidth * 3, tableTop, {
        width: colWidth,
      });
      doc.text("Total", tableLeft + colWidth * 4, tableTop, {
        width: colWidth,
      });

      // Draw header line
      doc
        .moveTo(tableLeft, tableTop + 15)
        .lineTo(tableLeft + colWidth * 5, tableTop + 15)
        .stroke();

      // Add data rows
      moodTrends.forEach((period, i) => {
        const y = tableTop + 25 + i * 20;

        // Calculate total for the row
        const total =
          (period["Green (Positive)"] || 0) +
          (period["Yellow (Moderate)"] || 0) +
          (period["Red (Needs Attention)"] || 0);

        doc.fontSize(10);
        doc.text(period.name || `Period ${i + 1}`, tableLeft, y, {
          width: colWidth,
        });
        doc.text(
          (period["Green (Positive)"] || 0).toString(),
          tableLeft + colWidth,
          y,
          { width: colWidth }
        );
        doc.text(
          (period["Yellow (Moderate)"] || 0).toString(),
          tableLeft + colWidth * 2,
          y,
          { width: colWidth }
        );
        doc.text(
          (period["Red (Needs Attention)"] || 0).toString(),
          tableLeft + colWidth * 3,
          y,
          { width: colWidth }
        );
        doc.text(total.toString(), tableLeft + colWidth * 4, y, {
          width: colWidth,
        });
      });
    }

    // Add Daily Mood Trends Chart Data
    const dailyMoodTrends = data.trends?.dailyMoodTrends || [];
    if (dailyMoodTrends.length > 0) {
      doc.addPage();
      doc.fontSize(18).text("Daily Mood Entry Trends", { underline: true });
      doc.moveDown();

      doc
        .fontSize(12)
        .text(
          "This data shows daily mood entry patterns based on mood levels:",
          { align: "left" }
        );
      doc.moveDown();

      // Create a table for daily mood trends
      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidth = 120;

      // Table header
      doc.fontSize(11).fillColor("black");
      doc.text("Date", tableLeft, tableTop, { width: colWidth });
      doc.text("Positive (4-5)", tableLeft + colWidth, tableTop, {
        width: colWidth,
      });
      doc.text("Moderate (2-3)", tableLeft + colWidth * 2, tableTop, {
        width: colWidth,
      });
      doc.text("Needs Attention (1)", tableLeft + colWidth * 3, tableTop, {
        width: colWidth,
      });

      // Draw header line
      doc
        .moveTo(tableLeft, tableTop + 15)
        .lineTo(tableLeft + colWidth * 4, tableTop + 15)
        .stroke();

      // Add data rows (limit to last 14 days to fit on page)
      const recentTrends = dailyMoodTrends.slice(-14);
      recentTrends.forEach((day, i) => {
        const y = tableTop + 25 + i * 18;

        doc.fontSize(10);
        doc.text(day.date || `Day ${i + 1}`, tableLeft, y, { width: colWidth });
        doc.text((day.positive || 0).toString(), tableLeft + colWidth, y, {
          width: colWidth,
        });
        doc.text((day.moderate || 0).toString(), tableLeft + colWidth * 2, y, {
          width: colWidth,
        });
        doc.text(
          (day.needsAttention || 0).toString(),
          tableLeft + colWidth * 3,
          y,
          { width: colWidth }
        );
      });

      if (dailyMoodTrends.length > 14) {
        doc.moveDown(2);
        doc
          .fontSize(10)
          .text(
            `Note: Showing last 14 days of data. Total days in period: ${dailyMoodTrends.length}`,
            { align: "center", fillColor: "gray" }
          );
      }
    }

    // Add Time of Day Reporting Chart Data
    const timeframeTrends = data.trends?.timeframeTrends || [];
    if (timeframeTrends.length > 0) {
      doc.addPage();
      doc
        .fontSize(18)
        .text("Time of Day Reporting Patterns", { underline: true });
      doc.moveDown();

      doc
        .fontSize(12)
        .text(
          "This data shows when students are most likely to submit mood entries:",
          { align: "left" }
        );
      doc.moveDown();

      // Create a simple list for timeframe data
      timeframeTrends.forEach((timeframe, i) => {
        doc.fontSize(14).text(`${timeframe.name}: ${timeframe.value} entries`);
        doc.moveDown(0.5);

        // Add a simple visual bar (text-based)
        const percentage =
          timeframeTrends.length > 0
            ? Math.round(
                (timeframe.value /
                  timeframeTrends.reduce((sum, t) => sum + t.value, 0)) *
                  100
              )
            : 0;

        doc
          .fontSize(12)
          .fillColor("gray")
          .text(`${percentage}% of total submissions`);
        doc.moveDown();
      });
    }

    // Add no data message if no trends are available
    if (
      moodTrends.length === 0 &&
      dailyMoodTrends.length === 0 &&
      (!timeframeTrends || timeframeTrends.length === 0)
    ) {
      doc.addPage();
      doc.fontSize(18).text("Chart Data", { underline: true });
      doc.moveDown();
      doc
        .fontSize(12)
        .text(
          "No trend data available for the selected period. This may be because:"
        );
      doc.moveDown();
      doc.text("• No survey responses were submitted during this period");
      doc.text("• No mood entries were recorded during this period");
      doc.text("• The selected date range contains no data");
      doc.moveDown();
      doc.text(
        "Please try selecting a different date range or encourage students to participate in surveys and mood tracking."
      );
    }

    // Add footer
    doc
      .fontSize(8)
      .fillColor("black")
      .text(
        "Confidential: This report contains sensitive mental health information and should be handled with care.",
        50,
        doc.page.height - 50,
        { align: "center", width: doc.page.width - 100 }
      );
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

/**
 * Generate CSV report
 */
const generateCsvReport = (data, options) => {
  // Create the CSV header
  const header = [
    { id: "category", title: "Category" },
    { id: "data", title: "Data" },
  ];

  // Create the CSV stringifier
  const csvStringifier = createObjectCsvStringifier({
    header,
  });

  // Create the summary data rows
  const summaryRows = [
    { category: "Report Title", data: data.title },
    { category: "Period", data: data.period },
    { category: "Student", data: data.studentInfo },
    { category: "Total Responses", data: data.summary.totalResponses },
    { category: "Average Mood", data: data.summary.averageMood },
    {
      category: "Top Issues",
      data: data.summary.recommendedActions.join(", "),
    },
  ];

  // Add recommendations if enabled
  if (options.includeRecommendations) {
    summaryRows.push({
      category: "Recommended Actions",
      data: data.summary.recommendedActions.join("; "),
    });
  }

  // Build the CSV output
  let csvOutput =
    csvStringifier.getHeaderString() +
    csvStringifier.stringifyRecords(summaryRows);

  // Add tables if enabled
  if (options.includeTables) {
    // Add mood trends
    csvOutput += "\n\nMood Trends\n";
    const moodTrendsHeader = [
      { id: "date", title: "Period" },
      { id: "average", title: "Average Mood" },
    ];
    const moodTrendsCsvStringifier = createObjectCsvStringifier({
      header: moodTrendsHeader,
    });
    csvOutput +=
      moodTrendsCsvStringifier.getHeaderString() +
      moodTrendsCsvStringifier.stringifyRecords(data.trends.moodTrends);

    // Add zone distribution
    csvOutput += "\n\nZone Distribution\n";
    const zoneHeader = [
      { id: "zone", title: "Zone" },
      { id: "count", title: "Count" },
    ];
    const zoneCsvStringifier = createObjectCsvStringifier({
      header: zoneHeader,
    });
    const zoneRows = data.trends.moodTrends.map((period) => ({
      zone: period.name,
      count: period["Green (Positive)"],
    }));
    csvOutput +=
      zoneCsvStringifier.getHeaderString() +
      zoneCsvStringifier.stringifyRecords(zoneRows);

    // Add issue distribution
    csvOutput += "\n\nIssue Distribution\n";
    const issueHeader = [
      { id: "issue", title: "Issue" },
      { id: "count", title: "Count" },
    ];
    const issueCsvStringifier = createObjectCsvStringifier({
      header: issueHeader,
    });
    csvOutput +=
      issueCsvStringifier.getHeaderString() +
      issueCsvStringifier.stringifyRecords(
        data.trends.moodTrends.map((period) => ({
          issue: period.name,
          count: period["Green (Positive)"],
        }))
      );
  }

  return csvOutput;
};

/**
 * Get student's initial assessment
 */
const getStudentInitialAssessment = async (studentId) => {
  try {
    const assessment = await prisma.initialAssessment.findUnique({
      where: { studentId },
      select: {
        depressionScore: true,
        anxietyScore: true,
        stressScore: true,
        totalScore: true,
        createdAt: true,
      },
    });

    if (!assessment) {
      throw new Error("Initial assessment not found");
    }

    return assessment;
  } catch (error) {
    throw error;
  }
};

/**
 * Get daily submission counts for mood entries and surveys
 */
const getDailySubmissionCounts = async () => {
  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get tomorrow's date at midnight
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get mood entry count for today
    const moodEntriesCount = await prisma.moodEntry.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get survey response count for today
    const surveyResponsesCount = await prisma.surveyResponse.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    return {
      date: today.toISOString(),
      moodEntriesCount,
      surveyResponsesCount,
    };
  } catch (error) {
    throw error;
  }
};

const getMoodTrends = async (period, startDate, endDate) => {
  try {
    // Calculate date range based on period or custom dates
    let dateFilter = {};

    if (startDate && endDate) {
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999); // Set to end of day

      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: adjustedEndDate,
        },
      };
    } else {
      // Default periods if no custom date range
      const now = new Date();
      now.setHours(23, 59, 59, 999); // Set to end of day

      switch (period) {
        case "week":
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - 6); // Changed from -7 to -6 to include today + 6 previous days
          weekStart.setHours(0, 0, 0, 0); // Set to start of day
          dateFilter = {
            createdAt: {
              gte: weekStart,
              lte: now,
            },
          };
          break;
        case "month":
          const monthStart = new Date(now);
          monthStart.setMonth(now.getMonth() - 1);
          monthStart.setHours(0, 0, 0, 0); // Set to start of day
          dateFilter = {
            createdAt: {
              gte: monthStart,
              lte: now,
            },
          };
          break;
        case "semester":
          const semesterStart = new Date(now);
          semesterStart.setMonth(now.getMonth() - 4);
          semesterStart.setHours(0, 0, 0, 0); // Set to start of day
          dateFilter = {
            createdAt: {
              gte: semesterStart,
              lte: now,
            },
          };
          break;
        default:
          const defaultStart = new Date(now);
          defaultStart.setMonth(now.getMonth() - 1);
          defaultStart.setHours(0, 0, 0, 0); // Set to start of day
          dateFilter = {
            createdAt: {
              gte: defaultStart,
              lte: now,
            },
          };
      }
    }

    // Fetch survey responses for the period
    const surveyResponses = await prisma.surveyResponse.findMany({
      where: {
        ...dateFilter,
      },
      select: {
        id: true,
        zone: true,
        createdAt: true,
        studentId: true,
        student: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Fetch mood entries for the same period
    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        ...dateFilter,
      },
      select: {
        id: true,
        moodLevel: true,
        createdAt: true,
        studentId: true,
        student: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Process data for mood trends over time using survey responses and zones
    const moodTrends = processMoodTrendsData(surveyResponses, period);

    return moodTrends;
  } catch (error) {
    throw error;
  }
};

const getDailyMoodTrends = async (startDate, endDate) => {
  try {
    // Create date filter if provided
    let dateFilter = {};
    if (startDate && endDate) {
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999); // Set to end of day

      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: adjustedEndDate,
        },
      };
    } else {
      // Default to past 7 days
      const now = new Date();
      now.setHours(23, 59, 59, 999); // Set to end of day

      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 6); // Changed from -7 to -6 to include today + 6 previous days
      weekStart.setHours(0, 0, 0, 0); // Set to start of day

      dateFilter = {
        createdAt: {
          gte: weekStart,
          lte: now,
        },
      };
    }

    // Fetch mood entries for the period
    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        ...dateFilter,
      },
      select: {
        id: true,
        moodLevel: true,
        createdAt: true,
        studentId: true,
        student: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Process data for daily mood trends
    return processDailyMoodTrends(moodEntries);
  } catch (error) {
    throw error;
  }
};

const getTimeframeTrends = async (period, startDate, endDate) => {
  try {
    // Create date filter if provided
    let dateFilter = {};
    if (startDate && endDate) {
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999); // Set to end of day

      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: adjustedEndDate,
        },
      };
    } else {
      // Default periods if no custom date range
      const now = new Date();
      now.setHours(23, 59, 59, 999); // Set to end of day

      switch (period) {
        case "week":
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - 6); // Changed from -7 to -6 to include today + 6 previous days
          weekStart.setHours(0, 0, 0, 0); // Set to start of day
          dateFilter = {
            createdAt: {
              gte: weekStart,
              lte: now,
            },
          };
          break;
        default:
          const defaultStart = new Date(now);
          defaultStart.setMonth(now.getMonth() - 1);
          defaultStart.setHours(0, 0, 0, 0); // Set to start of day
          dateFilter = {
            createdAt: {
              gte: defaultStart,
              lte: now,
            },
          };
      }
    }

    // Fetch mood entries for the period
    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        ...dateFilter,
      },
      select: {
        id: true,
        moodLevel: true,
        createdAt: true,
        studentId: true,
      },
    });

    // Process time of day data
    return processTimeOfDayData(moodEntries);
  } catch (error) {
    throw error;
  }
};

/**
 * Process time of day reporting data
 */
const processTimeOfDayData = (entries) => {
  if (!entries.length) return [];

  const timeframes = {
    Morning: { name: "Morning", value: 0 },
    Afternoon: { name: "Afternoon", value: 0 },
    Evening: { name: "Evening", value: 0 },
  };

  entries.forEach((entry) => {
    const hour = new Date(entry.createdAt).getHours();

    if (hour >= 5 && hour < 12) {
      timeframes.Morning.value++;
    } else if (hour >= 12 && hour < 18) {
      timeframes.Afternoon.value++;
    } else {
      timeframes.Evening.value++;
    }
  });

  return Object.values(timeframes);
};

// Helper functions
const processMoodTrendsData = (responses, period) => {
  if (!responses || !responses.length) {
    return [];
  }

  // Group by time period
  const groupedByPeriod = {};

  // For sorting days of the week properly
  const dayOrder = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };

  // Get current day of week for reference
  const now = new Date();
  const currentDayName = now
    .toLocaleDateString("en-US", { weekday: "short" })
    .slice(0, 3);

  // Initialize all days of week if in weekly view to ensure we have entries for each day
  if (period === "week") {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    dayNames.forEach((day) => {
      groupedByPeriod[day] = {
        name: day,
        "Green (Positive)": 0,
        "Yellow (Moderate)": 0,
        "Red (Needs Attention)": 0,
        count: 0,
      };
    });
  }

  responses.forEach((response) => {
    if (!response || !response.createdAt) {
      return; // Skip this response
    }

    let key;
    const date = new Date(response.createdAt);

    switch (period) {
      case "week":
        // Group by day of week (short format)
        key = date
          .toLocaleDateString("en-US", { weekday: "short" })
          .slice(0, 3);
        break;
      case "month":
        // Group by week
        const weekNum = Math.ceil(date.getDate() / 7);
        key = `Week ${weekNum}`;
        break;
      case "semester":
        // Group by month
        key = date.toLocaleDateString("en-US", { month: "short" });
        break;
      default:
        // Default to grouping by week
        const defaultWeekNum = Math.ceil(date.getDate() / 7);
        key = `Week ${defaultWeekNum}`;
    }

    if (!groupedByPeriod[key]) {
      groupedByPeriod[key] = {
        name: key,
        "Green (Positive)": 0,
        "Yellow (Moderate)": 0,
        "Red (Needs Attention)": 0,
        count: 0,
      };
    }

    // Map the zone value to the correct category
    if (response.zone) {
      if (response.zone === "Green" || response.zone === "Green (Positive)") {
        groupedByPeriod[key]["Green (Positive)"]++;
      } else if (
        response.zone === "Yellow" ||
        response.zone === "Yellow (Moderate)"
      ) {
        groupedByPeriod[key]["Yellow (Moderate)"]++;
      } else if (
        response.zone === "Red" ||
        response.zone === "Red (Needs Attention)"
      ) {
        groupedByPeriod[key]["Red (Needs Attention)"]++;
      }
    }

    groupedByPeriod[key].count++;
  });

  // Convert to array and sort
  let result = Object.values(groupedByPeriod);

  if (period === "week") {
    // Sort by day of week
    result.sort((a, b) => {
      return (dayOrder[a.name] || 0) - (dayOrder[b.name] || 0);
    });
  } else if (period === "month") {
    // Sort by week number
    result.sort((a, b) => {
      if (a.name.startsWith("Week") && b.name.startsWith("Week")) {
        return (
          parseInt(a.name.split(" ")[1] || "0") -
          parseInt(b.name.split(" ")[1] || "0")
        );
      }
      return 0;
    });
  }

  return result;
};

const processDailyMoodTrends = (moodEntries) => {
  if (!moodEntries || !moodEntries.length) {
    return [];
  }

  // Group entries by date
  const groupedByDate = {};

  moodEntries.forEach((entry) => {
    if (!entry || !entry.createdAt) {
      return; // Skip this entry
    }

    const date = new Date(entry.createdAt).toLocaleDateString();

    if (!groupedByDate[date]) {
      groupedByDate[date] = {
        date,
        positive: 0,
        moderate: 0,
        needsAttention: 0,
      };
    }

    // Categorize mood levels
    if (typeof entry.moodLevel === "number") {
      if (entry.moodLevel >= 4) {
        groupedByDate[date].positive++;
      } else if (entry.moodLevel >= 2) {
        groupedByDate[date].moderate++;
      } else {
        groupedByDate[date].needsAttention++;
      }
    }
  });

  // Convert to array and sort by date
  const result = Object.values(groupedByDate).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  return result;
};

/**
 * Get individual student by ID
 */
const getStudentById = async (studentId) => {
  try {
    const student = await prisma.student.findUnique({
      where: {
        id: studentId,
      },
      select: {
        id: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!student) {
      return null;
    }

    // Format the student data
    return {
      id: student.id,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      email: student.user.email,
      avatar: student.user.avatar,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getCounselorByUserId,
  getAllStudents,
  getStudentSurveys,
  getStudentMoods,
  getCounselorInterventions,
  createIntervention,
  getInterventionById,
  updateIntervention,
  deleteIntervention,
  createReport,
  getCounselorReports,
  getReportById,
  getStudentName,
  generateReportData,
  generatePdfReport,
  generateCsvReport,
  getStudentInitialAssessment,
  getDailySubmissionCounts,
  getMoodTrends,
  getDailyMoodTrends,
  getTimeframeTrends,
  getStudentById,
};
