const { body, validationResult } = require("express-validator");
const { genPassword, validPassword } = require("../utils/passwordUtil");
const crypto = require("crypto");
const {
  getUserPasswordData,
  updateUserPassword,
  getUserInfoForPasswordReset,
  checkPasswordHistory,
  addPasswordToHistory,
} = require("../model/passwordQueries");

// Change Password Controller - For users to change their own password
const changePasswordController = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("New password must contain at least one uppercase letter, one lowercase letter, and one number"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: "Validation failed",
        errors: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // Assuming you have user info in req.user from auth middleware

    try {
      console.log(`🔄 Password change attempt for user: ${userId}`);
      
      // Get user's password data
      const user = await getUserPasswordData(userId);

      if (!user) {
        console.log(`❌ User not found: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isValid = validPassword(currentPassword, user.hash, user.salt);
      if (!isValid) {
        console.log(`❌ Invalid current password for user: ${userId}`);
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }

      console.log(`✅ Current password verified for user: ${userId}`);

      // Check if new password was used in the last 3 passwords
      console.log(`🔍 Checking password history for user: ${userId}`);
      const isPasswordReused = await checkPasswordHistory(userId, newPassword);
      console.log(`📊 Password reuse check result: ${isPasswordReused}`);
      
      if (isPasswordReused) {
        console.log(`🚫 Password reuse detected for user: ${userId}`);
        return res.status(400).json({ 
          message: "You cannot reuse any of your last 3 passwords. Please choose a different password." 
        });
      }

      console.log(`✅ Password is unique, proceeding with change for user: ${userId}`);

      // Generate new password hash
      const { salt, hash } = genPassword(newPassword);

      // Update password
      await updateUserPassword(userId, salt, hash);

      // Add new password to history
      await addPasswordToHistory(userId, salt, hash);

      console.log(`🎉 Password changed successfully for user: ${userId}`);
      return res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
];

// Generate Random Password
const generateRandomPassword = () => {
  // Generate a random password of length 10
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

// Admin Reset Password Controller - For admin to reset user passwords
const adminResetPasswordController = [
  body("userId").notEmpty().withMessage("User ID is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.body;

    // Check if request is from an admin
    if (req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "Only administrators can reset passwords" });
    }

    try {
      // Generate a new random password
      const newPassword = generateRandomPassword();
      const { salt, hash } = genPassword(newPassword);

      // Update the user's password
      await updateUserPassword(userId, salt, hash);

      // Fetch the updated user to get their email
      const user = await getUserInfoForPasswordReset(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // In a real application, you would send this password via email
      // For now, just return it in the response
      return res.status(200).json({
        message: "Password reset successfully",
        temporaryPassword: newPassword,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
];

module.exports = {
  changePasswordController,
  adminResetPasswordController,
};
