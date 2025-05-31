const { PrismaClient } = require("@prisma/client");
const { validPassword } = require("../utils/passwordUtil");
const prisma = new PrismaClient();

/**
 * Verify user's current password
 * @param {string} userId - The user's ID
 * @returns {Object} - User's hash and salt
 */
const getUserPasswordData = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hash: true, salt: true },
    });
    return user;
  } catch (error) {
    console.error("Error fetching user password data:", error);
    throw error;
  }
};

/**
 * Update user's password
 * @param {string} userId - The user's ID
 * @param {string} salt - New password salt
 * @param {string} hash - New password hash
 * @returns {boolean} - Success status
 */
const updateUserPassword = async (userId, salt, hash) => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { salt, hash },
    });
    return true;
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
};

/**
 * Get user information after password reset
 * @param {string} userId - The user's ID
 * @returns {Object} - User's email, first name and last name
 */
const getUserInfoForPasswordReset = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true },
    });
    return user;
  } catch (error) {
    console.error("Error fetching user info for password reset:", error);
    throw error;
  }
};

/**
 * Check if password was used in the last 3 passwords
 * @param {string} userId - The user's ID
 * @param {string} newPassword - The new password to check
 * @returns {boolean} - True if password was reused
 */
const checkPasswordHistory = async (userId, newPassword) => {
  try {
    // Get the last 3 password hashes and salts
    const passwordHistory = await prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { hash: true, salt: true },
    });

    // Check if new password matches any of the previous 3
    for (const prevPassword of passwordHistory) {
      if (validPassword(newPassword, prevPassword.hash, prevPassword.salt)) {
        return true; // Password was reused
      }
    }

    return false; // Password is not reused
  } catch (error) {
    console.error("Error checking password history:", error);
    throw error;
  }
};

/**
 * Add new password to history and maintain only last 3
 * @param {string} userId - The user's ID
 * @param {string} salt - Password salt
 * @param {string} hash - Password hash
 * @returns {boolean} - Success status
 */
const addPasswordToHistory = async (userId, salt, hash) => {
  try {
    // Add new password to history
    await prisma.passwordHistory.create({
      data: {
        userId,
        hash,
        salt,
      },
    });

    // Keep only the last 3 password history records
    const allHistory = await prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (allHistory.length > 3) {
      const toDelete = allHistory.slice(3);
      await prisma.passwordHistory.deleteMany({
        where: {
          id: { in: toDelete.map(p => p.id) }
        },
      });
    }

    return true;
  } catch (error) {
    console.error("Error adding password to history:", error);
    throw error;
  }
};

module.exports = {
  getUserPasswordData,
  updateUserPassword,
  getUserInfoForPasswordReset,
  checkPasswordHistory,
  addPasswordToHistory,
};
