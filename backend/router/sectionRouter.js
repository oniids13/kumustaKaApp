const express = require("express");
const router = express.Router();
const passport = require("passport");
const checkRole = require("../middleware/checkRole");
const sectionController = require("../controller/sectionController");

// Middleware for JWT authentication
const authenticate = passport.authenticate("jwt", { session: false });

// Public route - verify section code (for registration)
router.get("/verify/:code", sectionController.verifySectionCodeController);

// Admin routes - Section CRUD
router.get(
  "/",
  authenticate,
  checkRole(["ADMIN"]),
  sectionController.getAllSectionsController
);

router.get(
  "/available-teachers",
  authenticate,
  checkRole(["ADMIN"]),
  sectionController.getAvailableTeachersController
);

router.get(
  "/available-counselors",
  authenticate,
  checkRole(["ADMIN"]),
  sectionController.getAllCounselorsController
);

router.get(
  "/:id",
  authenticate,
  checkRole(["ADMIN", "COUNSELOR"]),
  sectionController.getSectionByIdController
);

router.post(
  "/",
  authenticate,
  checkRole(["ADMIN"]),
  sectionController.createSectionController
);

router.put(
  "/:id",
  authenticate,
  checkRole(["ADMIN"]),
  sectionController.updateSectionController
);

router.delete(
  "/:id",
  authenticate,
  checkRole(["ADMIN"]),
  sectionController.deleteSectionController
);

router.post(
  "/:id/regenerate-code",
  authenticate,
  checkRole(["ADMIN"]),
  sectionController.regenerateCodeController
);

router.post(
  "/:id/assign-teacher",
  authenticate,
  checkRole(["ADMIN"]),
  sectionController.assignTeacherController
);

router.post(
  "/:id/remove-teacher",
  authenticate,
  checkRole(["ADMIN"]),
  sectionController.removeTeacherController
);

// Counselor assignment (admin)
router.post(
  "/:id/assign-counselor",
  authenticate,
  checkRole(["ADMIN"]),
  sectionController.assignCounselorController
);

router.post(
  "/:id/remove-counselor",
  authenticate,
  checkRole(["ADMIN"]),
  sectionController.removeCounselorController
);

// Student routes
router.post(
  "/join/student",
  authenticate,
  checkRole(["STUDENT"]),
  sectionController.studentJoinSectionController
);

router.post(
  "/leave",
  authenticate,
  checkRole(["STUDENT"]),
  sectionController.leaveSectionController
);

// Teacher routes
router.post(
  "/join/teacher",
  authenticate,
  checkRole(["TEACHER"]),
  sectionController.teacherJoinSectionController
);

// Counselor routes
router.post(
  "/join/counselor",
  authenticate,
  checkRole(["COUNSELOR"]),
  sectionController.counselorJoinSectionController
);

module.exports = router;
