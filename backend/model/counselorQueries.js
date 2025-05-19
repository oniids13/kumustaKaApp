const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const PDFDocument = require("pdfkit");
const { createObjectCsvStringifier } = require("csv-writer");

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
};
