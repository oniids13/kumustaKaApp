const {
  getDailyQuestions,
  createQuizQuestion,
  recordQuizAttempt,
  getStudentAttempts,
  getQuiz,
  checkAttemptToday,
} = require("../model/quizzesQueries");

const createQuestionController = async (req, res) => {
  try {
    const question = await createQuizQuestion(req.body);
    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getDailyQuestionsController = async (req, res) => {
  try {
    const userId = req.user.id;

    const questions = await getDailyQuestions(userId);

    if (questions.length === 0) {
      return res.status(404).json({ error: "No questions available" });
    }

    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const submitAttemptController = async (req, res) => {
  try {
    const { quizId, selectedAnswer } = req.body;
    const userId = req.user.id;

    // Get the quiz to verify correct answer
    const quiz = await getQuiz(quizId);
    if (!quiz) throw new Error("Quiz not found");

    // Calculate score
    const isCorrect = quiz.correctAnswer === selectedAnswer;
    const score = isCorrect ? quiz.points : 0;

    const attempt = await recordQuizAttempt(
      quizId,
      userId,
      selectedAnswer,
      score
    );

    res.status(201).json({
      attempt,
      isCorrect,
      explanation: quiz.explanation,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAttemptHistoryController = async (req, res) => {
  try {
    const userId = req.user.id;
    const attempts = await getStudentAttempts(userId);
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const checkAttemptTodayController = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(404).json({ error: "User not found" });
    }

    const attempts = await checkAttemptToday(userId);
    res.json({
      completed: attempts.length > 0,
    });
  } catch (error) {
    console.error("Error checking today attempts:", error);
    res.status(500).json({ error: "Failed to check today attempts" });
  }
};

module.exports = {
  createQuestionController,
  getDailyQuestionsController,
  submitAttemptController,
  getAttemptHistoryController,
  checkAttemptTodayController,
};
