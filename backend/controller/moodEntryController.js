const {
  createMoodEntry,
  getRecentMoodEntry,
  checkTodaySubmission,
  getAllMoodEntries,
} = require("../model/moodEntryQueries");

const createMoodEntryController = async (req, res) => {
  const userId = req.user.id;
  const { moodLevel, notes, forceCreate } = req.body;

  // Get client timezone info
  const clientTime = req.headers["x-client-time"]
    ? new Date(req.headers["x-client-time"])
    : null;
  const clientTimezone = req.headers["x-client-timezone"] || "Not provided";

  console.log(`[DEBUG] Creating mood entry for user ${userId}:
    - Server time: ${new Date().toISOString()}
    - Client time: ${clientTime ? clientTime.toISOString() : "Not provided"}
    - Client timezone: ${clientTimezone}
    - Mood level: ${moodLevel}
    - Force create: ${forceCreate === true}`);

  try {
    if (!userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const newMoodEntry = await createMoodEntry(
      userId,
      moodLevel,
      notes,
      forceCreate === true
    );

    // Save submission info to help debug timezone issues
    console.log(
      `[INFO] Successfully created mood entry with ID: ${newMoodEntry.id}`
    );

    return res.status(201).json({
      success: true,
      message: "Mood entry recorded",
      data: newMoodEntry,
    });
  } catch (error) {
    console.error("Error creating mood entry:", error);
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
    const requestTime = new Date();
    const clientTime = req.headers["x-client-time"]
      ? new Date(req.headers["x-client-time"])
      : null;
    const clientTimezone = req.headers["x-client-timezone"] || "Not provided";
    const forceCheck = req.query.forceCheck === "true";

    console.log(
      `[DEBUG] Checking mood entry for user ${userId}:
      - Server time: ${requestTime.toISOString()}
      - Client time: ${clientTime ? clientTime.toISOString() : "Not provided"}
      - Client timezone: ${clientTimezone}
      - Force check: ${forceCheck}`
    );

    // Get the entry result - only call this once
    const result = await checkTodaySubmission(userId, clientTime);
    const { entry, debugInfo } = result || { entry: null, debugInfo: {} };

    // Allow overriding if forceCheck is true
    const hasSubmitted = forceCheck ? false : !!entry;

    const responseData = {
      hasSubmitted,
      todayEntry: entry || null,
      debug: {
        requestTime: requestTime.toISOString(),
        responseTime: new Date().toISOString(),
        timeZone: process.env.TZ || "Not specified",
        clientTime: clientTime ? clientTime.toISOString() : "Not provided",
        clientTimezone,
        dateCalculation: debugInfo || {},
        // Include more details about the process
        entryExists: !!entry,
        entryId: entry?.id,
        entryCreatedAt: entry?.createdAt,
        forceCheckApplied: forceCheck,
      },
    };

    console.log(
      `[DEBUG] Mood check response for user ${userId}:`,
      JSON.stringify(responseData, null, 2)
    );

    return res.json(responseData);
  } catch (error) {
    console.error("[ERROR] Check today mood submission failed:", error);
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

const getAllMoodEntriesController = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(403).json([]); // Return empty array for consistency
    }

    let entries = await getAllMoodEntries(userId);

    // Ensure we're working with an array
    if (!Array.isArray(entries)) {
      console.warn("getAllMoodEntries did not return an array");
      entries = [];
    }

    return res.status(200).json(entries); // Direct array response
  } catch (error) {
    console.error("Error getting all mood entries:", error);
    return res.status(500).json([]); // Always return array
  }
};

module.exports = {
  createMoodEntryController,
  getRecentMoodEntryController,
  checkTodaySubmissionController,
  getAllMoodEntriesController,
};
