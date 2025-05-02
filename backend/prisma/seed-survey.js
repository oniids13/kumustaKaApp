const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function likertOptions(reverseStartAt = 1) {
  if (reverseStartAt !== 1 && reverseStartAt !== 5) {
    throw new Error(
      "Invalid argument: reverseStartAt must be 1 (normal) or 5 (reverse scoring)"
    );
  }

  return [
    { label: "Strongly Disagree", value: reverseStartAt },
    {
      label: "Disagree",
      value: reverseStartAt + (reverseStartAt === 1 ? 1 : -1),
    },
    { label: "Neutral", value: 3 },
    { label: "Agree", value: reverseStartAt === 1 ? 4 : 2 },
    { label: "Strongly Agree", value: reverseStartAt === 1 ? 5 : 1 },
  ];
}

async function main() {
  const survey = await prisma.survey.create({
    data: {
      title: "Daily Mental Health Check-In",
      description: "A 12-item self-report for daily mental health monitoring.",
      type: "DAILY",
      questions: [
        {
          id: 1,
          question: "I felt calm and relaxed.",
          options: likertOptions(1),
        },
        {
          id: 2,
          question: "I had trouble focusing on my schoolwork.",
          options: likertOptions(5),
        },
        {
          id: 3,
          question: "I felt connected with my classmates or friends.",
          options: likertOptions(1),
        },
        {
          id: 4,
          question: "I felt anxious or nervous.",
          options: likertOptions(5),
        },
        {
          id: 5,
          question: "I enjoyed the things I did today.",
          options: likertOptions(1),
        },
        {
          id: 6,
          question: "I felt overwhelmed or stressed.",
          options: likertOptions(5),
        },
        {
          id: 7,
          question: "I had enough energy to do my tasks.",
          options: likertOptions(1),
        },
        {
          id: 8,
          question: "I felt hopeful about my future.",
          options: likertOptions(1),
        },
        {
          id: 9,
          question: "I had trouble sleeping or felt tired.",
          options: likertOptions(5),
        },
        {
          id: 10,
          question: "I felt proud of something I did today.",
          options: likertOptions(1),
        },
        {
          id: 11,
          question: "I felt sad or down.",
          options: likertOptions(5),
        },
        {
          id: 12,
          question: "I was able to manage my emotions today.",
          options: likertOptions(1),
        },
      ],
    },
  });

  console.log("✅ Survey seeded:", survey.title);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding survey:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
