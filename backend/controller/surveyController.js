// backend/controller/surveyController.js
const {
  createSurvey,
  getDailySurvey,
  createSurveyResponse,
  getTodaysResponse,
  getSurveyResponses,
} = require("../model/surveyQueries");

const { ensureDailySurveyExists } = require("../services/surveyInitService");

// Admin endpoint - Create new survey
const createSurveyController = async (req, res) => {
  try {
    if (!req.body.questions || !Array.isArray(req.body.questions)) {
      return res.status(400).json({
        success: false,
        error: "Questions array is required",
      });
    }

    const survey = await createSurvey(req.body);
    res.status(201).json({
      success: true,
      data: survey,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get current daily survey
const getDailySurveyController = async (req, res) => {
  try {
    // This will create the survey if it doesn't exist
    const survey = await ensureDailySurveyExists();

    if (!survey) {
      return res.status(500).json({
        success: false,
        error: "Failed to load daily survey",
      });
    }

    res.json({
      success: true,
      data: {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        questions: survey.questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Submit survey responses
const submitSurveyController = async (req, res) => {
  const { answers } = req.body;
  const userId = req.user.id;

  if (!answers || typeof answers !== "object") {
    return res.status(400).json({
      success: false,
      error: "Answers must be provided as an object",
    });
  }

  try {
    const response = await createSurveyResponse(userId, answers);

    res.status(201).json({
      success: true,
      data: {
        id: response.id,
        score: response.score,
        percentage: response.percentage,
        zone: response.zone,
        submittedAt: response.createdAt,
      },
    });
  } catch (error) {
    const statusCode = error.message.includes("already completed") ? 409 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
};

// Check if user completed today's survey
const checkTodaysSubmissionController = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(
      `[DEBUG] Checking survey submission for user ${userId} at ${new Date().toISOString()}`
    );

    const response = await getTodaysResponse(userId);
    console.log(
      `[DEBUG] Survey response result:`,
      response ? "Response found" : "No response found",
      response ? `(ID: ${response.id}, created: ${response.createdAt})` : ""
    );

    res.json({
      success: true,
      data: {
        submitted: !!response,
        response: response
          ? {
              id: response.id,
              score: response.score,
              percentage: response.percentage,
              zone: response.zone,
              submittedAt: response.createdAt,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("[ERROR] Check today survey submission failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get historical responses
const getResponseHistoryController = async (req, res) => {
  try {
    const userId = req.user.id;

    const period = req.query.period || "30d";
    const responses = await getSurveyResponses(userId, period);

    res.json({
      success: true,
      data: responses.map((r) => ({
        id: r.id,
        date: r.phDate,
        score: r.score,
        percentage: r.percentage,
        zone: r.zone,
        submittedAt: r.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  createSurveyController,
  getDailySurveyController,
  submitSurveyController,
  checkTodaysSubmissionController,
  getResponseHistoryController,
};
