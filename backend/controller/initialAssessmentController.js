const {
  createInitialAssessment,
  getInitialAssessment,
  submitInitialAssessment,
} = require("../model/initialAssessmentQueries");

const createInitialAssessmentController = async (req, res) => {
  const userId = req.user.id;
  try {
    const assessment = await createInitialAssessment(userId);
    return res.status(201).json(assessment);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getInitialAssessmentController = async (req, res) => {
  const userId = req.user.id;
  try {
    const assessment = await getInitialAssessment(userId);
    return res.status(200).json(assessment);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

// controller/initialAssessmentController.js
const submitInitialAssessmentController = async (req, res) => {
  const userId = req.user.id;
  const { answers } = req.body;

  if (!answers || typeof answers !== "object") {
    return res
      .status(400)
      .json({ message: "Answers must be provided as an object." });
  }

  try {
    const result = await submitInitialAssessment(userId, answers);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createInitialAssessmentController,
  getInitialAssessmentController,
  submitInitialAssessmentController,
};
