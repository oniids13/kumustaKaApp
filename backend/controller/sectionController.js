const { body, validationResult } = require("express-validator");
const sectionQueries = require("../model/sectionQueries");

// Validation rules
const validateSection = [
  body("name")
    .notEmpty()
    .withMessage("Section name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Section name must be between 2 and 100 characters"),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  body("gradeLevel")
    .optional()
    .isLength({ max: 50 })
    .withMessage("Grade level must not exceed 50 characters"),
];

const validateJoinCode = [
  body("code")
    .notEmpty()
    .withMessage("Section code is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("Section code must be exactly 6 characters"),
];

/**
 * Get all sections
 */
const getAllSectionsController = async (req, res) => {
  try {
    const sections = await sectionQueries.getAllSections();
    res.status(200).json({ sections });
  } catch (error) {
    console.error("Error getting sections:", error);
    res.status(500).json({ message: "Failed to fetch sections" });
  }
};

/**
 * Get section by ID
 */
const getSectionByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await sectionQueries.getSectionById(id);

    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    res.status(200).json({ section });
  } catch (error) {
    console.error("Error getting section:", error);
    res.status(500).json({ message: "Failed to fetch section" });
  }
};

/**
 * Create a new section
 */
const createSectionController = [
  validateSection,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const section = await sectionQueries.createSection(req.body);
      res.status(201).json({
        message: "Section created successfully",
        section,
      });
    } catch (error) {
      console.error("Error creating section:", error);
      res.status(500).json({ message: "Failed to create section" });
    }
  },
];

/**
 * Update a section
 */
const updateSectionController = [
  validateSection,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const section = await sectionQueries.updateSection(id, req.body);
      res.status(200).json({
        message: "Section updated successfully",
        section,
      });
    } catch (error) {
      console.error("Error updating section:", error);
      res.status(500).json({ message: "Failed to update section" });
    }
  },
];

/**
 * Delete a section
 */
const deleteSectionController = async (req, res) => {
  try {
    const { id } = req.params;
    await sectionQueries.deleteSection(id);
    res.status(200).json({ message: "Section deleted successfully" });
  } catch (error) {
    console.error("Error deleting section:", error);
    res.status(500).json({ message: "Failed to delete section" });
  }
};

/**
 * Regenerate section code
 */
const regenerateCodeController = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await sectionQueries.regenerateSectionCode(id);
    res.status(200).json({
      message: "Section code regenerated successfully",
      section,
    });
  } catch (error) {
    console.error("Error regenerating code:", error);
    res.status(500).json({ message: "Failed to regenerate code" });
  }
};

/**
 * Assign teacher to section
 */
const assignTeacherController = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId } = req.body;

    if (!teacherId) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    const section = await sectionQueries.assignTeacherToSection(id, teacherId);
    res.status(200).json({
      message: "Teacher assigned successfully",
      section,
    });
  } catch (error) {
    console.error("Error assigning teacher:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to assign teacher" });
  }
};

/**
 * Remove teacher from section
 */
const removeTeacherController = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await sectionQueries.removeTeacherFromSection(id);
    res.status(200).json({
      message: "Teacher removed successfully",
      section,
    });
  } catch (error) {
    console.error("Error removing teacher:", error);
    res.status(500).json({ message: "Failed to remove teacher" });
  }
};

/**
 * Student joins section with code
 */
const studentJoinSectionController = [
  validateJoinCode,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { code } = req.body;
      const studentId = req.user.student?.id;

      if (!studentId) {
        return res.status(400).json({ message: "Student profile not found" });
      }

      const student = await sectionQueries.joinSectionWithCode(studentId, code);
      res.status(200).json({
        message: "Successfully joined section",
        section: student.section,
      });
    } catch (error) {
      console.error("Error joining section:", error);
      res
        .status(400)
        .json({ message: error.message || "Failed to join section" });
    }
  },
];

/**
 * Teacher joins section with code
 */
const teacherJoinSectionController = [
  validateJoinCode,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { code } = req.body;
      const teacherId = req.user.teacher?.id;

      if (!teacherId) {
        return res.status(400).json({ message: "Teacher profile not found" });
      }

      const teacher = await sectionQueries.teacherJoinSectionWithCode(
        teacherId,
        code
      );
      res.status(200).json({
        message: "Successfully joined section",
        section: teacher.section,
      });
    } catch (error) {
      console.error("Error teacher joining section:", error);
      res
        .status(400)
        .json({ message: error.message || "Failed to join section" });
    }
  },
];

/**
 * Counselor joins section with code
 */
const counselorJoinSectionController = [
  validateJoinCode,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { code } = req.body;
      const counselorId = req.user.counselor?.id;

      if (!counselorId) {
        return res.status(400).json({ message: "Counselor profile not found" });
      }

      const counselor = await sectionQueries.counselorJoinSectionWithCode(
        counselorId,
        code
      );
      res.status(200).json({
        message: "Successfully joined section",
        sections: counselor.sections,
      });
    } catch (error) {
      console.error("Error counselor joining section:", error);
      res
        .status(400)
        .json({ message: error.message || "Failed to join section" });
    }
  },
];

/**
 * Student leaves section
 */
const leaveSectionController = async (req, res) => {
  try {
    const studentId = req.user.student?.id;

    if (!studentId) {
      return res.status(400).json({ message: "Student profile not found" });
    }

    await sectionQueries.leaveSection(studentId);
    res.status(200).json({ message: "Successfully left section" });
  } catch (error) {
    console.error("Error leaving section:", error);
    res.status(500).json({ message: "Failed to leave section" });
  }
};

/**
 * Get available teachers (for admin assignment)
 */
const getAvailableTeachersController = async (req, res) => {
  try {
    const teachers = await sectionQueries.getAvailableTeachers();
    res.status(200).json({ teachers });
  } catch (error) {
    console.error("Error getting available teachers:", error);
    res.status(500).json({ message: "Failed to fetch available teachers" });
  }
};

/**
 * Verify section code (for registration)
 */
const verifySectionCodeController = async (req, res) => {
  try {
    const { code } = req.params;
    const section = await sectionQueries.getSectionByCode(code);

    if (!section) {
      return res
        .status(404)
        .json({ valid: false, message: "Invalid section code" });
    }

    if (!section.isActive) {
      return res
        .status(400)
        .json({ valid: false, message: "This section is not active" });
    }

    res.status(200).json({
      valid: true,
      section: {
        id: section.id,
        name: section.name,
        gradeLevel: section.gradeLevel,
        hasTeacher: !!section.teacher,
        teacherName: section.teacher
          ? `${section.teacher.user.firstName} ${section.teacher.user.lastName}`
          : null,
        studentCount: section._count.students,
      },
    });
  } catch (error) {
    console.error("Error verifying section code:", error);
    res.status(500).json({ valid: false, message: "Failed to verify code" });
  }
};

/**
 * Get all counselors (for admin assignment)
 */
const getAllCounselorsController = async (req, res) => {
  try {
    const counselors = await sectionQueries.getAllCounselors();
    res.status(200).json({ counselors });
  } catch (error) {
    console.error("Error getting counselors:", error);
    res.status(500).json({ message: "Failed to fetch counselors" });
  }
};

/**
 * Assign counselor to section (admin action)
 */
const assignCounselorController = async (req, res) => {
  try {
    const { id } = req.params;
    const { counselorId } = req.body;

    if (!counselorId) {
      return res.status(400).json({ message: "Counselor ID is required" });
    }

    const section = await sectionQueries.assignCounselorToSection(
      id,
      counselorId
    );
    res.status(200).json({
      message: "Counselor assigned successfully",
      section,
    });
  } catch (error) {
    console.error("Error assigning counselor:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to assign counselor" });
  }
};

/**
 * Remove counselor from section (admin action)
 */
const removeCounselorController = async (req, res) => {
  try {
    const { id } = req.params;
    const { counselorId } = req.body;

    if (!counselorId) {
      return res.status(400).json({ message: "Counselor ID is required" });
    }

    const section = await sectionQueries.removeCounselorFromSection(
      id,
      counselorId
    );
    res.status(200).json({
      message: "Counselor removed successfully",
      section,
    });
  } catch (error) {
    console.error("Error removing counselor:", error);
    res.status(500).json({ message: "Failed to remove counselor" });
  }
};

module.exports = {
  getAllSectionsController,
  getSectionByIdController,
  createSectionController,
  updateSectionController,
  deleteSectionController,
  regenerateCodeController,
  assignTeacherController,
  removeTeacherController,
  studentJoinSectionController,
  teacherJoinSectionController,
  counselorJoinSectionController,
  leaveSectionController,
  getAvailableTeachersController,
  verifySectionCodeController,
  getAllCounselorsController,
  assignCounselorController,
  removeCounselorController,
};
