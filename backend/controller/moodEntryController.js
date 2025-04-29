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
    const weekNumber = parseInt(req.params.weekNumber);

    if (!userId) {
      return res.status(403).json([]); // Return empty array for consistency
    }

    let entries = await getRecentMoodEntry(userId, weekNumber);

    // Ensure we're working with an array
    if (!Array.isArray(entries)) {
      console.warn("getRecentMoodEntry did not return an array");
      entries = [];
    }

    // Filter and format response
    const responseData = entries.filter(
      (entry) => entry && typeof entry === "object" && "moodLevel" in entry
    );

    return res.status(200).json(responseData); // Direct array response
  } catch (error) {
    console.error("Error getting mood entries:", error);
    return res.status(500).json([]); // Always return array
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
