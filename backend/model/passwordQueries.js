const { PrismaClient } = require("@prisma/client");
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

module.exports = {
  getUserPasswordData,
  updateUserPassword,
  getUserInfoForPasswordReset,
};
