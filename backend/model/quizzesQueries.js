const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getDailyQuestions = async (studentId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttempts = await prisma.quizAttempt.findMany({
      where: {
        studentId,
        createdAt: {
          gte: today,
        },
      },
      select: { quizId: true },
    });

    if (existingAttempts.length > 0) {
      return await prisma.quiz.findMany({
        where: {
          id: { in: existingAttempts.map((a) => a.quizId) },
        },
      });
    }

    const questionCount = await prisma.quiz.count();
    const skip = Math.floor(Math.random() * Math.max(0, questionCount - 5));

    return await prisma.quiz.findMany({
      where: {
        OR: [{ studentId: null }, { studentId }],
      },
      skip,
      take: 5,
      orderBy: {
        id: "asc",
      },
    });
  } catch (error) {
    throw error;
  }
};

const recordQuizAttempt = async (attemptData) => {
  try {
    return await prisma.quizAttempt.create({
      data: attemptData,
    });
  } catch (error) {
    throw error;
  }
};

const getStudentAttempts = async (studentId) => {
  try {
    return await prisma.quizAttempt.findMany({
      where: { studentId },
      include: { quiz: true },
    });
  } catch (error) {
    throw error;
  }
};

const createQuizQuestion = async (questionData) => {
  try {
    return await prisma.quiz.create({
      data: questionData,
    });
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getDailyQuestions,
  createQuizQuestion,
  recordQuizAttempt,
  getStudentAttempts,
};
