const { Router } = require("express");
const {
  changePasswordController,
  adminResetPasswordController,
} = require("../controller/passwordController");
const { authenticateToken } = require("../middleware/auth"); // Assuming you have this middleware

const passwordRouter = Router();

// Change password (requires authentication)
passwordRouter.post("/change", authenticateToken, changePasswordController);

// Admin reset password (requires admin authentication)
passwordRouter.post(
  "/admin-reset",
  authenticateToken,
  adminResetPasswordController
);

module.exports = passwordRouter;
