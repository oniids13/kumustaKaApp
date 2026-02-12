const teacherQueries = require("../model/teacherQueries");
const PDFDocument = require("pdfkit");
const { createObjectCsvStringifier } = require("csv-writer");

/**
 * Get classroom analytics dashboard (descriptive + prescriptive)
 */
const getAnalyticsDashboardController = async (req, res) => {
  try {
    if (req.user.role !== "TEACHER") {
      return res.status(403).json({ error: "Access denied: Only teachers can access analytics" });
    }

    const teacher = await teacherQueries.getTeacherByUserId(req.user.id);
    if (!teacher) {
      return res.status(404).json({ error: "Teacher profile not found" });
    }

    const period = req.query.period || "3months";
    const analyticsData = await teacherQueries.getClassroomAnalytics(req.user.id, period);

    res.status(200).json(analyticsData);
  } catch (error) {
    console.error("Error fetching analytics dashboard:", error);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
};

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

    const sectionId = teacher.sectionId || null;
    const trendsData = await teacherQueries.getMentalHealthTrends(
      queryParams,
      teacher.id,
      sectionId
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
      teacher.id,
      req.user.id
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
  try {
    // Set response headers for PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=mental_health_trends_report_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`
    );

    // Create a new PDF document
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Add title and header
    doc.fontSize(24).text(reportData.title || "Mental Health Trends Report", {
      align: "center",
    });
    doc.moveDown();
    doc
      .fontSize(12)
      .text(reportData.period || "No period specified", { align: "center" });
    doc.moveDown(2);

    // Add summary section with weekly averages
    doc.fontSize(18).text("Summary", { underline: true });
    doc.moveDown();

    // Survey and Mood submission statistics
    doc.fontSize(14).text("Submission Statistics", { underline: true });
    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .text(`Period Covered: ${reportData.summary?.weeksCovered || 0} weeks`);
    doc.moveDown(0.3);
    doc.text(
      `Total Survey Responses: ${reportData.summary?.totalResponses || 0}`
    );
    doc.moveDown(0.3);
    doc.text(
      `Average Survey Responses per Week: ${
        reportData.summary?.avgSurveyResponsesPerWeek || 0
      }`
    );
    doc.moveDown(0.3);
    doc.text(
      `Total Mood Entries: ${reportData.summary?.totalMoodEntries || 0}`
    );
    doc.moveDown(0.3);
    doc.text(
      `Average Mood Entries per Week: ${
        reportData.summary?.avgMoodEntriesPerWeek || 0
      }`
    );
    doc.moveDown(0.3);
    doc.text(
      `Overall Mood Trend: ${reportData.summary?.averageMood || "No Data"}`
    );
    doc.moveDown(2);

    // Add Descriptive Analysis section (if available)
    if (reportData.descriptiveAnalysis) {
      doc.addPage();
      doc.fontSize(18).text("Descriptive Analysis", { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(
        `This analysis is based on real student data from ${reportData.descriptiveAnalysis.sectionName || "your class"}.`,
        { align: "left" }
      );
      doc.moveDown(0.5);

      const { riskIndicators, overallStats } = reportData.descriptiveAnalysis;
      doc.fontSize(14).text("Risk Assessment Overview", { underline: true });
      doc.moveDown(0.3);
      doc.text(`Total Students: ${riskIndicators?.totalStudents || 0}`);
      doc.text(`High Risk (Red Zone): ${riskIndicators?.highRisk || 0}`);
      doc.text(`Moderate Risk (Yellow Zone): ${riskIndicators?.moderateRisk || 0}`);
      doc.text(`Low Risk (Green Zone): ${riskIndicators?.lowRisk || 0}`);
      doc.text(`Students with Declining Mood: ${riskIndicators?.decliningMoodCount || 0}`);
      doc.text(`Low Participation (no survey in 2 weeks): ${riskIndicators?.lowParticipationCount || 0}`);
      doc.moveDown(0.5);

      if (overallStats) {
        doc.fontSize(14).text("Overall Statistics", { underline: true });
        doc.moveDown(0.3);
        doc.text(`Average Mood: ${overallStats.overallAvgMood ?? "N/A"}/5`);
        doc.text(`Average Survey Score: ${overallStats.overallAvgScore ?? "N/A"}%`);
        doc.text(`Participation Rate: ${overallStats.overallParticipation ?? 0}%`);
        doc.moveDown();
      }
    }

    // Add Prescriptive Insights & Recommendations section
    const prescriptiveInsights = reportData.prescriptiveInsights || [];
    const recommendations = reportData.summary?.recommendedActions || [];

    if (prescriptiveInsights.length > 0) {
      doc.addPage();
      doc.fontSize(18).text("Prescriptive Insights & Recommendations", { underline: true });
      doc.moveDown();

      prescriptiveInsights.forEach((insight, index) => {
        doc.fontSize(12).fillColor("black").text(`${index + 1}. ${insight.title}`, { continued: false });
        doc.fontSize(10).fillColor("gray").text(`[${insight.severity?.toUpperCase() || "INFO"}]`);
        doc.fontSize(11).fillColor("black").text(insight.description);
        doc.moveDown(0.3);
        doc.fontSize(11).fillColor("#1890ff").text(`Recommendation: ${insight.recommendation}`);
        doc.moveDown(1);
      });
    } else if (recommendations.length > 0) {
      doc.fontSize(14).text("Recommended Actions", { underline: true });
      doc.moveDown(0.5);

      recommendations.forEach((action, index) => {
        doc.fontSize(12).text(`${index + 1}. ${action}`);
        doc.moveDown(0.4);
      });
      doc.moveDown();
    }

    // Add Mental Health Zone Trends Chart Data
    const moodTrends = reportData.trends?.moodTrends || [];
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
    const dailyMoodTrends = reportData.trends?.dailyMoodTrends || [];
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
    const timeframeTrends = reportData.trends?.timeframeTrends || [];
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
      timeframeTrends.length === 0
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
        "Privacy Notice: This report contains only anonymized, aggregated data. No individual student responses are included.",
        50,
        doc.page.height - 50,
        { align: "center", width: doc.page.width - 100 }
      );

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF report" });
  }
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

/**
 * Get daily submission counts
 */
const getDailySubmissionCountsController = async (req, res) => {
  try {
    // Verify user is a teacher
    if (req.user.role !== "TEACHER") {
      return res.status(403).json({
        error: "Access denied: Only teachers can access submission counts",
      });
    }

    const submissionCounts = await teacherQueries.getDailySubmissionCounts();
    res.status(200).json(submissionCounts);
  } catch (error) {
    console.error("Error fetching daily submission counts:", error);
    res.status(500).json({
      error: "Failed to fetch daily submission counts",
    });
  }
};

/**
 * Delete a forum post
 */
const deleteForumPostController = async (req, res) => {
  try {
    // Verify user is a teacher
    if (req.user.role !== "TEACHER") {
      return res.status(403).json({
        error: "Access denied: Only teachers can delete forum posts",
      });
    }

    const { postId } = req.params;

    const deletedPost = await teacherQueries.deleteForumPost(postId);

    res.status(200).json({
      message: "Post deleted successfully",
      deletedPost,
    });
  } catch (error) {
    console.error("Error deleting forum post:", error);
    res.status(error.message === "Post not found" ? 404 : 500).json({
      error: error.message || "Failed to delete forum post",
    });
  }
};

/**
 * Get students in teacher's section
 */
const getSectionStudentsController = async (req, res) => {
  try {
    if (req.user.role !== "TEACHER") {
      return res.status(403).json({
        error: "Access denied: Only teachers can access section students",
      });
    }

    const students = await teacherQueries.getSectionStudents(req.user.id);

    res.status(200).json({ students });
  } catch (error) {
    console.error("Error fetching section students:", error);
    res.status(500).json({
      error: "Failed to fetch section students",
    });
  }
};

module.exports = {
  getAnalyticsDashboardController,
  getTrendsController,
  generateReportController,
  getStudentForumActivityController,
  getClassroomMoodOverviewController,
  getAcademicPerformanceController,
  getAllStudentsController,
  getDailySubmissionCountsController,
  deleteForumPostController,
  getSectionStudentsController,
};
