const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { genPassword } = require("../utils/passwordUtil");
const { getGravatar } = require("../utils/avatar");
const { faker } = require("@faker-js/faker");

faker.seed(42);

const DEFAULT_PASSWORD = "Password123!";

// ─── Forum post topics per section ───────────────────────────────────────────

const sectionAForumTopics = [
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
    title: "Coping with academic pressure",
    content:
      "The pressure to perform well is overwhelming. How do you cope with it?",
  },
];

const sectionBForumTopics = [
  {
    title: "Making friends in a new school",
    content:
      "I just transferred here and finding it hard to connect. How did you make new friends?",
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
    title: "Managing time for hobbies",
    content:
      "I feel like I have no time left for hobbies after school. How do you manage?",
  },
];

const commentTemplates = [
  "I completely agree with you!",
  "Thanks for sharing this, it's really helpful.",
  "I've been through something similar and what helped me was taking breaks.",
  "Have you tried approaching it from a different angle?",
  "I would suggest talking to a counselor about this.",
  "This is such an important topic to discuss.",
  "I struggled with this too, you're not alone.",
  "Great point! I never thought about it that way.",
  "This is something many students face, hang in there!",
  "Let's organize a study group to tackle this together!",
];

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

// ─── Helper functions ────────────────────────────────────────────────────────

function getRandomRecentDate() {
  const today = new Date();
  const pastMonth = new Date(today);
  pastMonth.setMonth(today.getMonth() - 1);
  return new Date(
    pastMonth.getTime() +
      Math.random() * (today.getTime() - pastMonth.getTime()),
  );
}

function getPhDate(date = new Date()) {
  return date
    .toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, "-");
}

function generatePastMonthDates() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    date.setHours(0, 0, 0, 0);
    dates.push(date);
  }
  return dates;
}

// ─── Student mental health profiles ──────────────────────────────────────────
// Each student gets a "personality" that drives realistic, consistent data.
// mentalHealthProfile: "healthy" | "mild" | "moderate" | "severe"

function generateSurveyForProfile(profile) {
  const answers = [];
  let rangeMin, rangeMax;

  switch (profile) {
    case "healthy":
      rangeMin = 3;
      rangeMax = 5;
      break;
    case "mild":
      rangeMin = 2;
      rangeMax = 4;
      break;
    case "moderate":
      rangeMin = 1;
      rangeMax = 3;
      break;
    case "severe":
      rangeMin = 1;
      rangeMax = 2;
      break;
    default:
      rangeMin = 2;
      rangeMax = 4;
  }

  for (let i = 1; i <= 12; i++) {
    const value =
      Math.floor(Math.random() * (rangeMax - rangeMin + 1)) + rangeMin;
    answers.push({ questionId: i, value });
  }

  const score = answers.reduce((sum, a) => sum + a.value, 0);
  const maxScore = 60;
  const percentage = parseFloat((score / maxScore).toFixed(2));

  let zone;
  if (percentage >= 0.75) zone = "Green";
  else if (percentage >= 0.55) zone = "Yellow";
  else zone = "Red";

  return { answers, score, percentage, zone };
}

function generateAssessmentForProfile(profile) {
  let dRange, aRange, sRange;

  switch (profile) {
    case "healthy":
      dRange = [0, 1];
      aRange = [0, 1];
      sRange = [0, 1];
      break;
    case "mild":
      dRange = [1, 2];
      aRange = [1, 2];
      sRange = [1, 2];
      break;
    case "moderate":
      dRange = [2, 3];
      aRange = [2, 3];
      sRange = [2, 3];
      break;
    case "severe":
      dRange = [2, 3];
      aRange = [2, 3];
      sRange = [3, 3];
      break;
    default:
      dRange = [0, 3];
      aRange = [0, 3];
      sRange = [0, 3];
  }

  const answers = [];
  let depressionScore = 0;
  for (let i = 1; i <= 7; i++) {
    const value =
      Math.floor(Math.random() * (dRange[1] - dRange[0] + 1)) + dRange[0];
    depressionScore += value;
    answers.push({ id: `D${i}`, value });
  }
  let anxietyScore = 0;
  for (let i = 1; i <= 7; i++) {
    const value =
      Math.floor(Math.random() * (aRange[1] - aRange[0] + 1)) + aRange[0];
    anxietyScore += value;
    answers.push({ id: `A${i}`, value });
  }
  let stressScore = 0;
  for (let i = 1; i <= 7; i++) {
    const value =
      Math.floor(Math.random() * (sRange[1] - sRange[0] + 1)) + sRange[0];
    stressScore += value;
    answers.push({ id: `S${i}`, value });
  }

  depressionScore *= 2;
  anxietyScore *= 2;
  stressScore *= 2;
  const totalScore = depressionScore + anxietyScore + stressScore;

  return {
    assessmentData: { title: "DASS-21", dateCompleted: new Date() },
    answers,
    depressionScore,
    anxietyScore,
    stressScore,
    totalScore,
  };
}

function getMoodRangeForProfile(profile) {
  switch (profile) {
    case "healthy":
      return [3, 5];
    case "mild":
      return [2, 4];
    case "moderate":
      return [1, 3];
    case "severe":
      return [1, 2];
    default:
      return [1, 5];
  }
}

// ─── Main seed ───────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting database seeding...\n");

  // ─── Clean ────────────────────────────────────────────────────────────────
  console.log("🧹 Cleaning database...");
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
  await prisma.passwordHistory.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.counselor.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.survey.deleteMany();
  await prisma.section.deleteMany();

  // ─── Survey ───────────────────────────────────────────────────────────────
  console.log("📋 Creating daily survey...");
  const survey = await prisma.survey.upsert({
    where: { id: "daily-survey" },
    create: {
      id: "daily-survey",
      title: "Daily Mental Health Check-In",
      description: "A 12-item self-report for daily mental health monitoring.",
      type: "DAILY",
      questions: [
        { id: 1, question: "I felt calm and relaxed.", options: [{ label: "Strongly Disagree", value: 1 }, { label: "Disagree", value: 2 }, { label: "Neutral", value: 3 }, { label: "Agree", value: 4 }, { label: "Strongly Agree", value: 5 }] },
        { id: 2, question: "I had trouble focusing on my schoolwork.", options: [{ label: "Strongly Disagree", value: 5 }, { label: "Disagree", value: 4 }, { label: "Neutral", value: 3 }, { label: "Agree", value: 2 }, { label: "Strongly Agree", value: 1 }] },
        { id: 3, question: "I felt connected with my classmates or friends.", options: [{ label: "Strongly Disagree", value: 1 }, { label: "Disagree", value: 2 }, { label: "Neutral", value: 3 }, { label: "Agree", value: 4 }, { label: "Strongly Agree", value: 5 }] },
        { id: 4, question: "I felt anxious or nervous.", options: [{ label: "Strongly Disagree", value: 5 }, { label: "Disagree", value: 4 }, { label: "Neutral", value: 3 }, { label: "Agree", value: 2 }, { label: "Strongly Agree", value: 1 }] },
        { id: 5, question: "I enjoyed the things I did today.", options: [{ label: "Strongly Disagree", value: 1 }, { label: "Disagree", value: 2 }, { label: "Neutral", value: 3 }, { label: "Agree", value: 4 }, { label: "Strongly Agree", value: 5 }] },
        { id: 6, question: "I felt overwhelmed or stressed.", options: [{ label: "Strongly Disagree", value: 5 }, { label: "Disagree", value: 4 }, { label: "Neutral", value: 3 }, { label: "Agree", value: 2 }, { label: "Strongly Agree", value: 1 }] },
        { id: 7, question: "I had enough energy to do my tasks.", options: [{ label: "Strongly Disagree", value: 1 }, { label: "Disagree", value: 2 }, { label: "Neutral", value: 3 }, { label: "Agree", value: 4 }, { label: "Strongly Agree", value: 5 }] },
        { id: 8, question: "I felt hopeful about my future.", options: [{ label: "Strongly Disagree", value: 1 }, { label: "Disagree", value: 2 }, { label: "Neutral", value: 3 }, { label: "Agree", value: 4 }, { label: "Strongly Agree", value: 5 }] },
        { id: 9, question: "I had trouble sleeping or felt tired.", options: [{ label: "Strongly Disagree", value: 5 }, { label: "Disagree", value: 4 }, { label: "Neutral", value: 3 }, { label: "Agree", value: 2 }, { label: "Strongly Agree", value: 1 }] },
        { id: 10, question: "I felt proud of something I did today.", options: [{ label: "Strongly Disagree", value: 1 }, { label: "Disagree", value: 2 }, { label: "Neutral", value: 3 }, { label: "Agree", value: 4 }, { label: "Strongly Agree", value: 5 }] },
        { id: 11, question: "I felt sad or down.", options: [{ label: "Strongly Disagree", value: 5 }, { label: "Disagree", value: 4 }, { label: "Neutral", value: 3 }, { label: "Agree", value: 2 }, { label: "Strongly Agree", value: 1 }] },
        { id: 12, question: "I was able to manage my emotions today.", options: [{ label: "Strongly Disagree", value: 1 }, { label: "Disagree", value: 2 }, { label: "Neutral", value: 3 }, { label: "Agree", value: 4 }, { label: "Strongly Agree", value: 5 }] },
      ],
    },
    update: {},
  });

  // ─── Sections (2 only) ────────────────────────────────────────────────────
  console.log("\n🏫 Creating 2 sections...");
  const sectionA = await prisma.section.create({
    data: {
      name: "Grade 10 - Hope",
      code: "G10HPE",
      description: "Grade 10 Section Hope - Science and Technology",
      gradeLevel: "Grade 10",
    },
  });
  const sectionB = await prisma.section.create({
    data: {
      name: "Grade 10 - Faith",
      code: "G10FTH",
      description: "Grade 10 Section Faith - Humanities and Social Sciences",
      gradeLevel: "Grade 10",
    },
  });
  const sections = [sectionA, sectionB];
  console.log(`   ${sectionA.name} (Code: ${sectionA.code})`);
  console.log(`   ${sectionB.name} (Code: ${sectionB.code})`);

  // ─── Admin ────────────────────────────────────────────────────────────────
  console.log("\n👨‍💼 Creating admin...");
  const adminPass = genPassword(DEFAULT_PASSWORD);
  const admin = await prisma.user.create({
    data: {
      email: "admin@kumustaka.com",
      salt: adminPass.salt,
      hash: adminPass.hash,
      role: "ADMIN",
      firstName: "Admin",
      lastName: "User",
      phone: "09123456789",
      gender: "MALE",
      avatar: getGravatar("admin@kumustaka.com"),
      admin: { create: {} },
    },
    include: { admin: true },
  });
  console.log(`   ${admin.firstName} ${admin.lastName}`);

  // ─── 2 Teachers (one per section) ─────────────────────────────────────────
  console.log("\n👨‍🏫 Creating 2 teachers...");
  const teachersData = [
    { firstName: "Miguel", lastName: "Reyes", email: "miguel.reyes@kumustaka.com", phone: "09567891234", gender: "MALE", sectionId: sectionA.id },
    { firstName: "Elena", lastName: "Cruz", email: "elena.cruz@kumustaka.com", phone: "09567891235", gender: "FEMALE", sectionId: sectionB.id },
  ];
  const teachers = [];
  for (const td of teachersData) {
    const pass = genPassword(DEFAULT_PASSWORD);
    const t = await prisma.user.create({
      data: {
        email: td.email,
        salt: pass.salt,
        hash: pass.hash,
        role: "TEACHER",
        firstName: td.firstName,
        lastName: td.lastName,
        phone: td.phone,
        gender: td.gender,
        avatar: getGravatar(td.email),
        teacher: { create: { sectionId: td.sectionId } },
      },
      include: { teacher: true },
    });
    teachers.push(t);
    const sName = sections.find((s) => s.id === td.sectionId)?.name;
    console.log(`   ${t.firstName} ${t.lastName} → ${sName}`);
  }

  // ─── 2 Counselors (both connected to both sections) ───────────────────────
  console.log("\n👨‍⚕️ Creating 2 counselors...");
  const counselorsData = [
    { firstName: "Grace", lastName: "Santos", email: "grace.santos@kumustaka.com", phone: "09987654321", gender: "FEMALE" },
    { firstName: "Marco", lastName: "Villanueva", email: "marco.villanueva@kumustaka.com", phone: "09987654322", gender: "MALE" },
  ];
  const counselors = [];
  for (const cd of counselorsData) {
    const pass = genPassword(DEFAULT_PASSWORD);
    const c = await prisma.user.create({
      data: {
        email: cd.email,
        salt: pass.salt,
        hash: pass.hash,
        role: "COUNSELOR",
        firstName: cd.firstName,
        lastName: cd.lastName,
        phone: cd.phone,
        gender: cd.gender,
        avatar: getGravatar(cd.email),
        counselor: { create: {} },
      },
      include: { counselor: true },
    });
    // Connect to both sections
    await prisma.counselor.update({
      where: { id: c.counselor.id },
      data: { sections: { connect: sections.map((s) => ({ id: s.id })) } },
    });
    counselors.push(c);
    console.log(`   ${c.firstName} ${c.lastName} → both sections`);
  }

  // ─── 10 Students (5 per section) ──────────────────────────────────────────
  // Profile key: healthy = Green zone, mild = Yellow, moderate = Yellow/Red boundary, severe = Red
  console.log("\n👨‍🎓 Creating 10 students (5 per section)...");

  const studentDefs = [
    // ── Section A: Grade 10 - Hope ──
    { firstName: "Juan",    lastName: "Dela Cruz", email: "juan.delacruz@student.kumustaka.com",    phone: "09123478901", gender: "MALE",   sectionId: sectionA.id, profile: "healthy"  },
    { firstName: "Maria",   lastName: "Santos",    email: "maria.santos@student.kumustaka.com",     phone: "09234589012", gender: "FEMALE", sectionId: sectionA.id, profile: "healthy"  },
    { firstName: "Pedro",   lastName: "Reyes",     email: "pedro.reyes@student.kumustaka.com",      phone: "09345690123", gender: "MALE",   sectionId: sectionA.id, profile: "mild"     },
    { firstName: "Ana",     lastName: "Garcia",    email: "ana.garcia@student.kumustaka.com",       phone: "09456701234", gender: "FEMALE", sectionId: sectionA.id, profile: "moderate" },
    { firstName: "Carlo",   lastName: "Mendoza",   email: "carlo.mendoza@student.kumustaka.com",    phone: "09567812345", gender: "MALE",   sectionId: sectionA.id, profile: "severe"   },

    // ── Section B: Grade 10 - Faith ──
    { firstName: "Sophia",  lastName: "Lim",       email: "sophia.lim@student.kumustaka.com",       phone: "09678923456", gender: "FEMALE", sectionId: sectionB.id, profile: "healthy"  },
    { firstName: "Miguel",  lastName: "Tan",       email: "miguel.tan@student.kumustaka.com",       phone: "09789034567", gender: "MALE",   sectionId: sectionB.id, profile: "mild"     },
    { firstName: "Isabella",lastName: "Ramos",     email: "isabella.ramos@student.kumustaka.com",   phone: "09890145678", gender: "FEMALE", sectionId: sectionB.id, profile: "moderate" },
    { firstName: "Rafael",  lastName: "Aquino",    email: "rafael.aquino@student.kumustaka.com",    phone: "09901256789", gender: "MALE",   sectionId: sectionB.id, profile: "severe"   },
    { firstName: "Camille", lastName: "De Leon",   email: "camille.deleon@student.kumustaka.com",   phone: "09012367890", gender: "FEMALE", sectionId: sectionB.id, profile: "healthy"  },
  ];

  const students = [];
  const sectionStudents = { [sectionA.id]: [], [sectionB.id]: [] };
  const pastMonthDates = generatePastMonthDates();

  for (const sd of studentDefs) {
    const pass = genPassword(DEFAULT_PASSWORD);
    const student = await prisma.user.create({
      data: {
        email: sd.email,
        salt: pass.salt,
        hash: pass.hash,
        role: "STUDENT",
        firstName: sd.firstName,
        lastName: sd.lastName,
        phone: sd.phone,
        gender: sd.gender,
        avatar: getGravatar(sd.email),
        student: { create: { sectionId: sd.sectionId } },
      },
      include: { student: true },
    });
    student._profile = sd.profile;
    student._sectionId = sd.sectionId;
    students.push(student);
    sectionStudents[sd.sectionId].push(student);

    const sName = sections.find((s) => s.id === sd.sectionId)?.name;
    console.log(
      `   ${student.firstName} ${student.lastName} → ${sName} [${sd.profile}]`,
    );

    // ── Initial Assessment ──
    const assessment = generateAssessmentForProfile(sd.profile);
    await prisma.initialAssessment.create({
      data: {
        studentId: student.student.id,
        assessmentData: assessment.assessmentData,
        anxietyScore: assessment.anxietyScore,
        depressionScore: assessment.depressionScore,
        stressScore: assessment.stressScore,
        totalScore: assessment.totalScore,
        answers: assessment.answers,
      },
    });

    // ── Daily surveys (past 30 days, ~80% coverage) ──
    for (const baseDate of pastMonthDates) {
      if (Math.random() < 0.2) continue;
      const surveyDate = new Date(baseDate);
      surveyDate.setHours(9, 0, 0, 0);
      const surveyData = generateSurveyForProfile(sd.profile);
      await prisma.surveyResponse.create({
        data: {
          surveyId: survey.id,
          studentId: student.student.id,
          answers: surveyData.answers,
          score: surveyData.score,
          percentage: surveyData.percentage,
          zone: surveyData.zone,
          phDate: getPhDate(surveyDate),
          createdAt: surveyDate,
        },
      });
    }

    // ── Mood entries (past 30 days, ~75% coverage) ──
    const [moodMin, moodMax] = getMoodRangeForProfile(sd.profile);
    for (const baseDate of pastMonthDates) {
      if (Math.random() < 0.25) continue;
      const moodDate = new Date(baseDate);
      moodDate.setHours(15, 0, 0, 0);
      const moodLevel =
        Math.floor(Math.random() * (moodMax - moodMin + 1)) + moodMin;
      await prisma.moodEntry.create({
        data: {
          studentId: student.student.id,
          moodLevel,
          notes: Math.random() < 0.7 ? faker.lorem.sentence() : null,
          createdAt: moodDate,
        },
      });
    }

    // ── Journals (~8 entries) ──
    for (let i = 0; i < 8; i++) {
      const journalDate = getRandomRecentDate();
      await prisma.journal.create({
        data: {
          studentId: student.student.id,
          content:
            faker.lorem.paragraphs(2) + "\n\n" + faker.lorem.paragraphs(1),
          isPrivate: Math.random() < 0.7,
          createdAt: journalDate,
          updatedAt: journalDate,
        },
      });
    }

    // ── Goals (past 4 weeks) ──
    const today = new Date();
    for (let week = 0; week < 4; week++) {
      const weekDate = new Date();
      weekDate.setDate(today.getDate() - week * 7);
      const weekNumber = Math.floor(
        weekDate.getTime() / (7 * 24 * 60 * 60 * 1000),
      );
      const year = weekDate.getFullYear();
      const numGoals = Math.floor(Math.random() * 3) + 3;
      let completedGoals = 0;
      const completionRate = sd.profile === "severe" ? 0.3 : sd.profile === "moderate" ? 0.5 : 0.7;

      for (let i = 0; i < numGoals; i++) {
        const isCompleted = Math.random() < completionRate;
        if (isCompleted) completedGoals++;
        await prisma.goal.create({
          data: {
            studentId: student.student.id,
            title: goalTitles[Math.floor(Math.random() * goalTitles.length)],
            description: faker.lorem.sentence(),
            isCompleted,
            weekNumber,
            year,
            createdAt: weekDate,
            updatedAt: weekDate,
          },
        });
      }

      const percentage =
        numGoals > 0
          ? parseFloat((completedGoals / numGoals).toFixed(2))
          : 0;
      const status =
        numGoals === 0
          ? "EMPTY"
          : completedGoals === numGoals
            ? "COMPLETED"
            : "INCOMPLETE";

      await prisma.weeklyGoalSummary.upsert({
        where: {
          studentId_weekNumber_year: {
            studentId: student.student.id,
            weekNumber,
            year,
          },
        },
        create: {
          studentId: student.student.id,
          weekNumber,
          year,
          totalGoals: numGoals,
          completed: completedGoals,
          percentage,
          status,
        },
        update: {},
      });
    }

    // ── Emergency contacts ──
    await prisma.emergencyContact.create({
      data: {
        studentId: student.student.id,
        name: faker.person.fullName(),
        relationship: Math.random() < 0.7 ? "Parent" : "Guardian",
        phone: "09" + Math.floor(100000000 + Math.random() * 900000000),
        isPrimary: true,
      },
    });
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

  // ─── Forum posts & comments (section-isolated) ────────────────────────────
  console.log("\n💬 Creating forum posts & comments (section-isolated)...");

  const forumTopicsBySectionId = {
    [sectionA.id]: sectionAForumTopics,
    [sectionB.id]: sectionBForumTopics,
  };

  for (const section of sections) {
    const topics = forumTopicsBySectionId[section.id];
    const sStudents = sectionStudents[section.id];

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      const author = sStudents[i % sStudents.length]; // Round-robin authors
      const postDate = getRandomRecentDate();

      const post = await prisma.forumPost.create({
        data: {
          title: topic.title,
          content:
            topic.content +
            "\n\n" +
            faker.lorem.paragraphs(Math.floor(Math.random() * 2) + 1),
          authorId: author.id,
          sectionId: section.id,
          createdAt: postDate,
          isPublished: true,
          images: [],
        },
      });

      // Reactions — only from students in the same section
      for (const s of sStudents) {
        if (Math.random() < 0.6) {
          try {
            await prisma.reaction.create({
              data: {
                postId: post.id,
                studentId: s.student.id,
                type: "SPARK",
              },
            });
          } catch {
            // skip duplicate
          }
        }
      }

      // Comments — only from students in the same section
      const numComments = Math.floor(Math.random() * 4) + 2;
      for (let j = 0; j < numComments; j++) {
        const commenter =
          sStudents[Math.floor(Math.random() * sStudents.length)];
        const commentDate = new Date(postDate);
        commentDate.setHours(
          postDate.getHours() + Math.floor(Math.random() * 48),
        );
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

    console.log(
      `   ${section.name}: ${topics.length} posts with section-only comments`,
    );
  }

  // ─── Conversations ────────────────────────────────────────────────────────
  console.log("\n💬 Creating conversations...");
  const convoStudentsA = sectionStudents[sectionA.id].slice(0, 3);
  const conversation = await prisma.conversation.create({
    data: {
      title: "Mental Health Support Group",
      createdAt: getRandomRecentDate(),
      isGroup: true,
      participants: {
        connect: [
          { id: counselors[0].id },
          ...convoStudentsA.map((s) => ({ id: s.id })),
        ],
      },
    },
  });

  const convoWithParticipants = await prisma.conversation.findUnique({
    where: { id: conversation.id },
    include: { participants: true },
  });

  const messages = [
    { senderId: counselors[0].id, content: "Hello everyone! This is a safe space for us to discuss mental health concerns. Feel free to share or ask questions." },
    { senderId: convoStudentsA[0].id, content: "Thanks for creating this group. I've been feeling overwhelmed with schoolwork lately." },
    { senderId: convoStudentsA[1].id, content: "Same here. The midterm exams are stressing me out." },
    { senderId: counselors[0].id, content: "It's normal to feel stressed during exam periods. Let's discuss some strategies to manage stress effectively." },
    { senderId: convoStudentsA[2].id, content: "I'd appreciate that. I've been having trouble sleeping because of anxiety about my grades." },
    { senderId: counselors[0].id, content: "Let's schedule individual sessions too so we can address your specific concerns in more depth." },
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
          connect: convoWithParticipants.participants
            .filter((p) => p.id !== msg.senderId)
            .map((p) => ({ id: p.id })),
        },
      },
    });
  }

  // ─── Interventions for red-zone students ──────────────────────────────────
  console.log("\n🚨 Creating interventions for at-risk students...");
  const severeStudents = students.filter((s) => s._profile === "severe");
  const moderateStudents = students.filter((s) => s._profile === "moderate");

  for (const ss of severeStudents) {
    await prisma.intervention.create({
      data: {
        counselorId: counselors[0].counselor.id,
        studentId: ss.student.id,
        title: "Crisis Support and Monitoring",
        description:
          "Bi-weekly individual counseling sessions focused on emotional regulation, coping strategies, and academic support. Student is showing signs of severe distress.",
        status: "IN_PROGRESS",
        createdAt: getRandomRecentDate(),
      },
    });
    console.log(
      `   Crisis intervention for ${ss.firstName} ${ss.lastName}`,
    );
  }

  for (const ms of moderateStudents) {
    await prisma.intervention.create({
      data: {
        counselorId: counselors[1].counselor.id,
        studentId: ms.student.id,
        title: "Academic Stress Management",
        description:
          "Weekly sessions to develop stress management techniques and improve study habits.",
        status: "IN_PROGRESS",
        createdAt: getRandomRecentDate(),
      },
    });
    console.log(
      `   Stress management for ${ms.firstName} ${ms.lastName}`,
    );
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log("\n✅ Seeding completed!");
  console.log(`   Sections:   ${sections.length}`);
  console.log(`   Admin:      1`);
  console.log(`   Teachers:   ${teachers.length}`);
  console.log(`   Counselors: ${counselors.length}`);
  console.log(`   Students:   ${students.length} (${students.filter((s) => s._profile === "severe").length} severe, ${students.filter((s) => s._profile === "moderate").length} moderate)`);
  console.log(`\n   Default password for all accounts: ${DEFAULT_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
