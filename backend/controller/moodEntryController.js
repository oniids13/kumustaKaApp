const {
  createMoodEntry,
  getRecentMoodEntry,
  checkTodaySubmission,
} = require("../model/moodEntryQueries");

const createMoodEntryController = async (req, res) => {
  const userId = req.user.id;
  const { moodLevel, notes } = req.body;

  try {
    if (!userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const newMoodEntry = await createMoodEntry(userId, moodLevel, notes);

    return res.status(201).json({
      success: true,
      message: "Mood entry recorded",
      data: newMoodEntry,
    });
  } catch (error) {
    console.error("Error creating mood entry");
    if (error.message.includes("already submitted")) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to create mood entry",
    });
  }
};

const getRecentMoodEntryController = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const entries = await getRecentMoodEntry(userId);

    return res.status(200).json({
      success: true,
      data: entries,
    });
  } catch (error) {
    console.error("Error getting mood entries:", error);
    return res.status(500).json({
      success: false,
      error: "Failed fetching all mood entries",
    });
  }
};

const checkTodaySubmissionController = async (req, res) => {
  try {
    const userId = req.user.id;

    const entry = await checkTodaySubmission(userId);

    return res.json({
      hasSubmitted: !!entry,
      todayEntry: entry || null,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createMoodEntryController,
  getRecentMoodEntryController,
  checkTodaySubmissionController,
};
