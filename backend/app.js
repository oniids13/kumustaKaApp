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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

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
