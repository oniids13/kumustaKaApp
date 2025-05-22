/**
 * Health check router for checking API status
 */

const { Router } = require("express");
const healthRouter = Router();

/**
 * @route GET /api/health
 * @description Health check endpoint
 * @access Public
 */
healthRouter.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

module.exports = healthRouter;
