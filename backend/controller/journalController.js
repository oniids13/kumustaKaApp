const {
  createJournal,
  getAllJournals,
  editJournal,
  deleteJournal,
} = require("../model/journalQueries");

const createJournalController = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({ message: "Journal content is required" });
    }

    if (!content || typeof content !== "string") {
      return res.status(400).json({ message: "Invalid journal content" });
    }

    const newJournalEntry = await createJournal(userId, content);

    res.status(201).json(newJournalEntry);
  } catch (error) {
    console.error("Error creating journal entry:", error);

    if (error.message.includes("Student not found")) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    res.status(500).json({
      message: error.message || "Error creating journal entry.",
    });
  }
};

const getAllJournalsController = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const allJournals = await getAllJournals(userId);

    return res.status(200).json(allJournals);
  } catch (error) {
    console.error("Error fetching journals:", error);
    return res.status(500).json({
      message: error.message || "Error fetching Journal Entries.",
    });
  }
};

const editJournalController = async (req, res) => {
  try {
    const { journalId } = req.params;
    const { content } = req.body;

    // Validate input
    if (!content || typeof content !== "string") {
      return res
        .status(400)
        .json({ message: "Valid journal content is required" });
    }

    const updatedJournal = await editJournal(journalId, content);

    res.status(200).json(updatedJournal);
  } catch (error) {
    console.error("Error updating journal:", error);
    res.status(500).json({
      message: error.message || "Failed to update journal entry",
    });
  }
};

const deleteJournalController = async (req, res) => {
  try {
    const { journalId } = req.params;

    await deleteJournal(journalId);

    res.status(200).json({ success: "Journal Deleted" });
  } catch (error) {
    console.error("Error deleting journal:", error);
    res.status(500).json({
      message: error.message || "Failed to delete journal entry",
    });
  }
};

module.exports = {
  createJournalController,
  getAllJournalsController,
  editJournalController,
  deleteJournalController,
};
