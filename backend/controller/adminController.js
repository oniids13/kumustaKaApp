const adminQueries = require("../model/adminQueries");

// System Dashboard
exports.getSystemStats = async (req, res) => {
  try {
    const stats = await adminQueries.getSystemStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching system stats:", error);
    res.status(500).json({ message: "Failed to fetch system statistics" });
  }
};

exports.getRecentActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const activities = await adminQueries.getRecentActivities(page, limit);
    res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    res.status(500).json({ message: "Failed to fetch recent activities" });
  }
};

// User Management
exports.getAllUsers = async (req, res) => {
  try {
    const users = await adminQueries.getAllUsers();
    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const userData = req.body;
    const newUser = await adminQueries.createUser(userData);

    res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);

    if (error.message === "User with this email already exists") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to create user" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await adminQueries.getUserById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userProfile = await adminQueries.getUserProfile(id);

    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    res.status(200).json({ userProfile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Failed to fetch user profile" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;

    const updatedUser = await adminQueries.updateUser(id, userData);

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);

    if (error.message === "User not found") {
      return res.status(404).json({ message: error.message });
    }

    if (error.message === "Email already in use") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to update user" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await adminQueries.deleteUser(id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);

    if (error.message === "User not found") {
      return res.status(404).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to delete user" });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status value
    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updatedUser = await adminQueries.updateUserStatus(id, status);

    res.status(200).json({
      message: "User status updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user status:", error);

    if (error.message === "User not found") {
      return res.status(404).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to update user status" });
  }
};

// Role Management
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await adminQueries.getAllRoles();
    res.status(200).json({ roles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "Failed to fetch roles" });
  }
};

// The roles are defined in the system and not in the database
// so these operations would require code changes or a separate role table
exports.createRole = async (req, res) => {
  // In a real implementation, you might create a new role in a roles table
  res.status(501).json({ message: "Custom role creation not supported" });
};

exports.getRoleById = async (req, res) => {
  // In a real implementation, you would fetch from a roles table
  res.status(501).json({ message: "Individual role fetch not supported" });
};

exports.updateRole = async (req, res) => {
  // In a real implementation, you would update the roles table
  res.status(501).json({ message: "Role updates not supported" });
};

exports.deleteRole = async (req, res) => {
  // In a real implementation, you would delete from the roles table
  res.status(501).json({ message: "Role deletion not supported" });
};

// System Configuration
exports.getSystemSettings = async (req, res) => {
  try {
    const settings = adminQueries.getSystemSettings();
    res.status(200).json({ settings });
  } catch (error) {
    console.error("Error fetching system settings:", error);
    res.status(500).json({ message: "Failed to fetch system settings" });
  }
};

exports.updateSystemSettings = async (req, res) => {
  // In a real implementation, you would update the settings table
  res.status(200).json({
    message: "System settings update acknowledged",
    settings: req.body,
  });
};

// Privacy Settings
exports.getPrivacySettings = async (req, res) => {
  try {
    const privacySettings = adminQueries.getPrivacySettings();
    res.status(200).json({ privacySettings });
  } catch (error) {
    console.error("Error fetching privacy settings:", error);
    res.status(500).json({ message: "Failed to fetch privacy settings" });
  }
};

exports.updatePrivacySettings = async (req, res) => {
  // In a real implementation, you would update the privacy settings table
  res.status(200).json({
    message: "Privacy settings update acknowledged",
    privacySettings: req.body,
  });
};

// Compliance Monitoring
exports.getComplianceData = async (req, res) => {
  try {
    const complianceData = await adminQueries.getComplianceData();
    res.status(200).json(complianceData);
  } catch (error) {
    console.error("Error fetching compliance data:", error);
    res.status(500).json({ message: "Failed to fetch compliance data" });
  }
};

exports.getSecurityLogs = async (req, res) => {
  try {
    const logs = await adminQueries.getSecurityLogs();
    res.status(200).json({ logs });
  } catch (error) {
    console.error("Error fetching security logs:", error);
    res.status(500).json({ message: "Failed to fetch security logs" });
  }
};
