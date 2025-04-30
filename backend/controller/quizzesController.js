const {
  getDailyQuestions,
  createQuizQuestion,
  recordQuizAttempt,
  getStudentAttempts,
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
    const questions = await getDailyQuestions(req.user.studentId);

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

    // Get the quiz to verify correct answer
    const quiz = await getAllQuizQuestions(null, quizId);
    if (!quiz) throw new Error("Quiz not found");

    // Calculate score
    const isCorrect = quiz.correctAnswer === selectedAnswer;
    const score = isCorrect ? quiz.points : 0;

    const attempt = await recordQuizAttempt({
      quizId,
      studentId: req.user.studentId,
      selectedAnswer,
      score,
    });

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
    const attempts = await getStudentAttempts(req.user.studentId);
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createQuestionController,
  getDailyQuestionsController,
  submitAttemptController,
  getAttemptHistoryController,
};
