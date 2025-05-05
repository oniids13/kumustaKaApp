// prisma/seedDailySurvey.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getLikertOptions } = require("../utils/surveyScoring");

const DAILY_SURVEY_QUESTIONS = [
  {
    id: 1,
    question: "I felt calm and relaxed.",
  },
  {
    id: 2,
    question: "I had trouble focusing on my schoolwork.", // Reverse scored
  },
  {
    id: 3,
    question: "I felt connected with my classmates or friends.",
  },
  {
    id: 4,
    question: "I felt anxious or nervous.", // Reverse scored
  },
  {
    id: 5,
    question: "I enjoyed the things I did today.",
  },
  {
    id: 6,
    question: "I felt overwhelmed or stressed.", // Reverse scored
  },
  {
    id: 7,
    question: "I had enough energy to do my tasks.",
  },
  {
    id: 8,
    question: "I felt hopeful about my future.",
  },
  {
    id: 9,
    question: "I had trouble sleeping or felt tired.", // Reverse scored
  },
  {
    id: 10,
    question: "I felt proud of something I did today.",
  },
  {
    id: 11,
    question: "I felt sad or down.", // Reverse scored
  },
  {
    id: 12,
    question: "I was able to manage my emotions today.",
  },
];

async function seedDailySurvey() {
  // Delete existing daily survey if exists
  await prisma.survey.deleteMany({
    where: { type: "DAILY" },
  });

  // Create survey with properly scored questions
  const survey = await prisma.survey.create({
    data: {
      title: "Daily Mental Health Check-In",
      description: "A 12-item self-report for daily mental health monitoring.",
      type: "DAILY",
      questions: DAILY_SURVEY_QUESTIONS.map((q) => ({
        ...q,
        options: getLikertOptions(q.id),
      })),
    },
  });

  console.log("✅ Daily survey seeded with proper scoring:", survey.title);
}

seedDailySurvey()
  .catch((e) => {
    console.error("Error seeding survey:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
