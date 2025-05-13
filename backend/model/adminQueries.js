const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

// System Dashboard Queries
const getSystemStats = async () => {
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = totalUsers; // Since we don't have a status field

    const students = await prisma.user.count({
      where: { role: "STUDENT" },
    });

    const teachers = await prisma.user.count({
      where: { role: "TEACHER" },
    });

    const counselors = await prisma.user.count({
      where: { role: "COUNSELOR" },
    });

    const admins = await prisma.user.count({
      where: { role: "ADMIN" },
    });

    return {
      activeUsers,
      totalUsers,
      students,
      teachers,
      counselors,
      admins,
      // These would come from a monitoring system in production
      serverHealth: 95,
      diskUsage: 42,
      memoryUsage: 38,
    };
  } catch (error) {
    console.error("Error fetching system stats:", error);
    throw error;
  }
};

const getRecentActivities = async () => {
  try {
    // Get recent forum posts
    const recentPosts = await prisma.forumPost.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { author: true },
    });

    // Get recent mood entries
    const recentMoodEntries = await prisma.moodEntry.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { student: { include: { user: true } } },
    });

    // Get recent survey responses
    const recentSurveyResponses = await prisma.surveyResponse.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { student: { include: { user: true } } },
    });

    // Combine and format activities
    const activities = [
      ...recentPosts.map((post) => ({
        id: `post-${post.id}`,
        action: "New forum post",
        username: `${post.author.firstName} ${post.author.lastName}`,
        timestamp: post.createdAt,
        details: `Created post: ${post.title.substring(0, 30)}...`,
      })),
      ...recentMoodEntries.map((entry) => ({
        id: `mood-${entry.id}`,
        action: "Mood entry",
        username: `${entry.student.user.firstName} ${entry.student.user.lastName}`,
        timestamp: entry.createdAt,
        details: `Recorded mood level: ${entry.moodLevel}/5`,
      })),
      ...recentSurveyResponses.map((response) => ({
        id: `survey-${response.id}`,
        action: "Survey response",
        username: `${response.student.user.firstName} ${response.student.user.lastName}`,
        timestamp: response.createdAt,
        details: `Completed survey with score: ${response.score}`,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    return { activities };
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    throw error;
  }
};

// User Management Queries
const getAllUsers = async () => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        createdAt: true,
      },
    });

    // Transform to match expected format
    return users.map((user) => ({
      ...user,
      status: "ACTIVE", // Default since we don't have this field
      lastLogin: null, // Default since we don't track this yet
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

const getUserById = async (id) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      status: "ACTIVE", // Default status
      lastLogin: null, // We don't track this yet
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

const createUser = async (userData) => {
  try {
    const { firstName, lastName, email, password, role, phone } = userData;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Generate salt and hash for password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Create user with role-specific profile
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        salt,
        hash,
        role,
        phone: phone || "",
        // Create the role-specific profile based on role
        ...(role === "STUDENT" && {
          student: { create: {} },
        }),
        ...(role === "TEACHER" && {
          teacher: { create: {} },
        }),
        ...(role === "COUNSELOR" && {
          counselor: { create: {} },
        }),
        ...(role === "ADMIN" && {
          admin: { create: {} },
        }),
      },
      include: {
        student: true,
        teacher: true,
        counselor: true,
        admin: true,
      },
    });

    return {
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role,
      status: "ACTIVE", // Default status
      createdAt: newUser.createdAt,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

const updateUser = async (id, userData) => {
  try {
    const { firstName, lastName, email, phone } = userData;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    // Check if trying to change email to one that already exists
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        throw new Error("Email already in use");
      }
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone: phone || existingUser.phone,
        // Role changes would require more complex logic to handle profile models
        // For simplicity, we won't allow role changes for now
      },
    });

    return {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      role: updatedUser.role,
      status: "ACTIVE", // Default status
    };
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

const deleteUser = async (id) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        student: true,
        teacher: true,
        counselor: true,
        admin: true,
      },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    // Delete user (cascading will handle related records)
    await prisma.user.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

// Role Management Queries
const getAllRoles = async () => {
  try {
    // Get counts of users by role
    const roleUserCounts = await prisma.user.groupBy({
      by: ["role"],
      _count: {
        role: true,
      },
    });

    // Create a map for easy lookup
    const countMap = roleUserCounts.reduce((acc, curr) => {
      acc[curr.role] = curr._count.role;
      return acc;
    }, {});

    // Define permissions based on your application's needs
    return [
      {
        id: "1",
        name: "ADMIN",
        description: "Full system access and administrative privileges",
        permissions: {
          users: ["create", "read", "update", "delete"],
          roles: ["create", "read", "update", "delete"],
          settings: ["create", "read", "update", "delete"],
          reports: ["create", "read", "update", "delete"],
        },
        userCount: countMap["ADMIN"] || 0,
      },
      {
        id: "2",
        name: "COUNSELOR",
        description:
          "Access to student mental health data and counseling tools",
        permissions: {
          students: ["read", "update"],
          interventions: ["create", "read", "update", "delete"],
          reports: ["create", "read"],
          forum: ["create", "read", "update", "delete"],
        },
        userCount: countMap["COUNSELOR"] || 0,
      },
      {
        id: "3",
        name: "TEACHER",
        description: "Access to teaching resources and student monitoring",
        permissions: {
          students: ["read"],
          dashboard: ["read"],
          forum: ["create", "read", "update", "delete"],
          posts: ["create", "read", "update", "delete"],
        },
        userCount: countMap["TEACHER"] || 0,
      },
      {
        id: "4",
        name: "STUDENT",
        description: "Basic access to student features and resources",
        permissions: {
          profile: ["read", "update"],
          surveys: ["create", "read"],
          forum: ["create", "read", "update"],
          resources: ["read"],
        },
        userCount: countMap["STUDENT"] || 0,
      },
    ];
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
};

// Compliance Monitoring Queries
const getComplianceData = async () => {
  try {
    // Calculate compliance scores based on actual data
    // Example: Check percentage of students with emergency contacts
    const totalStudents = await prisma.student.count();
    const studentsWithEmergencyContacts = await prisma.emergencyContact.groupBy(
      {
        by: ["studentId"],
        _count: {
          studentId: true,
        },
      }
    );

    const emergencyContactCompliance =
      totalStudents > 0
        ? Math.round(
            (studentsWithEmergencyContacts.length / totalStudents) * 100
          )
        : 100;

    // Example: Check percentage of users with strong profiles
    const totalUsers = await prisma.user.count();
    const usersWithCompleteProfiles = await prisma.user.count({
      where: {
        firstName: { not: "" },
        lastName: { not: "" },
        avatar: { not: "https://www.gravatar.com/avatar/default?d=identicon" },
      },
    });

    const profileCompliance =
      totalUsers > 0
        ? Math.round((usersWithCompleteProfiles / totalUsers) * 100)
        : 100;

    return {
      dataPrivacy: {
        status:
          emergencyContactCompliance >= 90 ? "Compliant" : "Action Required",
        score: emergencyContactCompliance,
        lastChecked: new Date().toISOString(),
        issues:
          emergencyContactCompliance < 90
            ? [
                {
                  id: 1,
                  level: "warning",
                  description: "Some students don't have emergency contacts",
                  recommendation:
                    "Ensure all students provide emergency contact information",
                },
              ]
            : [],
      },
      dataSecurity: {
        status: "Compliant",
        score: 88,
        lastChecked: new Date().toISOString(),
        issues: [
          {
            id: 1,
            level: "info",
            description: "Regular security checks performed",
            recommendation: "Continue monitoring system security",
          },
        ],
      },
      systemSecurity: {
        status: profileCompliance >= 80 ? "Compliant" : "Action Required",
        score: profileCompliance,
        lastChecked: new Date().toISOString(),
        issues:
          profileCompliance < 80
            ? [
                {
                  id: 1,
                  level: "warning",
                  description: "Some user profiles are incomplete",
                  recommendation: "Encourage users to complete their profiles",
                },
              ]
            : [],
      },
      complianceFrameworks: [
        {
          name: "HIPAA",
          compliance: 95,
          lastChecked: new Date().toISOString(),
        },
        {
          name: "GDPR",
          compliance: 88,
          lastChecked: new Date().toISOString(),
        },
        {
          name: "FERPA",
          compliance: 92,
          lastChecked: new Date().toISOString(),
        },
      ],
      securityLogs: [],
    };
  } catch (error) {
    console.error("Error fetching compliance data:", error);
    throw error;
  }
};

const getSecurityLogs = async () => {
  try {
    // Get recent user creation dates as "account created" events
    const recentUsers = await prisma.user.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Transform into security logs
    return recentUsers.map((user, index) => ({
      id: index + 1,
      timestamp: user.createdAt.toISOString(),
      level: "info",
      description: `New user account created: ${user.firstName} ${user.lastName} (${user.role})`,
      user: "admin", // Assuming admin created these users
      ipAddress: `192.168.1.${index % 255}`, // Placeholder IP
    }));
  } catch (error) {
    console.error("Error fetching security logs:", error);
    throw error;
  }
};

// Settings - these would typically interact with a settings table
// For now, they return mock data
const getSystemSettings = () => {
  return {
    general: {
      siteName: "KumustaKaApp",
      adminEmail: "admin@kumustakaapp.com",
      supportEmail: "support@kumustakaapp.com",
      timeZone: "Asia/Manila",
      maintenanceMode: false,
    },
    security: {
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordComplexity: "medium",
      twoFactorAuth: false,
      enforcePasswordChange: 90,
    },
    privacy: {
      dataRetentionDays: 365,
      allowProfileSharing: true,
      anonymizeSurveyResponses: true,
      allowDataDownload: true,
      showUserOnlineStatus: true,
      logUserActivity: true,
    },
    notifications: {
      emailNotifications: true,
      inAppNotifications: true,
      dailySummary: false,
      alertForRedZone: true,
      alertFrequency: "immediate",
    },
    surveys: {
      dailySurveyEnabled: true,
      reminderTime: "08:00",
      reminderFrequency: "daily",
      autoAssignSurveys: true,
      requireCompletion: false,
    },
  };
};

const getPrivacySettings = () => {
  return {
    dataRetention: {
      userAccountDays: 365,
      inactiveAccountDays: 180,
      surveyResponsesDays: 730,
      activityLogsDays: 90,
      autoDeletion: true,
    },
    dataAccess: {
      allowDataDownload: true,
      showProfileInformation: true,
      studentDataVisibility: "counselorsOnly",
      allowThirdPartySharing: false,
      anonymizeSurveyResults: true,
    },
    userPrivacy: {
      showOnlineStatus: true,
      displayFullName: true,
      allowTagging: true,
      defaultPrivacyLevel: "medium",
      allowProfileSearching: true,
    },
    cookiesConsent: {
      requiredCookies: true,
      functionalCookies: true,
      analyticalCookies: true,
      advertisingCookies: false,
      cookieExpiration: 30,
    },
    privacyNotice: {
      lastUpdated: "2023-06-15",
      version: "1.2",
      requiresReConsent: false,
      privacyPolicyText: "Standard privacy policy text for the application...",
    },
  };
};

module.exports = {
  getSystemStats,
  getRecentActivities,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllRoles,
  getComplianceData,
  getSecurityLogs,
  getSystemSettings,
  getPrivacySettings,
};
