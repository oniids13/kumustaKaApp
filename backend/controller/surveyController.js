const {
  getDailySurveyForStudent,
  recordSurveyResponse,
  getStudentSurveyScores,
} = require("../model/surveyQueries");

// Get today's survey for the student
const getDailySurveyController = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await getDailySurveyForStudent(userId);

    if (!result) {
      return res.status(404).json({ error: "No survey available today" });
    }

    // Check if student already answered by checking if `answers` exist
    const alreadyAnswered = !!result.answers;

    res.json({ survey: result, alreadyAnswered });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Submit survey response (only if not already answered today)
const submitSurveyResponseController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { surveyId, answers } = req.body;

    const existing = await getDailySurveyForStudent(userId);
    if (existing?.answers) {
      return res.status(400).json({ error: "Survey already answered today." });
    }

    const response = await recordSurveyResponse(userId, surveyId, answers);
    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get student's historical survey scores
const getSurveyHistoryController = async (req, res) => {
  try {
    const userId = req.user.id;
    const scores = await getStudentSurveyScores(userId);
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDailySurveyController,
  submitSurveyResponseController,
  getSurveyHistoryController,
};
