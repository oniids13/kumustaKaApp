const {
  getMentalHealthTrends,
  generateMentalHealthReport,
} = require("../model/analyticsQueries");
const PDFDocument = require("pdfkit");
const { createObjectCsvStringifier } = require("csv-writer");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Get mental health trends data
 */
const getTrendsController = async (req, res) => {
  try {
    if (req.user.role !== "TEACHER") {
      return res.status(403).json({
        error: "Access denied: Only teachers can access mental health trends",
      });
    }

    // Get teacher ID from user
    const teacher = await prisma.teacher.findFirst({
      where: {
        userId: req.user.id,
      },
    });

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

    const trendsData = await getMentalHealthTrends(queryParams, teacher.id);

    res.status(200).json(trendsData);
  } catch (error) {
    console.error("Error fetching mental health trends:", error);
    res.status(500).json({
      error: "Failed to fetch mental health trends data",
    });
  }
};

/**
 * Generate report based on mental health data
 */
const generateReportController = async (req, res) => {
  try {
    if (req.user.role !== "TEACHER") {
      return res.status(403).json({
        error: "Access denied: Only teachers can generate reports",
      });
    }

    // Get teacher ID from user
    const teacher = await prisma.teacher.findFirst({
      where: {
        userId: req.user.id,
      },
    });

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

    const reportData = await generateMentalHealthReport(
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

    // Mood trends table
    doc.fontSize(14).text("Mood Trends Data");
    doc.moveDown();

    // Create a simple table header
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidth = 90;

    doc.fontSize(10);
    doc.text("Period", tableLeft, tableTop);
    doc.text("Happy", tableLeft + colWidth, tableTop);
    doc.text("Neutral", tableLeft + colWidth * 2, tableTop);
    doc.text("Sad", tableLeft + colWidth * 3, tableTop);
    doc.text("Anxious", tableLeft + colWidth * 4, tableTop);

    // Add data rows
    reportData.trends.moodTrends.forEach((period, i) => {
      const y = tableTop + 20 + i * 20;
      doc.text(period.name, tableLeft, y);
      doc.text(period.happy.toString(), tableLeft + colWidth, y);
      doc.text(period.neutral.toString(), tableLeft + colWidth * 2, y);
      doc.text(period.sad.toString(), tableLeft + colWidth * 3, y);
      doc.text(period.anxious.toString(), tableLeft + colWidth * 4, y);
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

  // Create the headers for mood trends
  const moodTrendsHeader = [
    { id: "period", title: "Period" },
    { id: "happy", title: "Happy" },
    { id: "neutral", title: "Neutral" },
    { id: "sad", title: "Sad" },
    { id: "anxious", title: "Anxious" },
  ];

  // Create the mood trends stringifier
  const moodTrendsCsvStringifier = createObjectCsvStringifier({
    header: moodTrendsHeader,
  });

  // Generate the CSV output
  let csvOutput =
    csvStringifier.getHeaderString() +
    csvStringifier.stringifyRecords(summaryRows);
  csvOutput += "\n\nMood Trends\n";
  csvOutput +=
    moodTrendsCsvStringifier.getHeaderString() +
    moodTrendsCsvStringifier.stringifyRecords(reportData.trends.moodTrends);

  // Send the CSV response
  res.send(csvOutput);
};

module.exports = {
  getTrendsController,
  generateReportController,
};
