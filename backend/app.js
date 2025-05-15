process.env.TZ = "Asia/Manila";

const express = require("express");
const passport = require("passport");
const cors = require("cors");
const jwtStrategy = require("./config/jwtStrategy");
const { createUploadsDir } = require("./utils/fileUtils");
const { ensureDailySurveyExists } = require("./services/surveyInitService");
const {
  sundayNightUpdate,
  mondayMorningReset,
} = require("./model/goalTracker");
const cron = require("node-cron");
const dotenv = require("dotenv");
const morgan = require("morgan");
const path = require("path");
const { rateLimit } = require("express-rate-limit");

// Load Environment variables
dotenv.config();

const app = express();

// Set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));

// Configure more permissive rate limiting for development
const isProduction = process.env.NODE_ENV === "production";

// Default limiter for all routes
const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 500 : 1000, // Increased limits, more permissive in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later",
  skipSuccessfulRequests: true, // Only count failed requests against the limit
});

// More permissive limiter for read-heavy routes
const readLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: isProduction ? 300 : 2000, // Much higher limit for reading data
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many read requests, please try again shortly",
  skipSuccessfulRequests: true,
});

// Routers
const userRouter = require("./router/userRouter");
const loginRouter = require("./router/loginRouter");
const forumPostRouter = require("./router/forumPostRouter");
const journalRouter = require("./router/journalRouter");
const emergencyContactRouter = require("./router/emergencyContactRouter");
const moodEntryRouter = require("./router/moodEntryRouter");
const resourcesRouter = require("./router/resourcesRouter");
const quotesRouter = require("./router/quotesRouter");
const quizzesRouter = require("./router/quizzesRouter");
const initialAssessmentRouter = require("./router/initialAssessmentRouter");
const surveyRouter = require("./router/surveyRouter");
const goalTrackerRouter = require("./router/goalTrackerRouter");
const counselorRouter = require("./router/counselorRouter");
const adminRouter = require("./router/adminRouter");
const teacherRouter = require("./router/teacherRouter");
const communicationRouter = require("./router/communicationRouter");

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

async function initializeApp() {
  try {
    await ensureDailySurveyExists();
    console.log("Daily survey ready");
  } catch (error) {
    console.error("Failed to initialize daily survey:", error);
  }
}

createUploadsDir();

app.use(passport.initialize());
passport.use(jwtStrategy);

// Apply different rate limits to different routes
// Login routes - strict limits to prevent brute force
app.use("/api/login", defaultLimiter);

// Read-heavy routes - more permissive limits
app.use("/api/quotes", readLimiter);
app.use("/api/forum", readLimiter);
app.use("/api/survey/status", readLimiter);
app.use("/api/moodEntry/checkToday", readLimiter);
app.use("/api/initialAssessment/getInitialAssessment", readLimiter);
app.use("/api/communication/conversations", readLimiter);

// Apply default limiter to all other routes
app.use(defaultLimiter);

// Routes
app.use("/api/user", userRouter);
app.use("/api", loginRouter);
app.use("/api/forum", forumPostRouter);
app.use("/api/journal", journalRouter);
app.use("/api/emergencycontact", emergencyContactRouter);
app.use("/api/moodEntry", moodEntryRouter);
app.use("/api/resources", resourcesRouter);
app.use("/api", quotesRouter);
app.use("/api/quizzes", quizzesRouter);
app.use("/api/initialAssessment", initialAssessmentRouter);
app.use("/api/survey", surveyRouter);
app.use("/api/goals", goalTrackerRouter);
app.use("/api/counselor", counselorRouter);
app.use("/api/admin", adminRouter);
app.use("/api/teacher", teacherRouter);
app.use("/api/communication", communicationRouter);

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

initializeApp();

// Every Sunday at 11:30 PM
cron.schedule("30 23 * * 0", async () => {
  try {
    console.log("Running weekly goal summary update....");
    await sundayNightUpdate();
    console.log("Weekly goal summary update completed successfully");
  } catch (error) {
    console.error("Failed to run weekly goal summary update:", error);
  }
});

// Every Monday at 12:05 AM
cron.schedule("5 0 * * 1", async () => {
  try {
    console.log("Running weekly goal reset....");
    await mondayMorningReset();
    console.log("Weekly goal reset completed successfully");
  } catch (error) {
    console.error("Failed to run weekly goal reset:", error);
  }
});

// Add debugging middleware to log all requests
app.use((req, res, next) => {
  const startTime = new Date();
  console.log(
    `[${startTime.toISOString()}] ${req.method} ${req.originalUrl} - Started`
  );

  // Capture response finish event
  res.on("finish", () => {
    const endTime = new Date();
    const duration = endTime - startTime;
    console.log(
      `[${endTime.toISOString()}] ${req.method} ${
        req.originalUrl
      } - Finished in ${duration}ms with status ${res.statusCode}`
    );
  });

  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
