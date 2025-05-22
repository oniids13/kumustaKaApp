// backend/model/surveyQueries.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getPHDateString } = require("../utils/phTime");
const { DAILY_SURVEY_SCORING } = require("../utils/surveyScoring");

const createSurvey = async (surveyData) => {
  return await prisma.survey.create({
    data: {
      title: surveyData.title,
      description: surveyData.description,
      type: surveyData.type,
      questions: surveyData.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
      })),
    },
  });
};

const getDailySurvey = async () => {
  return await prisma.survey.findFirst({
    where: { type: "DAILY" },
  });
};

const createSurveyResponse = async (userId, answers) => {
  const phDate = getPHDateString();

  const student = await prisma.student.findUnique({
    where: { userId },
  });

  return await prisma.$transaction(async (tx) => {
    // Check for existing response
    const existing = await tx.surveyResponse.findFirst({
      where: { studentId: student.id, phDate },
    });

    if (existing) {
      throw new Error("You have already completed today's survey");
    }

    // Get survey to validate question count
    const survey = await tx.survey.findFirst({
      where: { type: "DAILY" },
    });

    if (!survey) {
      throw new Error("Daily survey not found");
    }

    // Validate answers against survey questions
    const surveyQuestionIds = survey.questions.map((q) => q.id.toString());
    const answerQuestionIds = Object.keys(answers);

    if (surveyQuestionIds.length !== answerQuestionIds.length) {
      throw new Error(
        `Please answer all ${surveyQuestionIds.length} questions`
      );
    }

    // Calculate score with reverse scoring
    const scoreData = calculateSurveyScore(answers);

    // Create response
    return await tx.surveyResponse.create({
      data: {
        studentId: student.id,
        surveyId: survey.id,
        answers,
        score: scoreData.totalScore,
        percentage: scoreData.percentage,
        zone: scoreData.zone,
        phDate,
        createdAt: new Date(), // Actual creation time
      },
    });
  });
};

const getTodaysResponse = async (userId) => {
  const student = await prisma.student.findUnique({
    where: { userId },
  });

  const phDate = getPHDateString();
  return await prisma.surveyResponse.findFirst({
    where: { studentId: student.id, phDate },
    include: { survey: true },
  });
};

const getSurveyResponses = async (userId, period = "30d") => {
  const student = await prisma.student.findUnique({
    where: { userId },
  });

  const dateFilter = getDateFilter(period);
  return await prisma.surveyResponse.findMany({
    where: {
      studentId: student.id,
      createdAt: { gte: dateFilter },
    },
    orderBy: { createdAt: "desc" },
  });
};

// Helper functions
function calculateSurveyScore(answers) {
  let totalScore = 0;
  const answeredQuestions = Object.keys(answers).length;
  const maxPossibleScore = answeredQuestions * 5;

  Object.entries(answers).forEach(([questionId, value]) => {
    const numId = parseInt(questionId);

    if (DAILY_SURVEY_SCORING.reverseItems.includes(numId)) {
      totalScore += 6 - value; // Reverse score
    } else {
      totalScore += value; // Normal score
    }
  });

  const percentage = (totalScore / maxPossibleScore) * 100;
  const roundedPercentage = Math.round(percentage);

  let zone;
  if (roundedPercentage >= 80) zone = "Green (Positive)";
  else if (roundedPercentage >= 60) zone = "Yellow (Moderate)";
  else zone = "Red (Needs Attention)";

  return { totalScore, percentage: roundedPercentage, zone };
}

function getDateFilter(period) {
  const now = new Date();
  switch (period) {
    case "7d":
      return new Date(now.setDate(now.getDate() - 7));
    case "30d":
      return new Date(now.setDate(now.getDate() - 30));
    case "90d":
      return new Date(now.setDate(now.getDate() - 90));
    default:
      return new Date(0); // All time
  }
}

/**
 * Helper function to ensure consistent zone naming
 * This normalizes zone names to include descriptions in parentheses
 */
const normalizeZoneName = (zone) => {
  if (!zone) return null;

  // Convert simple color names to full zone names
  if (zone === "Yellow") return "Yellow (Moderate)";
  if (zone === "Red") return "Red (Needs Attention)";
  if (zone === "Green") return "Green (Positive)";

  // Return the original if it already has the full format
  return zone;
};

// Update this function to normalize zone names in the response
const getSurveyResponseById = async (responseId) => {
  try {
    const response = await prisma.surveyResponse.findUnique({
      where: { id: responseId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (response) {
      // Normalize the zone name for consistent frontend display
      response.zone = normalizeZoneName(response.zone);
    }

    return response;
  } catch (error) {
    console.error("Error fetching survey response:", error);
    throw error;
  }
};

module.exports = {
  createSurvey,
  getDailySurvey,
  createSurveyResponse,
  getTodaysResponse,
  getSurveyResponses,
  normalizeZoneName,
  getSurveyResponseById,
};
