const counselorQueries = require("../model/counselorQueries");
const PDFDocument = require("pdfkit");
const { createObjectCsvStringifier } = require("csv-writer");
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Get all students for counselor view
 */
const getStudentsController = async (req, res) => {
  try {
    // Get counselor ID from user
    const counselor = await counselorQueries.getCounselorByUserId(req.user.id);

    if (!counselor) {
      return res.status(404).json({
        error: "Counselor profile not found",
      });
    }

    // Get all students
    const formattedStudents = await counselorQueries.getAllStudents();

    res.status(200).json({ students: formattedStudents });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      error: "Failed to fetch students",
    });
  }
};

/**
 * Get surveys for a specific student
 */
const getStudentSurveysController = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate input
    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    console.log(`[DEBUG] Fetching surveys for student ${studentId}`);
    console.log(`[DEBUG] Date range: ${startDate} to ${endDate}`);

    // Fetch surveys for this student
    const surveys = await counselorQueries.getStudentSurveys(
      studentId,
      startDate,
      endDate
    );

    console.log(
      `[DEBUG] Found ${surveys.length} surveys for student ${studentId}`
    );
    if (surveys.length > 0) {
      console.log(`[DEBUG] Latest survey data: 
        - ID: ${surveys[0].id}
        - Zone: ${surveys[0].zone || "No zone"}
        - Created At: ${surveys[0].createdAt}
      `);
    }

    res.status(200).json({ surveys });
  } catch (error) {
    console.error("Error fetching student surveys:", error);
    res.status(500).json({
      error: "Failed to fetch student survey data",
    });
  }
};

/**
 * Get mood entries for a specific student
 */
const getStudentMoodsController = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate input
    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    console.log(`[DEBUG] Fetching mood entries for student ${studentId}`);
    console.log(`[DEBUG] Date range: ${startDate} to ${endDate}`);

    // Fetch mood entries for this student
    const moods = await counselorQueries.getStudentMoods(
      studentId,
      startDate,
      endDate
    );

    console.log(
      `[DEBUG] Found ${moods.length} mood entries for student ${studentId}`
    );
    if (moods.length > 0) {
      console.log(`[DEBUG] Latest mood data:
        - ID: ${moods[0].id}
        - Mood Level: ${moods[0].moodLevel} (type: ${typeof moods[0].moodLevel})
        - Created At: ${moods[0].createdAt}
      `);
    }

    res.status(200).json({ moods });
  } catch (error) {
    console.error("Error fetching student mood entries:", error);
    res.status(500).json({
      error: "Failed to fetch student mood data",
    });
  }
};

/**
 * Get all interventions for the counselor
 */
const getInterventionsController = async (req, res) => {
  try {
    // Get counselor ID from user
    const counselor = await counselorQueries.getCounselorByUserId(req.user.id);

    if (!counselor) {
      return res.status(404).json({
        error: "Counselor profile not found",
      });
    }

    // Get all interventions for this counselor
    const interventions = await counselorQueries.getCounselorInterventions(
      counselor.id
    );

    res.status(200).json({ interventions });
  } catch (error) {
    console.error("Error fetching interventions:", error);
    res.status(500).json({
      error: "Failed to fetch intervention plans",
    });
  }
};

/**
 * Create a new intervention plan
 */
const createInterventionController = async (req, res) => {
  try {
    const { studentId, title, description, status } = req.body;

    // Validate input
    if (!studentId || !title || !description) {
      return res.status(400).json({
        error: "StudentId, title, and description are required",
      });
    }

    // Get counselor ID from user
    const counselor = await counselorQueries.getCounselorByUserId(req.user.id);

    if (!counselor) {
      return res.status(404).json({
        error: "Counselor profile not found",
      });
    }

    // Create the intervention
    const intervention = await counselorQueries.createIntervention({
      counselorId: counselor.id,
      studentId,
      title,
      description,
      status: status || "PENDING",
    });

    res.status(201).json({ intervention });
  } catch (error) {
    console.error("Error creating intervention:", error);
    res.status(500).json({
      error: "Failed to create intervention plan",
    });
  }
};

/**
 * Update an existing intervention
 */
const updateInterventionController = async (req, res) => {
  try {
    const { interventionId } = req.params;
    const { studentId, title, description, status } = req.body;

    // Validate input
    if (!interventionId) {
      return res.status(400).json({ error: "Intervention ID is required" });
    }

    // Get counselor ID from user
    const counselor = await counselorQueries.getCounselorByUserId(req.user.id);

    if (!counselor) {
      return res.status(404).json({
        error: "Counselor profile not found",
      });
    }

    // Verify the intervention belongs to this counselor
    const existingIntervention = await counselorQueries.getInterventionById(
      interventionId,
      counselor.id
    );

    if (!existingIntervention) {
      return res.status(404).json({
        error: "Intervention not found or access denied",
      });
    }

    // Update the intervention
    const intervention = await counselorQueries.updateIntervention(
      interventionId,
      {
        studentId: studentId || existingIntervention.studentId,
        title: title || existingIntervention.title,
        description: description || existingIntervention.description,
        status: status || existingIntervention.status,
      }
    );

    res.status(200).json({ intervention });
  } catch (error) {
    console.error("Error updating intervention:", error);
    res.status(500).json({
      error: "Failed to update intervention plan",
    });
  }
};

/**
 * Delete an intervention
 */
const deleteInterventionController = async (req, res) => {
  try {
    const { interventionId } = req.params;

    // Validate input
    if (!interventionId) {
      return res.status(400).json({ error: "Intervention ID is required" });
    }

    // Get counselor ID from user
    const counselor = await counselorQueries.getCounselorByUserId(req.user.id);

    if (!counselor) {
      return res.status(404).json({
        error: "Counselor profile not found",
      });
    }

    // Verify the intervention belongs to this counselor
    const existingIntervention = await counselorQueries.getInterventionById(
      interventionId,
      counselor.id
    );

    if (!existingIntervention) {
      return res.status(404).json({
        error: "Intervention not found or access denied",
      });
    }

    // Delete the intervention
    await counselorQueries.deleteIntervention(interventionId);

    res.status(200).json({ message: "Intervention plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting intervention:", error);
    res.status(500).json({
      error: "Failed to delete intervention plan",
    });
  }
};

/**
 * Generate a report for a student or all students
 */
const generateReportController = async (req, res) => {
  try {
    const {
      studentId,
      startDate,
      endDate,
      reportType,
      outputFormat,
      includeCharts,
      includeTables,
      includeRecommendations,
    } = req.body;

    // Validate input
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "Start date and end date are required",
      });
    }

    // Get counselor ID from user
    const counselor = await counselorQueries.getCounselorByUserId(req.user.id);

    if (!counselor) {
      return res.status(404).json({
        error: "Counselor profile not found",
      });
    }

    // Get report data
    const reportData = await counselorQueries.generateReportData(
      counselor.id,
      studentId,
      startDate,
      endDate,
      reportType
    );

    // Save report history
    const report = await counselorQueries.createReport({
      counselorId: counselor.id,
      studentId: studentId === "all" ? null : studentId,
      reportType,
      format: outputFormat,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      includeCharts: includeCharts || false,
      includeTables: includeTables || false,
      includeRecommendations: includeRecommendations || false,
    });

    // Set response headers based on output format
    if (outputFormat === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=mental_health_report_${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`
      );

      // Generate PDF
      const doc = new PDFDocument({ margin: 50 });
      doc.pipe(res);

      // Add content to PDF
      counselorQueries.generatePdfReport(doc, reportData, {
        includeCharts,
        includeTables,
        includeRecommendations,
      });

      doc.end();
    } else {
      // CSV format
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=mental_health_report_${new Date()
          .toISOString()
          .slice(0, 10)}.csv`
      );

      // Generate CSV
      const csvContent = counselorQueries.generateCsvReport(reportData, {
        includeTables,
        includeRecommendations,
      });
      res.send(csvContent);
    }
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({
      error: "Failed to generate report",
    });
  }
};

/**
 * Get report generation history for the counselor
 */
const getReportHistoryController = async (req, res) => {
  try {
    // Get counselor ID from user
    const counselor = await counselorQueries.getCounselorByUserId(req.user.id);

    if (!counselor) {
      return res.status(404).json({
        error: "Counselor profile not found",
      });
    }

    // Get all reports for this counselor
    const reports = await counselorQueries.getCounselorReports(counselor.id);

    res.status(200).json({ reports });
  } catch (error) {
    console.error("Error fetching report history:", error);
    res.status(500).json({
      error: "Failed to fetch report history",
    });
  }
};

/**
 * Download a previously generated report
 */
const downloadReportController = async (req, res) => {
  try {
    const { reportId } = req.params;

    // Validate input
    if (!reportId) {
      return res.status(400).json({ error: "Report ID is required" });
    }

    // Get counselor ID from user
    const counselor = await counselorQueries.getCounselorByUserId(req.user.id);

    if (!counselor) {
      return res.status(404).json({
        error: "Counselor profile not found",
      });
    }

    // Get the report
    const report = await counselorQueries.getReportById(reportId, counselor.id);

    if (!report) {
      return res.status(404).json({
        error: "Report not found or access denied",
      });
    }

    // Re-generate the report based on stored parameters
    const reportData = await counselorQueries.generateReportData(
      counselor.id,
      report.studentId || "all",
      report.startDate,
      report.endDate,
      report.reportType
    );

    // Set response headers based on format
    if (report.format === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=mental_health_report_${report.createdAt
          .toISOString()
          .slice(0, 10)}.pdf`
      );

      // Generate PDF
      const doc = new PDFDocument({ margin: 50 });
      doc.pipe(res);

      // Add content to PDF
      counselorQueries.generatePdfReport(doc, reportData, {
        includeCharts: report.includeCharts,
        includeTables: report.includeTables,
        includeRecommendations: report.includeRecommendations,
      });

      doc.end();
    } else {
      // CSV format
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=mental_health_report_${report.createdAt
          .toISOString()
          .slice(0, 10)}.csv`
      );

      // Generate CSV
      const csvContent = counselorQueries.generateCsvReport(reportData, {
        includeTables: report.includeTables,
        includeRecommendations: report.includeRecommendations,
      });
      res.send(csvContent);
    }
  } catch (error) {
    console.error("Error downloading report:", error);
    res.status(500).json({
      error: "Failed to download report",
    });
  }
};

const getStudentInitialAssessment = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get the student's initial assessment using the query function
    const assessment = await counselorQueries.getStudentInitialAssessment(
      studentId
    );
    return res.status(200).json(assessment);
  } catch (error) {
    console.error("Error fetching student initial assessment:", error);
    if (error.message === "Initial assessment not found") {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get daily submission counts for mood entries and surveys
 */
const getDailySubmissionCountsController = async (req, res) => {
  try {
    const counts = await counselorQueries.getDailySubmissionCounts();
    res.status(200).json(counts);
  } catch (error) {
    console.error("Error getting daily submission counts:", error);
    res.status(500).json({
      error: "Failed to get daily submissions data",
    });
  }
};

const getTrendsController = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    console.log(
      `Trends request - period: ${period}, startDate: ${startDate}, endDate: ${endDate}`
    );

    // Get counselor ID from user
    const counselor = await counselorQueries.getCounselorByUserId(req.user.id);

    if (!counselor) {
      console.log(`Counselor not found for user ID: ${req.user.id}`);
      return res.status(404).json({
        error: "Counselor profile not found",
      });
    }
    console.log(`Processing trends request for counselor ID: ${counselor.id}`);

    // Get mood trends data
    console.log("Fetching mood trends data...");
    const moodTrends = await counselorQueries.getMoodTrends(
      period,
      startDate,
      endDate
    );
    console.log(`Retrieved ${moodTrends.length} mood trend periods`);

    // Get daily mood trends
    console.log("Fetching daily mood trends data...");
    const dailyMoodTrends = await counselorQueries.getDailyMoodTrends(
      startDate,
      endDate
    );
    console.log(`Retrieved ${dailyMoodTrends.length} daily mood trend entries`);

    // Get timeframe trends
    console.log("Fetching timeframe trends data...");
    const timeframeTrends = await counselorQueries.getTimeframeTrends(
      period,
      startDate,
      endDate
    );
    console.log("Timeframe trends:", timeframeTrends);

    // If all data is empty, log a warning
    if (
      moodTrends.length === 0 &&
      dailyMoodTrends.length === 0 &&
      (!timeframeTrends || timeframeTrends.totalEntries === 0)
    ) {
      console.log("WARNING: No trends data available for the selected period");
    }

    console.log("Sending trends response");
    res.status(200).json({
      moodTrends,
      dailyMoodTrends,
      timeframeTrends,
    });
  } catch (error) {
    console.error("Error fetching trends data:", error);
    res.status(500).json({
      error: "Failed to fetch trends data",
    });
  }
};

const getDailySubmissionsController = async (req, res) => {
  try {
    const counts = await counselorQueries.getDailySubmissionCounts();
    res.status(200).json(counts);
  } catch (error) {
    console.error("Error getting daily submission counts:", error);
    res.status(500).json({
      error: "Failed to get daily submissions data",
    });
  }
};

module.exports = {
  getStudentsController,
  getStudentSurveysController,
  getStudentMoodsController,
  getInterventionsController,
  createInterventionController,
  updateInterventionController,
  deleteInterventionController,
  generateReportController,
  getReportHistoryController,
  downloadReportController,
  getStudentInitialAssessment,
  getDailySubmissionCountsController,
  getTrendsController,
  getDailySubmissionsController,
};
