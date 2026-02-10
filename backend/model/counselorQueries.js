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
 * Get counselor's assigned sections
 */
const getCounselorSections = async (userId) => {
  try {
    const counselor = await prisma.counselor.findFirst({
      where: { userId },
      include: {
        sections: {
          select: {
            id: true,
            name: true,
            code: true,
            gradeLevel: true,
            isActive: true,
            _count: {
              select: { students: true },
            },
          },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!counselor) {
      throw new Error("Counselor not found");
    }

    return counselor.sections.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      gradeLevel: s.gradeLevel,
      isActive: s.isActive,
      studentCount: s._count.students,
    }));
  } catch (error) {
    throw error;
  }
};

/**
 * Get all students for counselor view (optionally filtered by section)
 */
const getAllStudents = async (sectionId) => {
  try {
    const whereClause = {};
    if (sectionId) {
      whereClause.sectionId = sectionId;
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      select: {
        id: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            gender: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            code: true,
            gradeLevel: true,
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
      gender: student.user.gender,
      section: student.section,
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
  reportType,
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
      totalResponses / weeksDifference,
    );
    const avgMoodEntriesPerWeek = Math.round(
      totalMoodEntries / weeksDifference,
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
      "Schedule individual counseling sessions for students in red zones",
    );
    recommendations.push(
      "Implement group therapy sessions for stress management",
    );
    recommendations.push("Develop crisis intervention protocols");
  } else if (averageMood === "Neutral") {
    recommendations.push(
      "Monitor students closely and provide preventive interventions",
    );
    recommendations.push("Conduct mental health awareness workshops");
    recommendations.push("Establish peer support programs");
  } else if (averageMood === "Positive") {
    recommendations.push("Continue current supportive practices");
    recommendations.push(
      "Maintain regular check-ins to sustain positive trends",
    );
    recommendations.push("Share successful strategies with other counselors");
  } else {
    // No data case
    recommendations.push(
      "Encourage student participation in mental health assessments",
    );
    recommendations.push("Implement regular mental health screening programs");
    recommendations.push(
      "Provide information about available counseling resources",
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
      }`,
    );
    doc.moveDown(0.3);
    doc.text(`Total Mood Entries: ${data.summary?.totalMoodEntries || 0}`);
    doc.moveDown(0.3);
    doc.text(
      `Average Mood Entries per Week: ${
        data.summary?.avgMoodEntriesPerWeek || 0
      }`,
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
          { align: "left" },
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
          { width: colWidth },
        );
        doc.text(
          (period["Yellow (Moderate)"] || 0).toString(),
          tableLeft + colWidth * 2,
          y,
          { width: colWidth },
        );
        doc.text(
          (period["Red (Needs Attention)"] || 0).toString(),
          tableLeft + colWidth * 3,
          y,
          { width: colWidth },
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
          { align: "left" },
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
          { width: colWidth },
        );
      });

      if (dailyMoodTrends.length > 14) {
        doc.moveDown(2);
        doc
          .fontSize(10)
          .text(
            `Note: Showing last 14 days of data. Total days in period: ${dailyMoodTrends.length}`,
            { align: "center", fillColor: "gray" },
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
          { align: "left" },
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
                  100,
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
          "No trend data available for the selected period. This may be because:",
        );
      doc.moveDown();
      doc.text("• No survey responses were submitted during this period");
      doc.text("• No mood entries were recorded during this period");
      doc.text("• The selected date range contains no data");
      doc.moveDown();
      doc.text(
        "Please try selecting a different date range or encourage students to participate in surveys and mood tracking.",
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
        { align: "center", width: doc.page.width - 100 },
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
        })),
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
 * Get daily submission counts for mood entries and surveys (optionally filtered by section)
 */
const getDailySubmissionCounts = async (sectionId) => {
  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get tomorrow's date at midnight
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateFilter = {
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    };

    // Build where clause with optional section filter
    const moodWhere = { ...dateFilter };
    const surveyWhere = { ...dateFilter };

    if (sectionId) {
      moodWhere.student = { sectionId };
      surveyWhere.student = { sectionId };
    }

    // Get mood entry count for today
    const moodEntriesCount = await prisma.moodEntry.count({
      where: moodWhere,
    });

    // Get survey response count for today
    const surveyResponsesCount = await prisma.surveyResponse.count({
      where: surveyWhere,
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
    (a, b) => new Date(a.date) - new Date(b.date),
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
            gender: true,
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
      gender: student.user.gender,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get comprehensive student profile for counselor view
 */
const getStudentProfile = async (studentId) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            phone: true,
            gender: true,
            createdAt: true,
            lastLogin: true,
            updatedAt: true,
            role: true,
            status: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            code: true,
            gradeLevel: true,
          },
        },
        emergencyContacts: {
          orderBy: { isPrimary: "desc" },
        },
        initialAssessment: true,
        goals: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        moodEntries: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        surveys: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        journals: {
          select: {
            id: true,
            createdAt: true,
            isPrivate: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        interventions: {
          include: {
            counselor: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!student) {
      return null;
    }

    return student;
  } catch (error) {
    console.error("Error fetching student profile:", error);
    throw error;
  }
};

/**
 * Get comprehensive analytics dashboard data
 */
const getComprehensiveAnalytics = async (counselorUserId, sectionId, period) => {
  try {
    // Get counselor's sections
    const counselor = await prisma.counselor.findFirst({
      where: { userId: counselorUserId },
      include: { sections: { select: { id: true, name: true, gradeLevel: true } } },
    });

    if (!counselor) throw new Error("Counselor not found");

    // Determine which sections to analyze
    let targetSections = counselor.sections;
    if (sectionId) {
      targetSections = targetSections.filter((s) => s.id === sectionId);
    }
    const sectionIds = targetSections.map((s) => s.id);

    // Calculate date ranges based on period
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    let periodStart;
    switch (period) {
      case "3months":
        periodStart = new Date(now);
        periodStart.setMonth(now.getMonth() - 3);
        break;
      case "6months":
        periodStart = new Date(now);
        periodStart.setMonth(now.getMonth() - 6);
        break;
      case "12months":
        periodStart = new Date(now);
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
      default: // 1month
        periodStart = new Date(now);
        periodStart.setMonth(now.getMonth() - 1);
    }
    periodStart.setHours(0, 0, 0, 0);

    const dateFilter = { createdAt: { gte: periodStart, lte: now } };

    // Base where clause for students in target sections
    const studentFilter = sectionIds.length > 0 ? { sectionId: { in: sectionIds } } : {};

    // =====================
    // 1. FETCH ALL RAW DATA
    // =====================
    const students = await prisma.student.findMany({
      where: studentFilter,
      select: {
        id: true,
        sectionId: true,
        user: { select: { gender: true, firstName: true, lastName: true } },
      },
    });

    const studentIds = students.map((s) => s.id);

    const [surveyResponses, moodEntries, initialAssessments, interventions] = await Promise.all([
      prisma.surveyResponse.findMany({
        where: { studentId: { in: studentIds }, ...dateFilter },
        select: { id: true, zone: true, score: true, percentage: true, createdAt: true, studentId: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.moodEntry.findMany({
        where: { studentId: { in: studentIds }, ...dateFilter },
        select: { id: true, moodLevel: true, createdAt: true, studentId: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.initialAssessment.findMany({
        where: { studentId: { in: studentIds } },
        select: { studentId: true, anxietyScore: true, depressionScore: true, stressScore: true, totalScore: true },
      }),
      prisma.intervention.findMany({
        where: { counselorId: counselor.id, studentId: { in: studentIds } },
        select: { id: true, status: true, studentId: true },
      }),
    ]);

    // Build student lookup maps
    const studentById = {};
    students.forEach((s) => {
      studentById[s.id] = s;
    });

    // =====================
    // 2. GENDER ANALYTICS
    // =====================
    const genderGroups = {};
    students.forEach((s) => {
      const g = s.user.gender || "UNKNOWN";
      if (!genderGroups[g]) genderGroups[g] = { studentIds: [], label: g };
      genderGroups[g].studentIds.push(s.id);
    });

    const genderAnalytics = Object.entries(genderGroups).map(([gender, group]) => {
      const gSurveys = surveyResponses.filter((sr) => group.studentIds.includes(sr.studentId));
      const gMoods = moodEntries.filter((m) => group.studentIds.includes(m.studentId));
      const gAssessments = initialAssessments.filter((a) => group.studentIds.includes(a.studentId));

      const zones = { green: 0, yellow: 0, red: 0 };
      gSurveys.forEach((sr) => {
        const z = normalizeZoneName(sr.zone);
        if (z && z.startsWith("Green")) zones.green++;
        else if (z && z.startsWith("Yellow")) zones.yellow++;
        else if (z && z.startsWith("Red")) zones.red++;
      });

      const totalSurveys = zones.green + zones.yellow + zones.red;
      const avgMood = gMoods.length > 0
        ? +(gMoods.reduce((sum, m) => sum + m.moodLevel, 0) / gMoods.length).toFixed(2)
        : null;

      const avgAnxiety = gAssessments.length > 0
        ? +(gAssessments.reduce((s, a) => s + a.anxietyScore, 0) / gAssessments.length).toFixed(1)
        : null;
      const avgDepression = gAssessments.length > 0
        ? +(gAssessments.reduce((s, a) => s + a.depressionScore, 0) / gAssessments.length).toFixed(1)
        : null;
      const avgStress = gAssessments.length > 0
        ? +(gAssessments.reduce((s, a) => s + a.stressScore, 0) / gAssessments.length).toFixed(1)
        : null;

      return {
        gender: gender === "PREFER_NOT_TO_SAY" ? "Prefer Not To Say" : gender.charAt(0) + gender.slice(1).toLowerCase(),
        totalStudents: group.studentIds.length,
        zones,
        totalSurveys,
        avgMood,
        avgAnxiety,
        avgDepression,
        avgStress,
        redZonePercentage: totalSurveys > 0 ? +((zones.red / totalSurveys) * 100).toFixed(1) : 0,
      };
    });

    // =====================
    // 3. SECTION COMPARISON
    // =====================
    const sectionAnalytics = targetSections.map((section) => {
      const sStudents = students.filter((s) => s.sectionId === section.id);
      const sStudentIds = sStudents.map((s) => s.id);
      const sSurveys = surveyResponses.filter((sr) => sStudentIds.includes(sr.studentId));
      const sMoods = moodEntries.filter((m) => sStudentIds.includes(m.studentId));
      const sAssessments = initialAssessments.filter((a) => sStudentIds.includes(a.studentId));

      const zones = { green: 0, yellow: 0, red: 0 };
      sSurveys.forEach((sr) => {
        const z = normalizeZoneName(sr.zone);
        if (z && z.startsWith("Green")) zones.green++;
        else if (z && z.startsWith("Yellow")) zones.yellow++;
        else if (z && z.startsWith("Red")) zones.red++;
      });
      const totalSurveys = zones.green + zones.yellow + zones.red;
      const avgMood = sMoods.length > 0
        ? +(sMoods.reduce((sum, m) => sum + m.moodLevel, 0) / sMoods.length).toFixed(2)
        : null;

      // Participation rate: students who submitted at least one survey
      const studentsWithSurveys = new Set(sSurveys.map((sr) => sr.studentId)).size;
      const participationRate = sStudents.length > 0 ? +((studentsWithSurveys / sStudents.length) * 100).toFixed(1) : 0;

      const avgAnxiety = sAssessments.length > 0
        ? +(sAssessments.reduce((s, a) => s + a.anxietyScore, 0) / sAssessments.length).toFixed(1)
        : null;
      const avgDepression = sAssessments.length > 0
        ? +(sAssessments.reduce((s, a) => s + a.depressionScore, 0) / sAssessments.length).toFixed(1)
        : null;
      const avgStress = sAssessments.length > 0
        ? +(sAssessments.reduce((s, a) => s + a.stressScore, 0) / sAssessments.length).toFixed(1)
        : null;

      return {
        sectionId: section.id,
        sectionName: section.name,
        gradeLevel: section.gradeLevel,
        totalStudents: sStudents.length,
        zones,
        totalSurveys,
        avgMood,
        participationRate,
        avgAnxiety,
        avgDepression,
        avgStress,
      };
    });

    // =====================
    // 4. MONTHLY TRENDS
    // =====================
    const monthlyMap = {};
    surveyResponses.forEach((sr) => {
      const key = `${sr.createdAt.getFullYear()}-${String(sr.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap[key]) monthlyMap[key] = { green: 0, yellow: 0, red: 0, moodSum: 0, moodCount: 0 };
      const z = normalizeZoneName(sr.zone);
      if (z && z.startsWith("Green")) monthlyMap[key].green++;
      else if (z && z.startsWith("Yellow")) monthlyMap[key].yellow++;
      else if (z && z.startsWith("Red")) monthlyMap[key].red++;
    });
    moodEntries.forEach((m) => {
      const key = `${m.createdAt.getFullYear()}-${String(m.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap[key]) monthlyMap[key] = { green: 0, yellow: 0, red: 0, moodSum: 0, moodCount: 0 };
      monthlyMap[key].moodSum += m.moodLevel;
      monthlyMap[key].moodCount++;
    });

    const monthlyTrends = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        monthLabel: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        ...data,
        totalSurveys: data.green + data.yellow + data.red,
        avgMood: data.moodCount > 0 ? +(data.moodSum / data.moodCount).toFixed(2) : null,
        redPercentage: (data.green + data.yellow + data.red) > 0
          ? +((data.red / (data.green + data.yellow + data.red)) * 100).toFixed(1) : 0,
      }));

    // =====================
    // 5. QUARTERLY TRENDS
    // =====================
    const quarterlyMap = {};
    surveyResponses.forEach((sr) => {
      const q = Math.ceil((sr.createdAt.getMonth() + 1) / 3);
      const key = `${sr.createdAt.getFullYear()}-Q${q}`;
      if (!quarterlyMap[key]) quarterlyMap[key] = { green: 0, yellow: 0, red: 0, moodSum: 0, moodCount: 0 };
      const z = normalizeZoneName(sr.zone);
      if (z && z.startsWith("Green")) quarterlyMap[key].green++;
      else if (z && z.startsWith("Yellow")) quarterlyMap[key].yellow++;
      else if (z && z.startsWith("Red")) quarterlyMap[key].red++;
    });
    moodEntries.forEach((m) => {
      const q = Math.ceil((m.createdAt.getMonth() + 1) / 3);
      const key = `${m.createdAt.getFullYear()}-Q${q}`;
      if (!quarterlyMap[key]) quarterlyMap[key] = { green: 0, yellow: 0, red: 0, moodSum: 0, moodCount: 0 };
      quarterlyMap[key].moodSum += m.moodLevel;
      quarterlyMap[key].moodCount++;
    });

    const quarterlyTrends = Object.entries(quarterlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([quarter, data]) => ({
        quarter,
        ...data,
        totalSurveys: data.green + data.yellow + data.red,
        avgMood: data.moodCount > 0 ? +(data.moodSum / data.moodCount).toFixed(2) : null,
        redPercentage: (data.green + data.yellow + data.red) > 0
          ? +((data.red / (data.green + data.yellow + data.red)) * 100).toFixed(1) : 0,
      }));

    // =====================
    // 6. RISK INDICATORS
    // =====================
    // Get latest survey per student to determine current zone
    const latestSurveyByStudent = {};
    surveyResponses.forEach((sr) => {
      if (!latestSurveyByStudent[sr.studentId] || sr.createdAt > latestSurveyByStudent[sr.studentId].createdAt) {
        latestSurveyByStudent[sr.studentId] = sr;
      }
    });

    let highRisk = 0, moderateRisk = 0, lowRisk = 0;
    Object.values(latestSurveyByStudent).forEach((sr) => {
      const z = normalizeZoneName(sr.zone);
      if (z && z.startsWith("Red")) highRisk++;
      else if (z && z.startsWith("Yellow")) moderateRisk++;
      else lowRisk++;
    });

    // Students with declining mood (compare last 7 days avg vs previous 7 days avg)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const decliningStudents = [];
    studentIds.forEach((sid) => {
      const recentMoods = moodEntries.filter((m) => m.studentId === sid && m.createdAt >= sevenDaysAgo);
      const previousMoods = moodEntries.filter((m) => m.studentId === sid && m.createdAt >= fourteenDaysAgo && m.createdAt < sevenDaysAgo);

      if (recentMoods.length >= 2 && previousMoods.length >= 2) {
        const recentAvg = recentMoods.reduce((s, m) => s + m.moodLevel, 0) / recentMoods.length;
        const prevAvg = previousMoods.reduce((s, m) => s + m.moodLevel, 0) / previousMoods.length;
        if (recentAvg < prevAvg - 0.5) {
          decliningStudents.push(sid);
        }
      }
    });

    // Students with low participation (no survey in last 14 days)
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const recentSurveyStudents = new Set(
      surveyResponses.filter((sr) => sr.createdAt >= twoWeeksAgo).map((sr) => sr.studentId)
    );
    const lowParticipation = studentIds.filter((sid) => !recentSurveyStudents.has(sid));

    const riskIndicators = {
      highRisk,
      moderateRisk,
      lowRisk,
      decliningMoodCount: decliningStudents.length,
      lowParticipationCount: lowParticipation.length,
      totalStudents: students.length,
      activeInterventions: interventions.filter((i) => i.status !== "COMPLETED").length,
      completedInterventions: interventions.filter((i) => i.status === "COMPLETED").length,
    };

    // =====================
    // 7. OVERALL STATS
    // =====================
    const totalSurveyResponses = surveyResponses.length;
    const totalMoodEntries = moodEntries.length;
    const overallAvgMood = moodEntries.length > 0
      ? +(moodEntries.reduce((s, m) => s + m.moodLevel, 0) / moodEntries.length).toFixed(2)
      : null;
    const overallAvgScore = surveyResponses.length > 0
      ? +(surveyResponses.reduce((s, sr) => s + sr.percentage, 0) / surveyResponses.length).toFixed(1)
      : null;
    const overallParticipation = students.length > 0
      ? +((new Set(surveyResponses.map((sr) => sr.studentId)).size / students.length) * 100).toFixed(1)
      : 0;

    // DASS-21 category averages from initial assessments
    const assessmentStats = initialAssessments.length > 0 ? {
      avgAnxiety: +(initialAssessments.reduce((s, a) => s + a.anxietyScore, 0) / initialAssessments.length).toFixed(1),
      avgDepression: +(initialAssessments.reduce((s, a) => s + a.depressionScore, 0) / initialAssessments.length).toFixed(1),
      avgStress: +(initialAssessments.reduce((s, a) => s + a.stressScore, 0) / initialAssessments.length).toFixed(1),
      avgTotal: +(initialAssessments.reduce((s, a) => s + a.totalScore, 0) / initialAssessments.length).toFixed(1),
    } : null;

    // =====================
    // 8. PRESCRIPTIVE INSIGHTS
    // =====================
    const insights = [];

    // --- CRITICAL: Students currently in Red Zone ---
    if (highRisk > 0) {
      const redStudentIds = Object.entries(latestSurveyByStudent)
        .filter(([, sr]) => normalizeZoneName(sr.zone)?.startsWith("Red"))
        .map(([sid]) => sid);
      const redStudentNames = redStudentIds
        .map((sid) => studentById[sid])
        .filter(Boolean)
        .map((s) => `${s.user.firstName} ${s.user.lastName}`)
        .slice(0, 5);
      const moreCount = redStudentIds.length > 5 ? ` and ${redStudentIds.length - 5} more` : "";
      insights.push({
        type: "critical",
        severity: "high",
        title: "Students Requiring Immediate Attention",
        description: `${highRisk} student(s) are currently in the Red Zone: ${redStudentNames.join(", ")}${moreCount}. Their latest survey scores indicate they need immediate support.`,
        recommendation: "Schedule individual counseling sessions with these students within 24-48 hours. Conduct a risk assessment, create or update intervention plans, and consider notifying parents/guardians. If any student shows signs of self-harm, escalate to crisis protocols immediately.",
      });
    }

    // --- CRITICAL: Students with persistently low mood (avg <= 2 over past 7 days) ---
    const persistentlyLowMoodStudents = [];
    studentIds.forEach((sid) => {
      const recentMoods = moodEntries.filter((m) => m.studentId === sid && m.createdAt >= sevenDaysAgo);
      if (recentMoods.length >= 3) {
        const avg = recentMoods.reduce((s, m) => s + m.moodLevel, 0) / recentMoods.length;
        if (avg <= 2.0) {
          persistentlyLowMoodStudents.push({ sid, avg: avg.toFixed(1) });
        }
      }
    });
    if (persistentlyLowMoodStudents.length > 0) {
      const names = persistentlyLowMoodStudents
        .map((s) => studentById[s.sid])
        .filter(Boolean)
        .map((s) => `${s.user.firstName} ${s.user.lastName}`)
        .slice(0, 5);
      insights.push({
        type: "critical",
        severity: "high",
        title: "Persistently Low Mood Detected",
        description: `${persistentlyLowMoodStudents.length} student(s) have maintained an average mood of 2.0 or below over the past 7 days (${names.join(", ")}${persistentlyLowMoodStudents.length > 5 ? " and more" : ""}). This sustained pattern signals deeper emotional distress.`,
        recommendation: "Conduct one-on-one wellness checks as a priority. Explore underlying causes such as academic pressure, family issues, or social difficulties. Develop personalized coping strategies and consider referral to a clinical psychologist if patterns persist beyond 2 weeks.",
      });
    }

    // --- WARNING: Declining mood trends ---
    if (decliningStudents.length > 0) {
      const names = decliningStudents
        .map((sid) => studentById[sid])
        .filter(Boolean)
        .map((s) => `${s.user.firstName} ${s.user.lastName}`)
        .slice(0, 5);
      insights.push({
        type: "warning",
        severity: "medium",
        title: "Declining Mood Trends Detected",
        description: `${decliningStudents.length} student(s) show a significant decline in mood over the past week compared to the previous week (${names.join(", ")}${decliningStudents.length > 5 ? " and more" : ""}). Early intervention can prevent further deterioration.`,
        recommendation: "Proactively reach out to these students for a wellness check. Review their recent journal entries and survey responses for context. Consider adjusting their current support plans and scheduling follow-up sessions within the week.",
      });
    }

    // --- WARNING: Students with high DASS-21 anxiety scores ---
    if (initialAssessments.length > 0) {
      const highAnxiety = initialAssessments.filter((a) => a.anxietyScore > 15);
      const highDepression = initialAssessments.filter((a) => a.depressionScore > 14);
      const highStress = initialAssessments.filter((a) => a.stressScore > 19);

      if (highAnxiety.length > 0) {
        const pct = ((highAnxiety.length / initialAssessments.length) * 100).toFixed(0);
        const names = highAnxiety
          .map((a) => studentById[a.studentId])
          .filter(Boolean)
          .map((s) => `${s.user.firstName} ${s.user.lastName}`)
          .slice(0, 4);
        insights.push({
          type: "warning",
          severity: "high",
          title: "Elevated Anxiety Levels (DASS-21)",
          description: `${highAnxiety.length} student(s) (${pct}%) scored in the severe anxiety range on their initial DASS-21 assessment (${names.join(", ")}${highAnxiety.length > 4 ? " and more" : ""}). Anxiety scores above 15 indicate clinically significant symptoms.`,
          recommendation: "Implement anxiety-focused interventions: teach deep breathing and grounding techniques, provide psychoeducation on anxiety management, and consider Cognitive Behavioral Therapy (CBT) referrals. Assess if academic workload or social factors are contributing and coordinate with teachers to reduce pressure where appropriate.",
        });
      }

      if (highDepression.length > 0) {
        const pct = ((highDepression.length / initialAssessments.length) * 100).toFixed(0);
        const names = highDepression
          .map((a) => studentById[a.studentId])
          .filter(Boolean)
          .map((s) => `${s.user.firstName} ${s.user.lastName}`)
          .slice(0, 4);
        insights.push({
          type: "critical",
          severity: "high",
          title: "Elevated Depression Levels (DASS-21)",
          description: `${highDepression.length} student(s) (${pct}%) scored in the severe depression range on DASS-21 (${names.join(", ")}${highDepression.length > 4 ? " and more" : ""}). Depression scores above 14 warrant clinical attention.`,
          recommendation: "Prioritize these students for regular counseling sessions. Monitor for signs of social withdrawal, academic decline, and changes in appetite/sleep. Coordinate with parents/guardians, and refer to a mental health professional for clinical evaluation if symptoms are chronic. Consider implementing a buddy system to reduce isolation.",
        });
      }

      if (highStress.length > 0) {
        const pct = ((highStress.length / initialAssessments.length) * 100).toFixed(0);
        insights.push({
          type: "warning",
          severity: "medium",
          title: "Elevated Stress Levels (DASS-21)",
          description: `${highStress.length} student(s) (${pct}%) scored in the severe stress range on DASS-21 (score > 19). Chronic stress can impair academic performance and overall well-being.`,
          recommendation: "Organize stress management workshops covering time management, relaxation techniques, and mindfulness. Identify key stressors (exams, family, peer relationships) through individual sessions. Coordinate with teachers to provide academic accommodations if needed.",
        });
      }
    }

    // --- ANALYSIS: Students in Yellow Zone trending towards Red ---
    const yellowTrendingRed = [];
    Object.entries(latestSurveyByStudent).forEach(([sid, latestSr]) => {
      const z = normalizeZoneName(latestSr.zone);
      if (z && z.startsWith("Yellow")) {
        // Check if this student's recent surveys are worsening
        const studentSurveys = surveyResponses
          .filter((sr) => sr.studentId === sid)
          .sort((a, b) => a.createdAt - b.createdAt);
        if (studentSurveys.length >= 3) {
          const lastThree = studentSurveys.slice(-3);
          const declining = lastThree.every((sr, i) => i === 0 || sr.percentage <= studentSurveys[studentSurveys.length - 3 + i - 1].percentage);
          if (declining && lastThree[lastThree.length - 1].percentage < 65) {
            yellowTrendingRed.push(sid);
          }
        }
      }
    });
    if (yellowTrendingRed.length > 0) {
      const names = yellowTrendingRed
        .map((sid) => studentById[sid])
        .filter(Boolean)
        .map((s) => `${s.user.firstName} ${s.user.lastName}`);
      insights.push({
        type: "warning",
        severity: "high",
        title: "Yellow Zone Students at Risk of Escalation",
        description: `${yellowTrendingRed.length} student(s) currently in the Yellow Zone show a declining trend in survey scores across their last 3 responses (${names.slice(0, 4).join(", ")}${names.length > 4 ? " and more" : ""}). Without intervention, they may progress to the Red Zone.`,
        recommendation: "Prioritize preventive counseling for these students. Schedule check-ins within the next 3 days. Assign peer mentors and incorporate wellness activities. Early intervention at this stage is the most effective way to prevent escalation to crisis level.",
      });
    }

    // --- INFO: Low survey participation ---
    if (lowParticipation.length > 0 && students.length > 0) {
      const pct = ((lowParticipation.length / students.length) * 100).toFixed(0);
      const names = lowParticipation
        .map((sid) => studentById[sid])
        .filter(Boolean)
        .map((s) => `${s.user.firstName} ${s.user.lastName}`)
        .slice(0, 5);
      insights.push({
        type: "info",
        severity: "low",
        title: "Low Survey Participation",
        description: `${lowParticipation.length} student(s) (${pct}%) have not completed a survey in the past 2 weeks (${names.join(", ")}${lowParticipation.length > 5 ? " and more" : ""}). Non-participation may itself be a warning sign of disengagement or avoidance.`,
        recommendation: "Send personalized reminders. Schedule brief one-on-one check-ins to understand barriers to participation. Consider whether non-participation is linked to emotional withdrawal — students avoiding surveys may be avoiding confronting their own mental state. Make surveys more accessible and emphasize confidentiality.",
      });
    }

    // --- ANALYSIS: Gender-based disparity ---
    const maleStats = genderAnalytics.find((g) => g.gender === "Male");
    const femaleStats = genderAnalytics.find((g) => g.gender === "Female");
    if (maleStats && femaleStats && maleStats.avgMood && femaleStats.avgMood) {
      const diff = Math.abs(maleStats.avgMood - femaleStats.avgMood);
      if (diff >= 0.5) {
        const lowerGender = maleStats.avgMood < femaleStats.avgMood ? "Male" : "Female";
        const lowerMood = lowerGender === "Male" ? maleStats.avgMood : femaleStats.avgMood;
        const higherMood = lowerGender === "Male" ? femaleStats.avgMood : maleStats.avgMood;
        const lowerRed = lowerGender === "Male" ? maleStats.redZonePercentage : femaleStats.redZonePercentage;
        insights.push({
          type: "analysis",
          severity: "medium",
          title: "Gender-Based Mental Health Disparity",
          description: `${lowerGender} students show a notably lower average mood (${lowerMood}/5) compared to ${lowerGender === "Male" ? "Female" : "Male"} students (${higherMood}/5), with ${lowerRed}% of ${lowerGender} survey responses in the Red Zone.`,
          recommendation: `Implement gender-sensitive support programs. For ${lowerGender} students: investigate common stressors through focus groups, create safe spaces for expression, and train teachers on recognizing gender-specific signs of distress. Consider ${lowerGender === "Male" ? "programs that normalize emotional expression and help-seeking behavior among boys" : "programs addressing self-esteem, body image, and social pressure among girls"}.`,
        });
      }

      // Gender-specific red zone disparity
      if (maleStats.redZonePercentage > 0 && femaleStats.redZonePercentage > 0) {
        const redDiff = Math.abs(maleStats.redZonePercentage - femaleStats.redZonePercentage);
        if (redDiff >= 15) {
          const higherRedGender = maleStats.redZonePercentage > femaleStats.redZonePercentage ? "Male" : "Female";
          insights.push({
            type: "warning",
            severity: "medium",
            title: `Higher Red Zone Rate Among ${higherRedGender} Students`,
            description: `${higherRedGender} students have a ${higherRedGender === "Male" ? maleStats.redZonePercentage : femaleStats.redZonePercentage}% Red Zone rate versus ${higherRedGender === "Male" ? femaleStats.redZonePercentage : maleStats.redZonePercentage}% for ${higherRedGender === "Male" ? "Female" : "Male"} students — a ${redDiff.toFixed(0)}% gap.`,
            recommendation: `Allocate proportionally more counseling resources toward ${higherRedGender} students. Investigate root causes through confidential surveys or interviews. Consider involving same-gender peer counselors who may be more relatable.`,
          });
        }
      }
    }

    // --- ANALYSIS: Cross-section comparison ---
    if (sectionAnalytics.length >= 2) {
      const sorted = [...sectionAnalytics].sort((a, b) => (b.avgMood || 0) - (a.avgMood || 0));
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      if (best.avgMood && worst.avgMood && best.avgMood - worst.avgMood >= 0.3) {
        insights.push({
          type: "analysis",
          severity: "medium",
          title: "Cross-Section Mental Health Gap",
          description: `"${best.sectionName}" has the highest average mood (${best.avgMood}/5, ${best.participationRate}% participation) while "${worst.sectionName}" has the lowest (${worst.avgMood}/5, ${worst.participationRate}% participation).`,
          recommendation: `Conduct a comparative review of classroom environments, teaching approaches, and peer dynamics between sections. Collaborate with the teacher of "${worst.sectionName}" to identify stressors. Consider transferring successful wellness practices from "${best.sectionName}" and increasing counselor presence in the lower-performing section.`,
        });
      }

      // Section-specific participation disparity
      const lowPartSection = sectionAnalytics.find((s) => s.participationRate < 50 && s.totalStudents > 0);
      if (lowPartSection) {
        insights.push({
          type: "warning",
          severity: "medium",
          title: `Low Engagement in "${lowPartSection.sectionName}"`,
          description: `Only ${lowPartSection.participationRate}% of students in "${lowPartSection.sectionName}" have completed surveys this period. Low engagement makes it difficult to assess mental health status accurately.`,
          recommendation: `Work with the section teacher to encourage participation. Consider integrating survey completion into homeroom activities. Investigate whether students feel unsafe or distrustful of the process — reinforce confidentiality and the purpose of wellness check-ins.`,
        });
      }
    }

    // --- ANALYSIS: Monthly trend insights ---
    if (monthlyTrends.length >= 2) {
      const latest = monthlyTrends[monthlyTrends.length - 1];
      const previous = monthlyTrends[monthlyTrends.length - 2];
      if (latest.redPercentage > previous.redPercentage + 5) {
        insights.push({
          type: "warning",
          severity: "high",
          title: "Increasing Red Zone Trend",
          description: `Red zone percentage increased from ${previous.redPercentage}% in ${previous.monthLabel} to ${latest.redPercentage}% in ${latest.monthLabel}. This upward trend indicates growing mental health concerns across the student body.`,
          recommendation: "Investigate potential triggers (upcoming exams, seasonal factors, school events). Implement school-wide mental health initiatives: stress management workshops, guided meditation sessions, and peer support programs. Increase counseling availability and consider teacher training on recognizing early warning signs.",
        });
      } else if (latest.redPercentage < previous.redPercentage - 5) {
        insights.push({
          type: "positive",
          severity: "low",
          title: "Improving Mental Health Trends",
          description: `Red zone percentage decreased from ${previous.redPercentage}% in ${previous.monthLabel} to ${latest.redPercentage}% in ${latest.monthLabel}. Current strategies appear to be working.`,
          recommendation: "Document what interventions were active during this improvement period. Continue monitoring and maintain current support programs. Share success metrics with school administration to advocate for sustained mental health funding.",
        });
      }

      // Average mood trend direction
      if (latest.avgMood && previous.avgMood) {
        const moodChange = latest.avgMood - previous.avgMood;
        if (moodChange <= -0.3) {
          insights.push({
            type: "warning",
            severity: "medium",
            title: "Overall Mood Decline This Month",
            description: `Average mood dropped from ${previous.avgMood}/5 in ${previous.monthLabel} to ${latest.avgMood}/5 in ${latest.monthLabel} (${moodChange.toFixed(2)} decrease).`,
            recommendation: "Assess whether external factors (academic calendar, holiday stress, school conflicts) are driving the decline. Consider organizing wellness activities, classroom-based mindfulness exercises, or a school mental health awareness week to boost morale.",
          });
        }
      }
    }

    // --- ANALYSIS: Quarterly pattern (if enough data) ---
    if (quarterlyTrends.length >= 2) {
      const latestQ = quarterlyTrends[quarterlyTrends.length - 1];
      const prevQ = quarterlyTrends[quarterlyTrends.length - 2];
      if (latestQ.redPercentage > prevQ.redPercentage + 10) {
        insights.push({
          type: "warning",
          severity: "high",
          title: "Quarterly Red Zone Escalation",
          description: `The Red Zone percentage jumped from ${prevQ.redPercentage}% in ${prevQ.quarter} to ${latestQ.redPercentage}% in ${latestQ.quarter}. This quarter-over-quarter increase suggests systemic issues rather than isolated cases.`,
          recommendation: "Convene a meeting with school administration and teachers to address systemic factors. Review school policies, academic pressures, and social climate. Consider a school-wide mental health assessment and develop a comprehensive intervention plan with clear timelines and accountability.",
        });
      }
    }

    // --- INFO: Intervention coverage gap ---
    const studentsWithIntervention = new Set(interventions.map((i) => i.studentId));
    const highRiskWithoutIntervention = Object.entries(latestSurveyByStudent)
      .filter(([sid, sr]) => normalizeZoneName(sr.zone)?.startsWith("Red") && !studentsWithIntervention.has(sid))
      .map(([sid]) => sid);
    if (highRiskWithoutIntervention.length > 0) {
      const names = highRiskWithoutIntervention
        .map((sid) => studentById[sid])
        .filter(Boolean)
        .map((s) => `${s.user.firstName} ${s.user.lastName}`);
      insights.push({
        type: "critical",
        severity: "high",
        title: "Red Zone Students Without Intervention Plans",
        description: `${highRiskWithoutIntervention.length} student(s) in the Red Zone currently have no active intervention plan (${names.slice(0, 4).join(", ")}${names.length > 4 ? " and more" : ""}). These students are at risk without structured support.`,
        recommendation: "Create intervention plans for these students immediately. Include specific goals, scheduled counseling sessions, coping strategy instruction, and follow-up checkpoints. Assign each student a counselor point-of-contact and set a 2-week review date.",
      });
    }

    // --- INFO: Intervention effectiveness ---
    const completedCount = interventions.filter((i) => i.status === "COMPLETED").length;
    const activeCount = interventions.filter((i) => i.status !== "COMPLETED").length;
    if (completedCount > 0 && activeCount > 0) {
      insights.push({
        type: "info",
        severity: "low",
        title: "Intervention Progress Overview",
        description: `${completedCount} intervention(s) have been completed and ${activeCount} remain active. ${students.length > 0 ? `${((studentsWithIntervention.size / students.length) * 100).toFixed(0)}% of students have been covered by at least one intervention.` : ""}`,
        recommendation: "Review completed interventions for effectiveness — did those students show mood or zone improvement? Use findings to refine active intervention strategies. Ensure active interventions have clear milestones and are reviewed at least bi-weekly.",
      });
    }

    // --- INFO: Students with consistently high mood but low survey scores ---
    const moodSurveyMismatch = [];
    studentIds.forEach((sid) => {
      const sMoods = moodEntries.filter((m) => m.studentId === sid);
      const sSurveys = surveyResponses.filter((sr) => sr.studentId === sid);
      if (sMoods.length >= 3 && sSurveys.length >= 2) {
        const avgMoodLevel = sMoods.reduce((s, m) => s + m.moodLevel, 0) / sMoods.length;
        const avgSurveyPct = sSurveys.reduce((s, sr) => s + sr.percentage, 0) / sSurveys.length;
        // High self-reported mood but low structured survey score
        if (avgMoodLevel >= 3.5 && avgSurveyPct < 60) {
          moodSurveyMismatch.push(sid);
        }
      }
    });
    if (moodSurveyMismatch.length > 0) {
      const names = moodSurveyMismatch
        .map((sid) => studentById[sid])
        .filter(Boolean)
        .map((s) => `${s.user.firstName} ${s.user.lastName}`);
      insights.push({
        type: "analysis",
        severity: "medium",
        title: "Mood-Survey Score Mismatch",
        description: `${moodSurveyMismatch.length} student(s) report high daily mood (3.5+/5) but score below 60% on structured surveys (${names.slice(0, 4).join(", ")}${names.length > 4 ? " and more" : ""}). This discrepancy may indicate masking behavior or a disconnect between perceived and actual well-being.`,
        recommendation: "These students may be underreporting struggles in casual mood check-ins while revealing deeper issues in structured assessments. Schedule private, in-depth conversations to explore this gap. Help them develop emotional awareness and honest self-reflection. Consider that social desirability bias may influence their mood entries.",
      });
    }

    // --- POSITIVE: Overall positive status ---
    if (overallAvgMood && overallAvgMood >= 3.5 && highRisk === 0) {
      insights.push({
        type: "positive",
        severity: "low",
        title: "Overall Positive Mental Health Status",
        description: `The overall average mood is ${overallAvgMood}/5 with no students currently in the Red Zone. ${overallParticipation >= 80 ? "Survey participation is strong at " + overallParticipation + "%." : ""}`,
        recommendation: "Maintain current supportive practices. Continue regular check-ins and preventive programs to sustain these positive outcomes. Use this stable period to build resilience programs, train peer supporters, and establish stronger early-warning systems for future challenges.",
      });
    }

    // --- POSITIVE: High participation ---
    if (overallParticipation >= 85) {
      insights.push({
        type: "positive",
        severity: "low",
        title: "Excellent Student Engagement",
        description: `${overallParticipation}% of students have completed at least one survey during this period. High engagement means the data is reliable and representative.`,
        recommendation: "Acknowledge and thank students for their participation. High engagement reflects trust in the counseling process — continue fostering this through transparency about how data is used to improve student welfare.",
      });
    }

    return {
      genderAnalytics,
      sectionAnalytics,
      monthlyTrends,
      quarterlyTrends,
      riskIndicators,
      overallStats: {
        totalStudents: students.length,
        totalSurveyResponses,
        totalMoodEntries,
        overallAvgMood,
        overallAvgScore,
        overallParticipation,
        assessmentStats,
      },
      prescriptiveInsights: insights,
      period: { start: periodStart.toISOString(), end: now.toISOString() },
    };
  } catch (error) {
    console.error("Error generating comprehensive analytics:", error);
    throw error;
  }
};

module.exports = {
  getCounselorByUserId,
  getCounselorSections,
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
  getStudentProfile,
  getComprehensiveAnalytics,
};
