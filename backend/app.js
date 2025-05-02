process.env.TZ = "Asia/Manila";

const express = require("express");
const passport = require("passport");
const cors = require("cors");
const jwtStrategy = require("./config/jwtStrategy");
const { createUploadsDir } = require("./utils/fileUtils");

const app = express();

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

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

createUploadsDir();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
