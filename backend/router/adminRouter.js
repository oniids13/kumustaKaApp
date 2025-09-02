const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const { authenticateToken } = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

// System Dashboard
router.get(
  "/system-stats",
  authenticateToken,
  checkRole(["ADMIN"]),
  adminController.getSystemStats
);
router.get(
  "/recent-activities",
  authenticateToken,
  checkRole(["ADMIN"]),
  adminController.getRecentActivities
);

// User Management
router.get(
  "/users",
  authenticateToken,
  checkRole(["ADMIN"]),
  adminController.getAllUsers
);
router.post(
  "/users",
  authenticateToken,
  checkRole(["ADMIN"]),
  adminController.createUser
);
router.get(
  "/users/:id",
  authenticateToken,
  checkRole(["ADMIN"]),
  adminController.getUserById
);
router.get(
  "/users/:id/profile",
  authenticateToken,
  checkRole(["ADMIN"]),
  adminController.getUserProfile
);
router.put(
  "/users/:id",
  authenticateToken,
  checkRole(["ADMIN"]),
  adminController.updateUser
);
router.delete(
  "/users/:id",
  authenticateToken,
  checkRole(["ADMIN"]),
  adminController.deleteUser
);
router.patch(
  "/users/:id/status",
  authenticateToken,
  checkRole(["ADMIN"]),
  adminController.updateUserStatus
);

// Role Management
router.get(
  "/roles",
  authenticateToken,
  checkRole(["ADMIN"]),
  adminController.getAllRoles
);
router.post(
  "/roles",
  authenticateToken,
  checkRole(["ADMIN"]),
  adminController.createRole
);
router.get(
  "/roles/:id",
  authenticateToken,
  checkRole(["ADMIN"]),
  adminController.getRoleById
);
router.put(
  "/roles/:id",
  authenticateToken,
  checkRole(["ADMIN"]),
  adminController.updateRole
);
router.delete(
  "/roles/:id",
  authenticateToken,
  checkRole(["ADMIN"]),
  adminController.deleteRole
);

// System Configuration
router.get(
  "/settings",
  authenticateToken,
  checkRole(["ADMIN"]),
  adminController.getSystemSettings
);
router.put(
  "/settings",
  authenticateToken,
  checkRole(["ADMIN"]),
  adminController.updateSystemSettings
);

// Privacy Settings
router.get(
  "/privacy-settings",
  authenticateToken,
  checkRole(["ADMIN"]),
  adminController.getPrivacySettings
);
router.put(
  "/privacy-settings",
  authenticateToken,
  checkRole(["ADMIN"]),
  adminController.updatePrivacySettings
);

// Compliance Monitoring
router.get(
  "/compliance",
  authenticateToken,
  checkRole(["ADMIN"]),
  adminController.getComplianceData
);
router.get(
  "/security-logs",
  authenticateToken,
  checkRole(["ADMIN"]),
  adminController.getSecurityLogs
);

module.exports = router;
