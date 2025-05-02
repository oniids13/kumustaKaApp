const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const dass21 = require("../resources/initialAssessmentData");

const createInitialAssessment = async (userId) => {
  try {
    // First check if student exists
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    // Check for existing assessment in transaction
    const existing = await prisma.initialAssessment.findUnique({
      where: { studentId: student.id },
    });

    if (existing) {
      return existing;
    }

    // Create new assessment
    const assessment = await prisma.initialAssessment.create({
      data: {
        studentId: student.id,
        assessmentData: dass21,
        answers: {},
        totalScore: 0,
        depressionScore: 0,
        anxietyScore: 0,
        stressScore: 0,
      },
    });

    return assessment;
  } catch (error) {
    console.error("Create Initial Assessment Error:", error);
    throw error;
  }
};

const getInitialAssessment = async (userId) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) throw new Error("Student not found");

    const assessment = await prisma.initialAssessment.findUnique({
      where: { studentId: student.id },
    });

    if (!assessment) {
      throw new Error("Initial assessment not found for this student.");
    }

    return assessment;
  } catch (error) {
    console.error("Error fetching initial assessment:", error);
    throw new Error("Error fetching initial assessment data");
  }
};

// model/initialAssessmentQueries.js
const submitInitialAssessment = async (userId, answers) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) throw new Error("Student not found");

    const assessment = await prisma.initialAssessment.findUnique({
      where: { studentId: student.id },
    });

    if (!assessment) throw new Error("Assessment not found");

    // Updated scoring to work with D1, A2, etc. format
    const depressionItems = ["D1", "D2", "D3", "D4", "D5", "D6", "D7"];
    const anxietyItems = ["A1", "A2", "A3", "A4", "A5", "A6", "A7"];
    const stressItems = ["S1", "S2", "S3", "S4", "S5", "S6", "S7"];

    const computeSubscale = (keys) =>
      keys.reduce((sum, key) => sum + (answers[key] || 0), 0) * 2;

    const depressionScore = computeSubscale(depressionItems);
    const anxietyScore = computeSubscale(anxietyItems);
    const stressScore = computeSubscale(stressItems);
    const totalScore = depressionScore + anxietyScore + stressScore;

    const updated = await prisma.initialAssessment.update({
      where: { studentId: student.id },
      data: {
        answers, // Now stores original format { D1: 2, A2: 1, ... }
        depressionScore,
        anxietyScore,
        stressScore,
        totalScore,
      },
    });

    return updated;
  } catch (error) {
    console.error(error);
    throw new Error("Error submitting assessment");
  }
};

module.exports = {
  createInitialAssessment,
  getInitialAssessment,
  submitInitialAssessment,
};
