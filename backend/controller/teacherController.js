const teacherQueries = require("../model/teacherQueries");
const PDFDocument = require("pdfkit");
const { createObjectCsvStringifier } = require("csv-writer");

/**
 * Get classroom mental health trends
 */
const getTrendsController = async (req, res) => {
  try {
    // Verify user is a teacher
    if (req.user.role !== "TEACHER") {
      return res.status(403).json({
        error: "Access denied: Only teachers can access mental health trends",
      });
    }

    // Get teacher ID from user
    const teacher = await teacherQueries.getTeacherByUserId(req.user.id);

    if (!teacher) {
      return res.status(404).json({
        error: "Teacher profile not found",
      });
    }

    const queryParams = {
      period: req.query.period || "month",
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const trendsData = await teacherQueries.getMentalHealthTrends(
      queryParams,
      teacher.id
    );

    res.status(200).json(trendsData);
  } catch (error) {
    console.error("Error fetching mental health trends:", error);
    res.status(500).json({
      error: "Failed to fetch mental health trends data",
    });
  }
};

/**
 * Generate mental health report
 */
const generateReportController = async (req, res) => {
  try {
    // Verify user is a teacher
    if (req.user.role !== "TEACHER") {
      return res.status(403).json({
        error: "Access denied: Only teachers can generate reports",
      });
    }

    // Get teacher ID from user
    const teacher = await teacherQueries.getTeacherByUserId(req.user.id);

    if (!teacher) {
      return res.status(404).json({
        error: "Teacher profile not found",
      });
    }

    const reportParams = {
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      reportType: req.body.reportType || "comprehensive",
      includeCharts: req.body.includeCharts !== false,
      includeTables: req.body.includeTables !== false,
      includeRecommendations: req.body.includeRecommendations !== false,
    };

    const reportData = await teacherQueries.generateMentalHealthReport(
      reportParams,
      teacher.id
    );

    // Generate different output formats based on request
    const outputFormat = req.body.outputFormat || "pdf";

    switch (outputFormat) {
      case "pdf":
        return generatePdfReport(reportData, res);
      case "csv":
        return generateCsvReport(reportData, res);
      case "preview":
      default:
        return res.status(200).json(reportData);
    }
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({
      error: "Failed to generate mental health report",
    });
  }
};

/**
 * Get student forum activity
 */
const getStudentForumActivityController = async (req, res) => {
  try {
    // Verify user is a teacher
    if (req.user.role !== "TEACHER") {
      return res.status(403).json({
        error: "Access denied: Only teachers can access student forum activity",
      });
    }

    // Get teacher ID from user
    const teacher = await teacherQueries.getTeacherByUserId(req.user.id);

    if (!teacher) {
      return res.status(404).json({
        error: "Teacher profile not found",
      });
    }

    const forumActivity = await teacherQueries.getStudentForumActivity(
      teacher.id
    );

    res.status(200).json({ forumActivity });
  } catch (error) {
    console.error("Error fetching student forum activity:", error);
    res.status(500).json({
      error: "Failed to fetch student forum activity",
    });
  }
};

/**
 * Get classroom mood overview
 */
const getClassroomMoodOverviewController = async (req, res) => {
  try {
    // Verify user is a teacher
    if (req.user.role !== "TEACHER") {
      return res.status(403).json({
        error:
          "Access denied: Only teachers can access classroom mood overview",
      });
    }

    // Get period from query params
    const period = req.query.period || "week";

    const moodOverview = await teacherQueries.getClassroomMoodOverview(period);

    res.status(200).json(moodOverview);
  } catch (error) {
    console.error("Error fetching classroom mood overview:", error);
    res.status(500).json({
      error: "Failed to fetch classroom mood overview",
    });
  }
};

/**
 * Get student academic performance indicators
 */
const getAcademicPerformanceController = async (req, res) => {
  try {
    // Verify user is a teacher
    if (req.user.role !== "TEACHER") {
      return res.status(403).json({
        error:
          "Access denied: Only teachers can access academic performance data",
      });
    }

    // Get teacher ID from user
    const teacher = await teacherQueries.getTeacherByUserId(req.user.id);

    if (!teacher) {
      return res.status(404).json({
        error: "Teacher profile not found",
      });
    }

    const academicData = await teacherQueries.getAcademicPerformanceIndicators(
      teacher.id
    );

    res.status(200).json(academicData);
  } catch (error) {
    console.error("Error fetching academic performance indicators:", error);
    res.status(500).json({
      error: "Failed to fetch academic performance data",
    });
  }
};

/**
 * Get list of all students
 */
const getAllStudentsController = async (req, res) => {
  try {
    // Verify user is a teacher
    if (req.user.role !== "TEACHER") {
      return res.status(403).json({
        error: "Access denied: Only teachers can access student list",
      });
    }

    const students = await teacherQueries.getAllStudents();

    res.status(200).json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      error: "Failed to fetch students",
    });
  }
};

/**
 * Generate a PDF report
 */
const generatePdfReport = (reportData, res) => {
  // Set response headers for PDF
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=mental_health_report_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`
  );

  // Create a new PDF document
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  // Add title and header
  doc.fontSize(24).text(reportData.title, { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(reportData.period, { align: "center" });
  doc.moveDown(2);

  // Add summary section
  doc.fontSize(18).text("Summary", { underline: true });
  doc.moveDown();
  doc
    .fontSize(12)
    .text(`Total Responses: ${reportData.summary.totalResponses}`);
  doc.moveDown(0.5);
  doc.text(`Average Mood: ${reportData.summary.averageMood}`);
  doc.moveDown(2);

  // Add top issues section
  doc.fontSize(16).text("Top Issues", { underline: true });
  doc.moveDown();

  reportData.summary.topIssues.forEach((issue, index) => {
    doc.text(`${index + 1}. ${issue}`);
    doc.moveDown(0.5);
  });
  doc.moveDown();

  // Add recommendations section
  if (reportData.summary.recommendedActions.length > 0) {
    doc.fontSize(16).text("Recommended Actions", { underline: true });
    doc.moveDown();

    reportData.summary.recommendedActions.forEach((action, index) => {
      doc.text(`${index + 1}. ${action}`);
      doc.moveDown(0.5);
    });
  }

  // Add data table section if we have data
  if (reportData.trends.moodTrends.length > 0) {
    doc.addPage();
    doc.fontSize(18).text("Detailed Data", { underline: true });
    doc.moveDown();

    const period = reportData.period.includes("week")
      ? "Weekly Mental Health Zone Distribution"
      : "Mental Health Zone Trends Data";

    // Mood trends table
    doc.fontSize(14).text(period);
    doc.moveDown();

    // Create a simple table header
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidth = 110;

    doc.fontSize(10);
    doc.text("Period", tableLeft, tableTop);
    doc.text("Green (Positive)", tableLeft + colWidth, tableTop);
    doc.text("Yellow (Moderate)", tableLeft + colWidth * 2, tableTop);
    doc.text("Red (Needs Attention)", tableLeft + colWidth * 3, tableTop);
    doc.text("Total", tableLeft + colWidth * 4, tableTop);

    // Add data rows
    reportData.trends.moodTrends.forEach((period, i) => {
      const y = tableTop + 20 + i * 20;
      doc.text(period.name, tableLeft, y);
      doc.text(period["Green (Positive)"].toString(), tableLeft + colWidth, y);
      doc.text(
        period["Yellow (Moderate)"].toString(),
        tableLeft + colWidth * 2,
        y
      );
      doc.text(
        period["Red (Needs Attention)"].toString(),
        tableLeft + colWidth * 3,
        y
      );

      // Calculate total for the row
      const total =
        period["Green (Positive)"] +
        period["Yellow (Moderate)"] +
        period["Red (Needs Attention)"];

      doc.text(total.toString(), tableLeft + colWidth * 4, y);
    });
  }

  // Add footer
  doc
    .fontSize(10)
    .text(
      "Privacy Notice: This report contains only anonymized, aggregated data. No individual student responses are included.",
      { align: "center" }
    );

  // Finalize the PDF
  doc.end();
};

/**
 * Generate a CSV report
 */
const generateCsvReport = (reportData, res) => {
  // Set response headers for CSV
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=mental_health_report_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`
  );

  // Create the CSV header
  const header = [
    { id: "category", title: "Category" },
    { id: "data", title: "Data" },
  ];

  // Create the CSV stringifier
  const csvStringifier = createObjectCsvStringifier({
    header,
  });

  // Create the data rows for the summary
  const summaryRows = [
    { category: "Report Title", data: reportData.title },
    { category: "Period", data: reportData.period },
    { category: "Total Responses", data: reportData.summary.totalResponses },
    { category: "Average Mood", data: reportData.summary.averageMood },
    { category: "Top Issues", data: reportData.summary.topIssues.join(", ") },
  ];

  // Determine the section title based on period
  const sectionTitle = reportData.period.includes("week")
    ? "Weekly Mental Health Zone Distribution"
    : "Mental Health Zone Trends";

  // Create the headers for mental health zone trends
  const zoneTrendsHeader = [
    { id: "period", title: "Period" },
    { id: "green", title: "Green (Positive)" },
    { id: "yellow", title: "Yellow (Moderate)" },
    { id: "red", title: "Red (Needs Attention)" },
    { id: "total", title: "Total" },
  ];

  // Create the mood trends stringifier
  const zoneTrendsStringifier = createObjectCsvStringifier({
    header: zoneTrendsHeader,
  });

  // Create the data rows for mood trends
  const zoneTrendsRows = reportData.trends.moodTrends.map((period) => {
    const total =
      period["Green (Positive)"] +
      period["Yellow (Moderate)"] +
      period["Red (Needs Attention)"];

    return {
      period: period.name,
      green: period["Green (Positive)"],
      yellow: period["Yellow (Moderate)"],
      red: period["Red (Needs Attention)"],
      total: total,
    };
  });

  // Build the complete CSV output
  let csvOutput =
    csvStringifier.getHeaderString() +
    csvStringifier.stringifyRecords(summaryRows);

  // Add a blank line between sections
  csvOutput += "\n\n";

  // Add the mental health zone trends section
  csvOutput += `${sectionTitle}\n`;
  csvOutput +=
    zoneTrendsStringifier.getHeaderString() +
    zoneTrendsStringifier.stringifyRecords(zoneTrendsRows);

  res.write(csvOutput);
  res.end();
};

module.exports = {
  getTrendsController,
  generateReportController,
  getStudentForumActivityController,
  getClassroomMoodOverviewController,
  getAcademicPerformanceController,
  getAllStudentsController,
};
