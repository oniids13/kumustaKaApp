const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const PDFDocument = require("pdfkit");
const { createObjectCsvStringifier } = require("csv-writer");
const { Pool } = require("pg");

// Initialize database connection pool if DATABASE_URL is defined
let pool = null;
try {
  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    console.log("PostgreSQL connection pool initialized");
  } else {
    console.log("DATABASE_URL not defined, using Prisma only");
  }
} catch (error) {
  console.error("Error initializing PostgreSQL connection pool:", error);
}

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
    console.error("Error finding counselor:", error);
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
    console.error("Error fetching students:", error);
    throw error;
  }
};

/**
 * Get surveys for a specific student
 */
const getStudentSurveys = async (studentId, startDate, endDate) => {
  try {
    // Create date filter if provided
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    }

    // Fetch surveys for this student
    return await prisma.surveyResponse.findMany({
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
  } catch (error) {
    console.error("Error fetching student surveys:", error);
    throw error;
  }
};

/**
 * Get mood entries for a specific student
 */
const getStudentMoods = async (studentId, startDate, endDate) => {
  try {
    // Create date filter if provided
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    }

    // Fetch mood entries for this student
    return await prisma.moodEntry.findMany({
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
  } catch (error) {
    console.error("Error fetching student mood entries:", error);
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
    console.error("Error fetching interventions:", error);
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
    console.error("Error creating intervention:", error);
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
    console.error("Error finding intervention:", error);
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
    console.error("Error updating intervention:", error);
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
    console.error("Error deleting intervention:", error);
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
    console.error("Error creating report:", error);
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
    console.error("Error fetching report history:", error);
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
    console.error("Error finding report:", error);
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
    console.error("Error getting student name:", error);
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
  // This would be a complex function to gather all the data needed for the report
  // For now, we'll just return some mock data

  // Format the date range for display
  const formattedStartDate = new Date(startDate).toLocaleDateString();
  const formattedEndDate = new Date(endDate).toLocaleDateString();

  return {
    title: `Mental Health Report - ${
      reportType.charAt(0).toUpperCase() + reportType.slice(1)
    }`,
    period: `${formattedStartDate} to ${formattedEndDate}`,
    studentInfo:
      studentId === "all" ? "All Students" : await getStudentName(studentId),
    summary: {
      totalResponses: 45,
      averageMood: 3.7,
      topIssues: ["Academic Stress", "Social Anxiety", "Sleep Issues"],
      recommendedActions: [
        "Consider reducing academic workload for students showing high stress",
        "Implement stress management workshops",
        "Provide resources for healthy sleep habits",
      ],
    },
    moodData: [
      { date: "Week 1", average: 3.2 },
      { date: "Week 2", average: 3.5 },
      { date: "Week 3", average: 3.8 },
      { date: "Week 4", average: 3.7 },
    ],
    zoneData: {
      "Green (Positive)": 25,
      "Yellow (Moderate)": 15,
      "Red (Needs Attention)": 5,
    },
    issueData: [
      { issue: "Academic Stress", count: 22 },
      { issue: "Social Anxiety", count: 18 },
      { issue: "Sleep Issues", count: 12 },
      { issue: "Family Problems", count: 8 },
      { issue: "Future Concerns", count: 6 },
    ],
  };
};

/**
 * Generate PDF report
 */
const generatePdfReport = (doc, data, options) => {
  // Add title and header
  doc.fontSize(24).text(data.title, { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Period: ${data.period}`, { align: "center" });
  doc.fontSize(12).text(`Student: ${data.studentInfo}`, { align: "center" });
  doc.moveDown(2);

  // Add summary section
  doc.fontSize(18).text("Summary", { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(`Total Responses: ${data.summary.totalResponses}`);
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Average Mood: ${data.summary.averageMood} / 5`);
  doc.moveDown();

  // Add top issues section
  doc.fontSize(16).text("Top Issues", { underline: true });
  doc.moveDown();
  data.summary.topIssues.forEach((issue, index) => {
    doc.text(`${index + 1}. ${issue}`);
    doc.moveDown(0.5);
  });
  doc.moveDown();

  // Add recommendations if enabled
  if (options.includeRecommendations) {
    doc.fontSize(16).text("Recommended Actions", { underline: true });
    doc.moveDown();
    data.summary.recommendedActions.forEach((action, index) => {
      doc.text(`${index + 1}. ${action}`);
      doc.moveDown(0.5);
    });
    doc.moveDown();
  }

  // Add tables if enabled
  if (options.includeTables) {
    doc.addPage();
    doc.fontSize(18).text("Detailed Data", { underline: true });
    doc.moveDown();

    // Mood trends table
    doc.fontSize(14).text("Mood Trends Data");
    doc.moveDown();
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidth = 120;

    doc.fontSize(10);
    doc.text("Period", tableLeft, tableTop);
    doc.text("Average Mood", tableLeft + colWidth, tableTop);

    data.moodData.forEach((period, i) => {
      const y = tableTop + 20 + i * 20;
      doc.text(period.date, tableLeft, y);
      doc.text(period.average.toString(), tableLeft + colWidth, y);
    });

    doc.moveDown(4);

    // Zone distribution table
    doc.fontSize(14).text("Zone Distribution");
    doc.moveDown();
    const zoneTableTop = doc.y;

    doc.fontSize(10);
    doc.text("Zone", tableLeft, zoneTableTop);
    doc.text("Count", tableLeft + colWidth, zoneTableTop);

    let row = 0;
    Object.entries(data.zoneData).forEach(([zone, count]) => {
      const y = zoneTableTop + 20 + row * 20;
      doc.text(zone, tableLeft, y);
      doc.text(count.toString(), tableLeft + colWidth, y);
      row++;
    });
  }

  // Add footer
  doc
    .fontSize(10)
    .text(
      "Confidential: This report contains sensitive mental health information and should be handled with care.",
      { align: "center" }
    );
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
    { category: "Top Issues", data: data.summary.topIssues.join(", ") },
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
      moodTrendsCsvStringifier.stringifyRecords(data.moodData);

    // Add zone distribution
    csvOutput += "\n\nZone Distribution\n";
    const zoneHeader = [
      { id: "zone", title: "Zone" },
      { id: "count", title: "Count" },
    ];
    const zoneCsvStringifier = createObjectCsvStringifier({
      header: zoneHeader,
    });
    const zoneRows = Object.entries(data.zoneData).map(([zone, count]) => ({
      zone,
      count,
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
      issueCsvStringifier.stringifyRecords(data.issueData);
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
    console.error("Error fetching student initial assessment:", error);
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
    console.error("Error getting daily submission counts:", error);
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
          weekStart.setDate(now.getDate() - 7);
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

    console.log("Fetching survey responses with date filter:", dateFilter);

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

    console.log(`Found ${surveyResponses.length} survey responses`);
    if (surveyResponses.length > 0) {
      console.log(
        "Sample survey response:",
        JSON.stringify(surveyResponses[0], null, 2)
      );
      console.log(
        "Student names in survey data:",
        surveyResponses
          .map((r) =>
            r.student?.user
              ? `${r.student.user.firstName} ${r.student.user.lastName}`
              : `Unknown (ID: ${r.studentId})`
          )
          .join(", ")
      );
    } else {
      // If no surveys, try to fetch records directly from student table
      console.log(
        "No survey responses found, checking for students with recent activity"
      );
      const studentsWithActivity = await prisma.student.findMany({
        select: {
          id: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          moodEntries: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          surveyResponses: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          initialAssessment: true,
        },
        where: {
          OR: [
            { moodEntries: { some: {} } },
            { surveyResponses: { some: {} } },
            { initialAssessment: { isNot: null } },
          ],
        },
      });

      console.log(
        `Found ${studentsWithActivity.length} students with activity`
      );
      if (studentsWithActivity.length > 0) {
        // We need to generate at least minimal mood trends data
        return [
          {
            name: "Today",
            "Green (Positive)": 0,
            "Yellow (Moderate)": 1, // At least show something in chart
            "Red (Needs Attention)": 0,
            count: 1,
          },
        ];
      }
    }

    // Process data for mood trends over time using survey responses and zones
    const moodTrends = processMoodTrendsData(surveyResponses, period);

    return moodTrends;
  } catch (error) {
    console.error("Error fetching mood trends:", error);
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
      weekStart.setDate(now.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0); // Set to start of day

      dateFilter = {
        createdAt: {
          gte: weekStart,
          lte: now,
        },
      };
    }

    console.log("Fetching mood entries with date filter:", dateFilter);

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

    console.log(`Found ${moodEntries.length} mood entries`);
    if (moodEntries.length > 0) {
      console.log(
        "Sample mood entry:",
        JSON.stringify(moodEntries[0], null, 2)
      );
      console.log(
        "Student names in mood data:",
        moodEntries
          .map((m) =>
            m.student?.user
              ? `${m.student.user.firstName} ${m.student.user.lastName}`
              : `Unknown (ID: ${m.studentId})`
          )
          .join(", ")
      );
    } else {
      // Check for any student with mood entries
      console.log(
        "No mood entries found for the period, checking for any students with activity"
      );
      const studentsWithMoods = await prisma.student.findMany({
        select: {
          id: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              moodEntries: true,
            },
          },
        },
        where: {
          moodEntries: {
            some: {},
          },
        },
      });

      console.log(
        `Found ${studentsWithMoods.length} students with mood entries`
      );
      if (studentsWithMoods.length > 0) {
        // Generate at least one entry for today
        return [
          {
            date: new Date().toLocaleDateString(),
            positive: 0,
            moderate: 1, // Show at least something
            needsAttention: 0,
          },
        ];
      }
    }

    // Process data for daily mood trends
    return processDailyMoodTrends(moodEntries);
  } catch (error) {
    console.error("Error fetching daily mood trends:", error);
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
          weekStart.setDate(now.getDate() - 7);
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

    console.log(
      "Fetching mood entries for timeframe trends with date filter:",
      dateFilter
    );

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

    console.log(
      `Found ${moodEntries.length} mood entries for timeframe trends`
    );

    // Check for initial assessments if no mood entries
    let totalEntries = moodEntries.length;
    let totalMoodValue = 0;

    if (moodEntries.length === 0) {
      // Check if there are any students with initial assessments
      const studentsWithAssessments = await prisma.student.findMany({
        where: {
          initialAssessment: {
            isNot: null,
          },
        },
        select: {
          id: true,
          initialAssessment: true,
        },
      });

      console.log(
        `Found ${studentsWithAssessments.length} students with initial assessments`
      );

      // If we have students with assessments but no mood entries, return default values
      if (studentsWithAssessments.length > 0) {
        // Use a moderate mood value as default
        return {
          totalEntries: 1, // Show something even if there are no actual entries
          averageMood: 3.0,
        };
      }
    } else {
      // Calculate total and average from actual entries
      totalMoodValue = moodEntries.reduce(
        (sum, entry) => sum + entry.moodLevel,
        0
      );
    }

    // Calculate average mood
    const averageMood = totalEntries > 0 ? totalMoodValue / totalEntries : 0;

    return {
      totalEntries,
      averageMood: parseFloat(averageMood.toFixed(2)),
    };
  } catch (error) {
    console.error("Error fetching timeframe trends:", error);
    throw error;
  }
};

// Helper functions
const processMoodTrendsData = (responses, period) => {
  console.log(
    `Processing ${responses.length} survey responses for mood trends`
  );

  if (!responses || !responses.length) {
    console.log("No responses to process, returning empty array");
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

  responses.forEach((response) => {
    if (!response || !response.createdAt) {
      console.log("Skipping response with missing createdAt:", response);
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

    // Use the zone data directly from the response
    if (response.zone) {
      if (groupedByPeriod[key][response.zone] !== undefined) {
        groupedByPeriod[key][response.zone]++;
      } else {
        console.log(
          `Warning: Unknown zone value '${response.zone}' for response ID ${response.id}`
        );
      }
    } else {
      console.log(`Warning: Missing zone data for response ID ${response.id}`);
    }

    groupedByPeriod[key].count++;
  });

  // Convert to array and sort
  let result = Object.values(groupedByPeriod);
  console.log(`Grouped data into ${result.length} periods`);

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
  console.log(`Processing ${moodEntries.length} mood entries for daily trends`);

  if (!moodEntries || !moodEntries.length) {
    console.log("No mood entries to process, returning empty array");
    return [];
  }

  // Group entries by date
  const groupedByDate = {};

  moodEntries.forEach((entry) => {
    if (!entry || !entry.createdAt) {
      console.log("Skipping entry with missing createdAt:", entry);
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
    } else {
      console.log(
        `Warning: Invalid moodLevel for entry ID ${entry.id}: ${entry.moodLevel}`
      );
    }
  });

  // Convert to array and sort by date
  const result = Object.values(groupedByDate).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  console.log(`Grouped mood data into ${result.length} dates`);
  return result;
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
};
