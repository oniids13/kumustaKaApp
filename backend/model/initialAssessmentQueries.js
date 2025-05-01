const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const dass21 = require("../resources/initialAssessmentData");

const createInitialAssessment = async (userId) => {
  try {
    const student = prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    const existing = await prisma.initialAssessment.findUnique({
      where: {
        studentId: student.id,
      },
    });

    if (existing) {
      throw new Error("Initial assessment already exists for this student.");
    }

    const assessment = await prisma.initialAssessment.create({
      data: {
        studentId: student.id,
        assessmentData: dass21,
        anwers: {},
        totalScore: 0.0,
        depressionScore: 0.0,
        anxietyScore: 0.0,
        stressScore: 0.0,
      },
    });

    return assessment;
  } catch (error) {
    throw new Error("Error creating initial assessment");
  }
};

const getInitialAssessment = async (userId) => {
  try {
    const student = prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    const assessment = await prisma.initialAssessment.findUnique({
      where: { studentId: student.id },
    });

    if (!assessment) {
      throw new Error("Initial assessment not found for this student.");
    }

    return assessment;
  } catch (error) {
    throw new Error("Error fetching initial assessment data");
  }
};

const submitInitialAssessment = async (userId, answers) => {
  try {
    // Get the student ID
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    const assessment = await prisma.initialAssessment.findUnique({
      where: { studentId: student.id },
    });

    if (!assessment) {
      throw new Error("Assessment not found");
    }

    const depressionItems = ["3", "5", "10", "13", "16", "17", "21"];
    const anxietyItems = ["2", "4", "7", "9", "15", "19", "20"];
    const stressItems = ["1", "6", "8", "11", "12", "14", "18"];

    const computeSubscale = (keys) =>
      keys.reduce((sum, key) => sum + (answers[key] || 0), 0) * 2;

    const depressionScore = computeSubscale(depressionItems);
    const anxietyScore = computeSubscale(anxietyItems);
    const stressScore = computeSubscale(stressItems);
    const totalScore = depressionScore + anxietyScore + stressScore;

    const updated = await prisma.initialAssessment.update({
      where: { studentId: student.id },
      data: {
        answers,
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
