const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

// System Dashboard
router.get(
  "/system-stats",
  auth,
  checkRole(["ADMIN"]),
  adminController.getSystemStats
);
router.get(
  "/recent-activities",
  auth,
  checkRole(["ADMIN"]),
  adminController.getRecentActivities
);

// User Management
router.get("/users", auth, checkRole(["ADMIN"]), adminController.getAllUsers);
router.post("/users", auth, checkRole(["ADMIN"]), adminController.createUser);
router.get(
  "/users/:id",
  auth,
  checkRole(["ADMIN"]),
  adminController.getUserById
);
router.put(
  "/users/:id",
  auth,
  checkRole(["ADMIN"]),
  adminController.updateUser
);
router.delete(
  "/users/:id",
  auth,
  checkRole(["ADMIN"]),
  adminController.deleteUser
);
router.patch(
  "/users/:id/status",
  auth,
  checkRole(["ADMIN"]),
  adminController.updateUserStatus
);

// Role Management
router.get("/roles", auth, checkRole(["ADMIN"]), adminController.getAllRoles);
router.post("/roles", auth, checkRole(["ADMIN"]), adminController.createRole);
router.get(
  "/roles/:id",
  auth,
  checkRole(["ADMIN"]),
  adminController.getRoleById
);
router.put(
  "/roles/:id",
  auth,
  checkRole(["ADMIN"]),
  adminController.updateRole
);
router.delete(
  "/roles/:id",
  auth,
  checkRole(["ADMIN"]),
  adminController.deleteRole
);

// System Configuration
router.get(
  "/settings",
  auth,
  checkRole(["ADMIN"]),
  adminController.getSystemSettings
);
router.put(
  "/settings",
  auth,
  checkRole(["ADMIN"]),
  adminController.updateSystemSettings
);

// Privacy Settings
router.get(
  "/privacy-settings",
  auth,
  checkRole(["ADMIN"]),
  adminController.getPrivacySettings
);
router.put(
  "/privacy-settings",
  auth,
  checkRole(["ADMIN"]),
  adminController.updatePrivacySettings
);

// Compliance Monitoring
router.get(
  "/compliance",
  auth,
  checkRole(["ADMIN"]),
  adminController.getComplianceData
);
router.get(
  "/security-logs",
  auth,
  checkRole(["ADMIN"]),
  adminController.getSecurityLogs
);

module.exports = router;
