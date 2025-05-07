const {
  createGoal,
  toggleGoalCompletion,
  getWeeklyGoals,
  getYearlySummary,
  updateWeeklySummary,
} = require("../model/goalTracker");

// Create a new goal
const createGoalController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title } = req.body;
    const userId = req.user.id;

    const goal = await createGoal(userId, title);
    return res.status(201).json(goal);
  } catch (error) {
    console.error("Error creating goal:", error);
    if (error.message === "Maximum of 5 goals per week allowed") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get weekly goals for current user
const getWeeklyGoalsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const goals = await getWeeklyGoals(userId);
    return res.status(200).json(goals);
  } catch (error) {
    console.error("Error fetching weekly goals:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Toggle goal completion status
const toggleGoalCompletionController = async (req, res) => {
  try {
    const { goalId } = req.params;
    const updatedGoal = await toggleGoalCompletion(goalId);

    // Update the weekly summary after toggling a goal
    await updateWeeklySummary(req.user.id);

    return res.status(200).json(updatedGoal);
  } catch (error) {
    console.error("Error toggling goal completion:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get yearly summary of goal progress
const getYearlySummaryController = async (req, res) => {
  try {
    const userId = req.user.id;
    const year = req.query.year
      ? parseInt(req.query.year)
      : new Date().getFullYear();

    const summary = await getYearlySummary(userId, year);
    return res.status(200).json(summary);
  } catch (error) {
    console.error("Error fetching yearly summary:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Force update weekly summary
const updateWeeklySummaryController = async (req, res) => {
  try {
    const userId = req.user.id;
    const summary = await updateWeeklySummary(userId);
    return res.status(200).json(summary);
  } catch (error) {
    console.error("Error updating weekly summary:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createGoalController,
  getWeeklyGoalsController,
  toggleGoalCompletionController,
  getYearlySummaryController,
  updateWeeklySummaryController,
};
