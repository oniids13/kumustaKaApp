const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { calculateDailySurveyScore } = require("../utils/calculateSurveyScore");

const isWeekend = () => {
  const today = new Date();
  const day = today.getDay();
  return day === 0 || day === 6;
};

const getTodaySurvey = async () => {
  try {
    if (isWeekend()) return null; // No survey on weekends

    return await prisma.survey.findFirst({
      where: { title: "Daily Mental Health Survey" },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    throw error;
  }
};

const hasAttemptedToday = async (userId) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attempt = await prisma.surveyResponse.findFirst({
      where: {
        studentId: student.id,
        createdAt: { gte: today },
      },
    });

    return !!attempt;
  } catch (error) {
    throw error;
  }
};

const getDailySurveyForStudent = async (userId) => {
  try {
    if (isWeekend()) return null;

    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySurvey = await getTodaySurvey();
    if (!todaySurvey) return null;

    const existingResponse = await prisma.surveyResponse.findFirst({
      where: {
        studentId: student.id,
        surveyId: todaySurvey.id,
        createdAt: { gte: today },
      },
    });

    return existingResponse || todaySurvey;
  } catch (error) {
    throw error;
  }
};

const recordSurveyResponse = async (userId, surveyId, answers) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    const scoreDetails = calculateDailySurveyScore(answers);

    return await prisma.surveyResponse.create({
      data: {
        surveyId,
        studentId: student.id,
        answers,
        score: scoreDetails.totalScore,
      },
    });
  } catch (error) {
    throw error;
  }
};

const getStudentSurveyScores = async (userId) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    return await prisma.surveyResponse.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "asc" },
      select: {
        score: true,
        createdAt: true,
        answers: true,
      },
    });
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getTodaySurvey,
  hasAttemptedToday,
  getDailySurveyForStudent,
  recordSurveyResponse,
  getStudentSurveyScores,
};
