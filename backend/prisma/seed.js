const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { genPassword } = require("../utils/passwordUtil");
const { getGravatar } = require("../utils/avatar");
const { faker } = require("@faker-js/faker");
const crypto = require("crypto");

// Use a fixed seed for consistent data generation
faker.seed(123);

// Default password for all seeded users
const DEFAULT_PASSWORD = "Password123!";

// Sample forum post content
const forumPostTopics = [
  {
    title: "Dealing with exam anxiety",
    content:
      "I've been struggling with anxiety before exams. Any tips on how to manage it?",
  },
  {
    title: "Finding motivation to study",
    content:
      "I'm having a hard time staying motivated with my studies. What works for you?",
  },
  {
    title: "Balancing school and social life",
    content:
      "How do you manage to maintain a healthy social life while keeping up with school demands?",
  },
  {
    title: "Sleep issues during finals week",
    content: "I can't seem to get proper sleep during finals. Any advice?",
  },
  {
    title: "Making friends in a new school",
    content:
      "I just transferred here and finding it hard to connect. How did you make new friends?",
  },
  {
    title: "Coping with academic pressure",
    content:
      "The pressure to perform well is overwhelming. How do you cope with it?",
  },
  {
    title: "Healthy eating on a student budget",
    content:
      "What are some affordable yet healthy meals you prepare as a student?",
  },
  {
    title: "Feeling homesick",
    content:
      "Being away from family for studies is making me feel down. Any suggestions?",
  },
  {
    title: "Dealing with difficult teachers",
    content:
      "How do you handle situations with teachers who seem unfair or difficult?",
  },
  {
    title: "Finding internship opportunities",
    content: "Where do you look for internships related to our field?",
  },
];

// Sample journal entries
const journalPrompts = [
  "Today I felt...",
  "I'm grateful for...",
  "My biggest challenge right now is...",
  "Something I'm looking forward to is...",
  "I'm proud of myself for...",
  "A goal I want to work on is...",
  "Something I learned today was...",
  "I wish I could tell someone...",
  "I'm feeling anxious about...",
  "Something that made me smile today...",
];

// Sample goal titles
const goalTitles = [
  "Complete reading assignment",
  "Study for math exam",
  "Finish science project",
  "Practice for music recital",
  "Exercise for 30 minutes",
  "Write essay draft",
  "Research for history presentation",
  "Complete online quizzes",
  "Review notes",
  "Attend study group",
  "Take practice tests",
  "Organize study materials",
];

// Sample comments
const commentTemplates = [
  "I completely agree with you!",
  "Thanks for sharing this, it's really helpful.",
  "I've been through something similar and what helped me was...",
  "Have you tried approaching it from a different angle?",
  "I would suggest talking to a counselor about this.",
  "This is such an important topic to discuss.",
  "I struggled with this too, you're not alone.",
  "Great point! I never thought about it that way.",
  "This is something many students face.",
  "Let's organize a study group to tackle this together!",
];

/**
 * Generate a random date within the past month
 */
function getRandomRecentDate() {
  const today = new Date();
  const pastMonth = new Date(today);
  pastMonth.setMonth(today.getMonth() - 1);

  return new Date(
    pastMonth.getTime() +
      Math.random() * (today.getTime() - pastMonth.getTime())
  );
}

/**
 * Generate a string date in PH format
 */
function getPhDate(date = new Date()) {
  return date
    .toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, "-");
}

/**
 * Generate an array of dates for the past 30 days
 */
function generatePastMonthDates() {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    // Create a new date for each day with standardized time (midnight)
    const date = new Date();
    date.setDate(today.getDate() - i);
    // Set hours, minutes, seconds, and milliseconds to 0 (start of day)
    date.setHours(0, 0, 0, 0);
    dates.push(date);
  }

  return dates;
}

/**
 * Generate random survey responses
 */
function generateSurveyResponses(surveyId) {
  // Generate random answers based on 12 questions and values from 1-5
  const answers = [];

  for (let i = 1; i <= 12; i++) {
    answers.push({
      questionId: i,
      value: Math.floor(Math.random() * 5) + 1,
    });
  }

  // Calculate random score between 36-60 (higher is better)
  const score = Math.floor(Math.random() * 25) + 36;

  // Calculate percentage (score / 60)
  const percentage = parseFloat((score / 60).toFixed(2));

  // Determine zone based on percentage
  let zone;
  if (percentage >= 0.8) {
    zone = "Green";
  } else if (percentage >= 0.6) {
    zone = "Yellow";
  } else {
    zone = "Red";
  }

  return { answers, score, percentage, zone };
}

/**
 * Generate random assessment data
 */
function generateInitialAssessment() {
  // Generate random answers for the DASS-21 assessment
  const answers = [];
  // 7 Depression questions (D1-D7)
  let depressionScore = 0;
  for (let i = 1; i <= 7; i++) {
    const value = Math.floor(Math.random() * 4); // 0-3 range
    depressionScore += value;
    answers.push({ id: `D${i}`, value });
  }

  // 7 Anxiety questions (A1-A7)
  let anxietyScore = 0;
  for (let i = 1; i <= 7; i++) {
    const value = Math.floor(Math.random() * 4); // 0-3 range
    anxietyScore += value;
    answers.push({ id: `A${i}`, value });
  }

  // 7 Stress questions (S1-S7)
  let stressScore = 0;
  for (let i = 1; i <= 7; i++) {
    const value = Math.floor(Math.random() * 4); // 0-3 range
    stressScore += value;
    answers.push({ id: `S${i}`, value });
  }

  // Multiply scores by 2 for DASS-21 scoring convention
  depressionScore *= 2;
  anxietyScore *= 2;
  stressScore *= 2;

  const totalScore = depressionScore + anxietyScore + stressScore;

  return {
    assessmentData: {
      title: "DASS-21",
      dateCompleted: new Date(),
    },
    answers,
    depressionScore,
    anxietyScore,
    stressScore,
    totalScore,
  };
}

/**
 * Main seeding function
 */
async function main() {
  console.log("🌱 Starting database seeding...");

  // Clean database (if needed for testing)
  // Uncomment these lines for a clean reset

  console.log("🧹 Cleaning database...");

  // Delete in proper order to respect foreign key constraints
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.report.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.forumPost.deleteMany();
  await prisma.intervention.deleteMany();
  await prisma.journal.deleteMany();
  await prisma.moodEntry.deleteMany();
  await prisma.weeklyGoalSummary.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.emergencyContact.deleteMany();
  await prisma.surveyResponse.deleteMany();
  await prisma.initialAssessment.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.counselor.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.survey.deleteMany();
  await prisma.section.deleteMany();

  // Create the daily survey
  console.log("📋 Creating survey...");
  const survey = await prisma.survey.upsert({
    where: { id: "daily-survey" },
    create: {
      id: "daily-survey",
      title: "Daily Mental Health Check-In",
      description: "A 12-item self-report for daily mental health monitoring.",
      type: "DAILY",
      questions: [
        {
          id: 1,
          question: "I felt calm and relaxed.",
          options: [
            { label: "Strongly Disagree", value: 1 },
            { label: "Disagree", value: 2 },
            { label: "Neutral", value: 3 },
            { label: "Agree", value: 4 },
            { label: "Strongly Agree", value: 5 },
          ],
        },
        {
          id: 2,
          question: "I had trouble focusing on my schoolwork.",
          options: [
            { label: "Strongly Disagree", value: 5 },
            { label: "Disagree", value: 4 },
            { label: "Neutral", value: 3 },
            { label: "Agree", value: 2 },
            { label: "Strongly Agree", value: 1 },
          ],
        },
        {
          id: 3,
          question: "I felt connected with my classmates or friends.",
          options: [
            { label: "Strongly Disagree", value: 1 },
            { label: "Disagree", value: 2 },
            { label: "Neutral", value: 3 },
            { label: "Agree", value: 4 },
            { label: "Strongly Agree", value: 5 },
          ],
        },
        {
          id: 4,
          question: "I felt anxious or nervous.",
          options: [
            { label: "Strongly Disagree", value: 5 },
            { label: "Disagree", value: 4 },
            { label: "Neutral", value: 3 },
            { label: "Agree", value: 2 },
            { label: "Strongly Agree", value: 1 },
          ],
        },
        {
          id: 5,
          question: "I enjoyed the things I did today.",
          options: [
            { label: "Strongly Disagree", value: 1 },
            { label: "Disagree", value: 2 },
            { label: "Neutral", value: 3 },
            { label: "Agree", value: 4 },
            { label: "Strongly Agree", value: 5 },
          ],
        },
        {
          id: 6,
          question: "I felt overwhelmed or stressed.",
          options: [
            { label: "Strongly Disagree", value: 5 },
            { label: "Disagree", value: 4 },
            { label: "Neutral", value: 3 },
            { label: "Agree", value: 2 },
            { label: "Strongly Agree", value: 1 },
          ],
        },
        {
          id: 7,
          question: "I had enough energy to do my tasks.",
          options: [
            { label: "Strongly Disagree", value: 1 },
            { label: "Disagree", value: 2 },
            { label: "Neutral", value: 3 },
            { label: "Agree", value: 4 },
            { label: "Strongly Agree", value: 5 },
          ],
        },
        {
          id: 8,
          question: "I felt hopeful about my future.",
          options: [
            { label: "Strongly Disagree", value: 1 },
            { label: "Disagree", value: 2 },
            { label: "Neutral", value: 3 },
            { label: "Agree", value: 4 },
            { label: "Strongly Agree", value: 5 },
          ],
        },
        {
          id: 9,
          question: "I had trouble sleeping or felt tired.",
          options: [
            { label: "Strongly Disagree", value: 5 },
            { label: "Disagree", value: 4 },
            { label: "Neutral", value: 3 },
            { label: "Agree", value: 2 },
            { label: "Strongly Agree", value: 1 },
          ],
        },
        {
          id: 10,
          question: "I felt proud of something I did today.",
          options: [
            { label: "Strongly Disagree", value: 1 },
            { label: "Disagree", value: 2 },
            { label: "Neutral", value: 3 },
            { label: "Agree", value: 4 },
            { label: "Strongly Agree", value: 5 },
          ],
        },
        {
          id: 11,
          question: "I felt sad or down.",
          options: [
            { label: "Strongly Disagree", value: 5 },
            { label: "Disagree", value: 4 },
            { label: "Neutral", value: 3 },
            { label: "Agree", value: 2 },
            { label: "Strongly Agree", value: 1 },
          ],
        },
        {
          id: 12,
          question: "I was able to manage my emotions today.",
          options: [
            { label: "Strongly Disagree", value: 1 },
            { label: "Disagree", value: 2 },
            { label: "Neutral", value: 3 },
            { label: "Agree", value: 4 },
            { label: "Strongly Agree", value: 5 },
          ],
        },
      ],
    },
    update: {},
  });

  // Create 4 sections
  console.log("🏫 Creating sections...");
  const sectionsData = [
    {
      name: "Grade 10 - Section A",
      code: "G10SEC",
      description: "Grade 10 Section A - Science and Technology",
      gradeLevel: "Grade 10",
    },
    {
      name: "Grade 10 - Section B",
      code: "G10SEB",
      description: "Grade 10 Section B - Arts and Design",
      gradeLevel: "Grade 10",
    },
    {
      name: "Grade 11 - Section A",
      code: "G11SEC",
      description: "Grade 11 Section A - STEM",
      gradeLevel: "Grade 11",
    },
    {
      name: "Grade 11 - Section B",
      code: "G11SEB",
      description: "Grade 11 Section B - ABM",
      gradeLevel: "Grade 11",
    },
  ];

  const sections = [];
  for (const sectionData of sectionsData) {
    const section = await prisma.section.create({
      data: sectionData,
    });
    sections.push(section);
    console.log(`🏫 Created section: ${section.name} (Code: ${section.code})`);
  }

  // Create a sample admin user
  console.log("👨‍💼 Creating admin user...");
  const adminPass = genPassword(DEFAULT_PASSWORD);
  const admin = await prisma.user.upsert({
    where: { email: "admin@kumustaka.com" },
    create: {
      email: "admin@kumustaka.com",
      salt: adminPass.salt,
      hash: adminPass.hash,
      role: "ADMIN",
      firstName: "Admin",
      lastName: "User",
      phone: "09123456789",
      gender: "MALE",
      avatar: getGravatar("admin@kumustaka.com"),
      admin: {
        create: {},
      },
    },
    update: {},
    include: {
      admin: true,
    },
  });
  console.log(`👨‍💼 Created admin: ${admin.firstName} ${admin.lastName}`);

  // Create a sample counselor
  console.log("👨‍⚕️ Creating counselor user...");
  const counselorPass = genPassword(DEFAULT_PASSWORD);
  const counselor = await prisma.user.upsert({
    where: { email: "counselor@kumustaka.com" },
    create: {
      email: "counselor@kumustaka.com",
      salt: counselorPass.salt,
      hash: counselorPass.hash,
      role: "COUNSELOR",
      firstName: "Grace",
      lastName: "Santos",
      phone: "09987654321",
      gender: "FEMALE",
      avatar: getGravatar("counselor@kumustaka.com"),
      counselor: {
        create: {},
      },
    },
    update: {},
    include: {
      counselor: true,
    },
  });
  console.log(
    `👨‍⚕️ Created counselor: ${counselor.firstName} ${counselor.lastName}`
  );

  // Create a sample teacher and assign to first section
  console.log("👨‍🏫 Creating teacher user...");
  const teacherPass = genPassword(DEFAULT_PASSWORD);
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@kumustaka.com" },
    create: {
      email: "teacher@kumustaka.com",
      salt: teacherPass.salt,
      hash: teacherPass.hash,
      role: "TEACHER",
      firstName: "Miguel",
      lastName: "Reyes",
      phone: "09567891234",
      gender: "MALE",
      avatar: getGravatar("teacher@kumustaka.com"),
      teacher: {
        create: {
          sectionId: sections[0].id, // Assign to first section
        },
      },
    },
    update: {},
    include: {
      teacher: true,
    },
  });
  console.log(
    `👨‍🏫 Created teacher: ${teacher.firstName} ${teacher.lastName} (Section: ${sections[0].name})`
  );

  // Connect counselor to sections
  console.log("🔗 Connecting counselor to sections...");
  await prisma.counselor.update({
    where: { id: counselor.counselor.id },
    data: {
      sections: {
        connect: sections.map((s) => ({ id: s.id })),
      },
    },
  });
  console.log(`🔗 Counselor connected to all ${sections.length} sections`);

  // Create 7 student users with Filipino names
  console.log("👨‍🎓 Creating student users...");
  const students = [];

  const studentData = [
    {
      firstName: "Juan",
      lastName: "Dela Cruz",
      email: "juan.delacruz@student.kumustaka.com",
      phone: "09123478901",
      gender: "MALE",
      sectionIndex: 0, // Grade 10 - Section A
    },
    {
      firstName: "Maria",
      lastName: "Santos",
      email: "maria.santos@student.kumustaka.com",
      phone: "09234589012",
      gender: "FEMALE",
      sectionIndex: 0, // Grade 10 - Section A
    },
    {
      firstName: "Pedro",
      lastName: "Reyes",
      email: "pedro.reyes@student.kumustaka.com",
      phone: "09345690123",
      gender: "MALE",
      sectionIndex: 0, // Grade 10 - Section A
    },
    {
      firstName: "Ana",
      lastName: "Garcia",
      email: "ana.garcia@student.kumustaka.com",
      phone: "09456701234",
      gender: "FEMALE",
      sectionIndex: 1, // Grade 10 - Section B
    },
    {
      firstName: "Carlo",
      lastName: "Mendoza",
      email: "carlo.mendoza@student.kumustaka.com",
      phone: "09567812345",
      gender: "MALE",
      sectionIndex: 1, // Grade 10 - Section B
    },
    {
      firstName: "Sophia",
      lastName: "Lim",
      email: "sophia.lim@student.kumustaka.com",
      phone: "09678923456",
      gender: "FEMALE",
      sectionIndex: 2, // Grade 11 - Section A
    },
    {
      firstName: "Miguel",
      lastName: "Tan",
      email: "miguel.tan@student.kumustaka.com",
      phone: "09789034567",
      gender: "MALE",
      sectionIndex: 2, // Grade 11 - Section A
    },
  ];

  // Generate dates for past month
  const pastMonthDates = generatePastMonthDates();

  for (const data of studentData) {
    const password = genPassword(DEFAULT_PASSWORD);
    const assignedSection = sections[data.sectionIndex];

    const student = await prisma.user.upsert({
      where: { email: data.email },
      create: {
        email: data.email,
        salt: password.salt,
        hash: password.hash,
        role: "STUDENT",
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        gender: data.gender,
        avatar: getGravatar(data.email),
        student: {
          create: {
            sectionId: assignedSection.id,
          },
        },
      },
      update: {},
      include: {
        student: true,
      },
    });

    students.push(student);
    console.log(
      `👨‍🎓 Created student: ${student.firstName} ${student.lastName} (Section: ${assignedSection.name})`
    );

    // Add an initial assessment for this student
    console.log(`📝 Creating initial assessment for ${student.firstName}...`);
    const assessment = generateInitialAssessment();
    await prisma.initialAssessment.upsert({
      where: { studentId: student.student.id },
      create: {
        studentId: student.student.id,
        assessmentData: assessment.assessmentData,
        anxietyScore: assessment.anxietyScore,
        depressionScore: assessment.depressionScore,
        stressScore: assessment.stressScore,
        totalScore: assessment.totalScore,
        answers: assessment.answers,
      },
      update: {},
    });

    // Add daily survey responses for the past month
    console.log(`📊 Creating daily surveys for ${student.firstName}...`);

    // First, get a student-specific list of dates to use for this student's entries
    const studentSurveyDates = [];
    for (const baseDate of pastMonthDates) {
      // Skip some days randomly to simulate real usage (80% chance to include a day)
      if (Math.random() < 0.2) continue;

      // Create a copy of the date to avoid modifying the original date object
      const surveyDate = new Date(baseDate);
      surveyDate.setHours(9, 0, 0, 0); // Set to 9:00 AM
      studentSurveyDates.push(surveyDate);
    }

    // Create one survey entry per date for this student
    for (const surveyDate of studentSurveyDates) {
      const phDateStr = getPhDate(surveyDate);
      const surveyData = generateSurveyResponses(survey.id);

      await prisma.surveyResponse.create({
        data: {
          surveyId: survey.id,
          studentId: student.student.id,
          answers: surveyData.answers,
          score: surveyData.score,
          percentage: surveyData.percentage,
          zone: surveyData.zone,
          phDate: phDateStr,
          createdAt: surveyDate,
        },
      });
    }

    // Add mood entries for the past month (one per day)
    console.log(`😊 Creating mood entries for ${student.firstName}...`);

    // Create a student-specific list of dates for mood entries
    const studentMoodDates = [];
    for (const baseDate of pastMonthDates) {
      // Skip some days randomly to simulate real usage (75% chance to include a day)
      if (Math.random() < 0.25) continue;

      // Create a copy of the date to avoid modifying the original date object
      const moodDate = new Date(baseDate);
      moodDate.setHours(15, 0, 0, 0); // Set to 3:00 PM
      studentMoodDates.push(moodDate);
    }

    // Create one mood entry per date for this student
    for (const moodDate of studentMoodDates) {
      await prisma.moodEntry.create({
        data: {
          studentId: student.student.id,
          moodLevel: Math.floor(Math.random() * 5) + 1, // 1-5 range
          notes: Math.random() < 0.7 ? faker.lorem.sentence() : null,
          createdAt: moodDate,
        },
      });
    }

    // Add journals for the past month
    console.log(`📓 Creating journals for ${student.firstName}...`);
    for (let i = 0; i < 8; i++) {
      // Around 8 journals per student
      const journalDate = getRandomRecentDate();

      await prisma.journal.create({
        data: {
          studentId: student.student.id,
          content:
            faker.lorem.paragraphs(2) + "\n\n" + faker.lorem.paragraphs(1),
          isPrivate: Math.random() < 0.7, // 70% are private
          createdAt: journalDate,
          updatedAt: journalDate,
        },
      });
    }

    // Add goals for the past 4 weeks
    console.log(`🎯 Creating goals for ${student.firstName}...`);
    const today = new Date();
    for (let week = 0; week < 4; week++) {
      const weekDate = new Date();
      weekDate.setDate(today.getDate() - week * 7);
      const weekNumber = Math.floor(
        weekDate.getTime() / (7 * 24 * 60 * 60 * 1000)
      );
      const year = weekDate.getFullYear();

      // Create 3-5 goals per week
      const numGoals = Math.floor(Math.random() * 3) + 3;
      let completedGoals = 0;

      for (let i = 0; i < numGoals; i++) {
        const isCompleted = Math.random() < 0.7; // 70% completion rate
        if (isCompleted) completedGoals++;

        await prisma.goal.create({
          data: {
            studentId: student.student.id,
            title: goalTitles[Math.floor(Math.random() * goalTitles.length)],
            description: faker.lorem.sentence(),
            isCompleted: isCompleted,
            weekNumber: weekNumber,
            year: year,
            createdAt: weekDate,
            updatedAt: weekDate,
          },
        });
      }

      // Create weekly goal summary
      const percentage =
        numGoals > 0 ? parseFloat((completedGoals / numGoals).toFixed(2)) : 0;
      let status = "EMPTY";
      if (numGoals > 0) {
        status = completedGoals === numGoals ? "COMPLETED" : "INCOMPLETE";
      }

      await prisma.weeklyGoalSummary.upsert({
        where: {
          studentId_weekNumber_year: {
            studentId: student.student.id,
            weekNumber: weekNumber,
            year: year,
          },
        },
        create: {
          studentId: student.student.id,
          weekNumber: weekNumber,
          year: year,
          totalGoals: numGoals,
          completed: completedGoals,
          percentage: percentage,
          status: status,
        },
        update: {},
      });
    }

    // Add emergency contacts
    console.log(`📞 Creating emergency contacts for ${student.firstName}...`);
    await prisma.emergencyContact.create({
      data: {
        studentId: student.student.id,
        name: faker.person.fullName(),
        relationship: Math.random() < 0.7 ? "Parent" : "Guardian",
        phone: "09" + Math.floor(100000000 + Math.random() * 900000000),
        isPrimary: true,
      },
    });

    // Add a second emergency contact for some students
    if (Math.random() < 0.5) {
      await prisma.emergencyContact.create({
        data: {
          studentId: student.student.id,
          name: faker.person.fullName(),
          relationship: Math.random() < 0.5 ? "Relative" : "Sibling",
          phone: "09" + Math.floor(100000000 + Math.random() * 900000000),
          isPrimary: false,
        },
      });
    }
  }

  // Create forum posts and comments
  console.log("💬 Creating forum posts and comments...");
  for (let i = 0; i < forumPostTopics.length; i++) {
    const topic = forumPostTopics[i];
    const randomStudent = students[Math.floor(Math.random() * students.length)];
    const postDate = getRandomRecentDate();

    // Create the post
    const post = await prisma.forumPost.create({
      data: {
        title: topic.title,
        content:
          topic.content +
          "\n\n" +
          faker.lorem.paragraphs(Math.floor(Math.random() * 2) + 1),
        authorId: randomStudent.id,
        createdAt: postDate,
        isPublished: true,
        images: [],
      },
    });

    // Add reactions for some posts
    for (const student of students) {
      // 60% chance to add a reaction
      if (Math.random() < 0.6) {
        const reactionTypes = ["SPARK", "INSIGHTFUL", "HELPFUL"];
        const randomType =
          reactionTypes[Math.floor(Math.random() * reactionTypes.length)];

        try {
          await prisma.reaction.create({
            data: {
              postId: post.id,
              studentId: student.student.id,
              type: randomType,
            },
          });
        } catch (e) {
          // Ignore unique constraint violations
          console.log("Skipping duplicate reaction");
        }
      }
    }

    // Add comments to the post
    const numComments = Math.floor(Math.random() * 5) + 1;
    for (let j = 0; j < numComments; j++) {
      const commenter = students[Math.floor(Math.random() * students.length)];
      const commentDate = new Date(postDate);
      commentDate.setHours(
        postDate.getHours() + Math.floor(Math.random() * 48)
      ); // Comment within 48 hours

      await prisma.comment.create({
        data: {
          content:
            commentTemplates[
              Math.floor(Math.random() * commentTemplates.length)
            ] +
            " " +
            faker.lorem.sentences(1),
          postId: post.id,
          authorId: commenter.id,
          createdAt: commentDate,
        },
      });
    }
  }

  // Create a conversation between students and counselor
  console.log("💬 Creating conversations...");
  const conversation = await prisma.conversation.create({
    data: {
      title: "Mental Health Support Group",
      createdAt: getRandomRecentDate(),
      isGroup: true,
      participants: {
        connect: [
          { id: counselor.id },
          { id: students[0].id },
          { id: students[1].id },
          { id: students[2].id },
        ],
      },
    },
  });

  // Fetch the conversation with participants to ensure we have them for the messages
  const conversationWithParticipants = await prisma.conversation.findUnique({
    where: { id: conversation.id },
    include: { participants: true },
  });

  // Add messages to the conversation
  const messages = [
    {
      senderId: counselor.id,
      content:
        "Hello everyone! This is a safe space for us to discuss mental health concerns. Feel free to share or ask questions.",
    },
    {
      senderId: students[0].id,
      content:
        "Thanks for creating this group. I've been feeling overwhelmed with schoolwork lately.",
    },
    {
      senderId: students[1].id,
      content: "Same here. The midterm exams are stressing me out.",
    },
    {
      senderId: counselor.id,
      content:
        "It's normal to feel stressed during exam periods. Let's discuss some strategies to manage stress effectively.",
    },
    {
      senderId: students[2].id,
      content:
        "I'd appreciate that. I've been having trouble sleeping because of anxiety about my grades.",
    },
    {
      senderId: counselor.id,
      content:
        "Let's schedule individual sessions too so we can address your specific concerns in more depth.",
    },
  ];

  for (const msg of messages) {
    await prisma.message.create({
      data: {
        content: msg.content,
        senderId: msg.senderId,
        conversationId: conversation.id,
        isRead: true,
        createdAt: getRandomRecentDate(),
        recipients: {
          connect: conversationWithParticipants.participants
            .filter((p) => p.id !== msg.senderId)
            .map((p) => ({ id: p.id })),
        },
      },
    });
  }

  // Create an intervention for one student
  console.log("🚨 Creating intervention...");
  await prisma.intervention.create({
    data: {
      counselorId: counselor.counselor.id,
      studentId: students[0].student.id,
      title: "Academic Stress Management",
      description:
        "Weekly sessions to develop stress management techniques and study skills",
      status: "IN_PROGRESS",
      createdAt: getRandomRecentDate(),
    },
  });

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
