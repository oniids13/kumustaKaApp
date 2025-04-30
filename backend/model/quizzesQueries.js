const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const isWeekend = () => {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
};

const getDailyQuestions = async (userId) => {
  try {
    // Check if it's weekend
    if (isWeekend()) {
      return []; // No quizzes on weekends
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    // Check if student already attempted today
    const existingAttempts = await prisma.quizAttempt.findMany({
      where: {
        studentId: student.id,
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

    // Get random 5 questions if no attempts today
    const questionCount = await prisma.quiz.count();
    const skip = Math.floor(Math.random() * Math.max(0, questionCount - 5));

    return await prisma.quiz.findMany({
      where: {
        OR: [{ studentId: null }, { studentId: student.id }],
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

const recordQuizAttempt = async (quizId, userId, selectedAnswer, score) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    return await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: student.id,
        selectedAnswer,
        score,
      },
    });
  } catch (error) {
    throw error;
  }
};

const getStudentAttempts = async (userId) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    return await prisma.quizAttempt.findMany({
      where: { studentId: student.id },
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

const getQuiz = async (quizId) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    return quiz;
  } catch (error) {
    throw error;
  }
};

const checkAttemptToday = async (userId) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      throw new Error("Unauthorized");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        studentId: student.id,
        createdAt: {
          gte: today,
        },
      },
      select: {
        id: true,
      },
    });

    return attempts;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getQuiz,
  getDailyQuestions,
  createQuizQuestion,
  recordQuizAttempt,
  getStudentAttempts,
  checkAttemptToday,
};
