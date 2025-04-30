const { PrismaClient } = require("@prisma/client");
const quizzes = require("../resources/quizzes");
const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding quizzes...");

  for (const quiz of quizzes) {
    await prisma.quiz.create({
      data: {
        question: quiz.question,
        options: quiz.options,
        correctAnswer: quiz.correctAnswer,
        points: quiz.points,
        explanation: quiz.explanation,
      },
    });
  }

  console.log(`Seeded ${quizzes.length} quizzes successfully!`);
}

seed()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
