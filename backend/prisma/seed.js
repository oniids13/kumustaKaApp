const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { genPassword } = require("../utils/passwordUtil");
const { getGravatar } = require("../utils/avatar");

const DEFAULT_PASSWORD = "Password123!";

// ─── Forum post topics per section (Taglish) ─────────────────────────────────

const sectionAForumTopics = [
  {
    title: "Stressed na ako sa upcoming exam",
    content:
      "Guys, paano niyo nilalabanan yung anxiety bago mag-exam? Hindi ako makatulog last night kakaisip sa Math test bukas. Open to any tips!",
  },
  {
    title: "Tips for balancing acads and family responsibilities",
    content:
      "Eldest ako sa amin so I help around the house a lot. Sometimes nakakaapekto sa studies ko. Anyone going through the same? Paano niyo na-balance?",
  },
  {
    title: "Nahihirapan ako mag-focus lately",
    content:
      "Kahit anong gawin ko parang lutang ako sa class. Naka-experience na ba kayo nito? Ano ginawa niyo para makabalik sa focus?",
  },
  {
    title: "Sleep schedule — paano niyo inaayos?",
    content:
      "Kakatapos lang ng finals and ngayon hindi na ako makatulog ng tama. Awake ako buong gabi tapos antok buong araw. May tips ba kayo?",
  },
  {
    title: "Group projects with hindi cooperative members",
    content:
      "Ako lang yung gumagawa ng group project namin and na-stress na ako. Paano kayo nakikipag-usap sa groupmates niyo without sounding rude?",
  },
  {
    title: "Mental health break — is it okay to take one?",
    content:
      "Iniisip kong mag-leave ng one day kasi sobrang pagod ko na. Pero feeling ko guilty rin kasi may missed work. Thoughts?",
  },
  {
    title: "Comparing myself to my classmates",
    content:
      "Lagi kong nakikita yung iba na parang sobrang galing tapos ako parang nasa likod lang. How do you stop comparing?",
  },
  {
    title: "Looking for a study buddy for Science",
    content:
      "Hi! Nahihirapan ako sa Chemistry, lalo na sa moles and stoichiometry. May open ba dito for a low-key study sesh after class?",
  },
];

const sectionBForumTopics = [
  {
    title: "Homesick after transferring schools",
    content:
      "Bago lang ako sa school na to. Wala pa akong masyadong friends and miss ko na yung dating barkada ko. How do I cope habang nag-aadjust?",
  },
  {
    title: "Pressure from parents about grades",
    content:
      "Yung parents ko expect na laging Top 1 ako. Pero ngayong quarter, nababagsakan ako sa some subjects. Takot akong sabihin sa kanila. Help.",
  },
  {
    title: "Crush problems — relatable ba?",
    content:
      "May crush ako pero feeling ko walang pag-asa. Distracted na ako sa class kakaisip. Paano niyo nilalabanan ang feelings?",
  },
  {
    title: "Healthy meals na affordable for students",
    content:
      "Trying to eat better pero limited yung allowance ko. Anong mga meal ideas niyo na masustansya pero hindi mahal? Open to suggestions!",
  },
  {
    title: "Anxiety attack sa school — anyone else?",
    content:
      "Last week may na-experience ako parang anxiety attack sa school. Nahirapan ako huminga. Naka-experience na ba kayo nito? Ano ginawa niyo?",
  },
  {
    title: "Dealing with toxic friends",
    content:
      "May barkada ako pero feeling ko draining yung interactions namin lately. Hindi ko alam kung mag-distance ba ako or talk it out. Confused.",
  },
  {
    title: "Pang-stress reliever na hobbies",
    content:
      "Looking for hobbies na pwedeng gawin pag-uwi ng bahay para makarelax. Yung iba kasi sa screen-time lang nauuwi tapos parang mas pagod pa.",
  },
  {
    title: "Diary or journaling app — alin mas effective?",
    content:
      "Naghahanap ako ng way to vent na hindi nakakaabala sa iba. Anong ginagamit niyo? May app kayong i-rerecommend or notebook talaga?",
  },
];

const taglishCommentTemplates = [
  "Same! Lagi rin akong ganyan, especially pag finals week.",
  "Kaya mo yan! Take it one day at a time lang.",
  "Try mo mag-journal, sobrang nakakatulong sa akin.",
  "You're not alone, kapatid.",
  "Tara, study group tayo!",
  "I feel you. Pinagdaanan ko rin yan last year.",
  "Have you tried talking to Ma'am Grace? Sobrang bait niya.",
  "Hugs. Andito lang kami pag kailangan mo.",
  "Same boat tayo. Let's get through this together.",
  "It will pass, promise. Push lang ng push.",
  "Thank you for sharing this. Important yung topic.",
  "Honestly relatable to the core.",
  "Don't be too hard on yourself, friend.",
  "Sometimes okay lang umiyak. Healthy yan.",
  "Galing mo na nga nakapag-share. Big step yan.",
];

const taglishCommentSentences = [
  "Sana okay ka rin pala.",
  "Nasa iyo lang yung lakas, trust me.",
  "Praying for you!",
  "Let me know kung kailangan mo ng kausap.",
  "Push lang, kaya mo!",
  "Grabe na talaga school sa amin lately.",
  "We got this!",
  "Hindi tayo nag-iisa.",
  "Always here for you, friend.",
  "Take care palagi, ha?",
];

const postElaborations = [
  "Sana may mag-share ng experience nila para makasama tayo sa journey.",
  "Hindi ako sigurado kung tama yung approach ko, kaya nagtatanong ako dito.",
  "Mahirap pala mag-open up but I think this community is safe enough.",
  "Salamat in advance sa mga magbibigay ng tips.",
  "Trying to be more open about how I feel.",
  "Salamat sa mga willing tumulong, appreciated yan.",
  "Open ako sa feedback kahit blunt. Need ko ng honest takes.",
];

// ─── Journal & mood content (Taglish, profile-aware) ─────────────────────────

const taglishJournalsByProfile = {
  healthy: [
    "Sobrang saya ng day ko today. Nag-hangout kami ng barkada after class and napag-usapan namin yung plans for the upcoming sportsfest. Excited na ako!",
    "Today I'm grateful for my family. Naglakad kami sa park kanina and it reminded me how lucky ako sa support system ko.",
    "Nag-ace ako sa Math quiz! All those late-night reviews paid off. Kailangan ko lang i-keep up yung pace.",
    "Feeling productive today. Natapos ko early yung projects ko so may time pa ako mag-relax and read for fun. Ang sarap ng feeling.",
    "Tinawag ako ni teacher para mag-recite kanina and I actually nailed it. Nakaka-boost ng confidence.",
    "Nag-volunteer ako sa community outreach last weekend. Iba talaga yung feeling pag nakakatulong ka sa iba.",
  ],
  mild: [
    "Medyo pagod ako today. Maraming deadlines this week and I'm trying to balance everything. Hopefully kakayanin pa.",
    "Kinabahan ako sa recitation kanina pero okay naman. Sometimes I wish hindi ako masyadong overthinker.",
    "Hindi ako masyadong nakatulog last night kasi inisip ko yung exam. Nakapasa naman ako, but I felt drained the whole day.",
    "I had a small misunderstanding with a friend today. Hindi naman big deal pero nag-stuck sa isip ko buong araw.",
    "Trying to stay on top of school work pero medyo overwhelming. One step at a time daw, sabi ng mama ko.",
    "Some days okay lang, some days down. Today is somewhere in the middle. At least nakapag-journal ako, baby steps.",
  ],
  moderate: [
    "Ang bigat ng pakiramdam ko today. Pumasok ako sa school pero parang lutang lang ako buong day. Hindi ko alam kung saan magsisimula.",
    "Sobrang stressed ako sa requirements. Lahat sabay-sabay due, and I don't know if kakayanin ko pa lahat. Iyak ako kanina sa CR.",
    "I'm trying to push through pero feeling ko hindi enough yung effort ko. Bakit ganito?",
    "Wala akong gana kumain today. Hindi rin ako naka-participate sa class. Sana mawala na yung feeling na to.",
    "May mga araw na gusto ko na lang sumuko. Pero pinipilit ko, kasi may mga taong umaasa sa akin.",
    "Hindi ko alam kung depressed ba ako or just tired. Either way, gusto ko lang matulog tapos huwag na gumising for a while.",
  ],
  severe: [
    "Sobrang bigat ng dinadala ko ngayon. Hindi ko alam kung kanino ako magsasabi. Hindi naman ako naiintindihan ng iba.",
    "Pinipilit ko mag-act normal sa harap ng family ko pero sa loob ng kwarto ko, hindi ko mapigilan umiyak. Pagod na pagod na ako.",
    "Hindi ako nakatulog ng maayos for days. Lahat ng iniisip ko parang masama. Para akong nasa madilim na lugar na walang labasan.",
    "May araw na bumubulong sa akin yung utak ko na hindi na ako importante. Alam kong mali yun pero ang hirap labanan.",
    "Hindi ko alam kung anong mali sa akin. Kahit yung mga bagay na before nakaka-saya, parang wala nang kwenta ngayon.",
    "I want to reach out pero takot akong mahusgahan. Sometimes feeling ko mas okay na lang kung wala nang nakaka-alam.",
  ],
};

const taglishMoodNotesByLevel = {
  5: [
    "Ang saya ng day ko today!",
    "Nakakuha ako ng perfect sa quiz, sobrang saya!",
    "Best day with my barkada.",
    "Productive day, energized ako!",
    "Grateful sa lahat ng blessings.",
  ],
  4: [
    "Maganda yung araw, chill lang.",
    "Okay naman ang day, learned something new.",
    "Solid yung lunch with family.",
    "Hindi perfect pero okay rin.",
    "Productive ako today, content.",
  ],
  3: [
    "Average lang yung day ko.",
    "Okay lang, walang special.",
    "Medyo pagod pero kaya pa.",
    "Hindi ko alam ano feeling ko, neutral siguro.",
    "Normal day, nothing exciting.",
  ],
  2: [
    "Medyo down ako today.",
    "Hindi ako masyadong okay, pagod.",
    "Stressed ako sa school.",
    "Wala akong gana today.",
    "Off ang vibes ko ngayon.",
  ],
  1: [
    "Pagod na pagod na ako.",
    "Sobrang bigat ng pakiramdam ko.",
    "Hindi ko alam ano gagawin.",
    "Iyak ako sa CR earlier.",
    "Sana matapos na yung araw na to.",
  ],
};

// ─── Filipino guardian/parent name pools ─────────────────────────────────────

const filipinoMotherFirstNames = [
  "Maria Cristina",
  "Rosalinda",
  "Cynthia",
  "Imelda",
  "Teresa",
  "Marivic",
  "Esperanza",
  "Aileen",
  "Marilou",
  "Beatriz",
  "Corazon",
  "Annaliza",
  "Editha",
  "Jocelyn",
  "Lorraine",
];

const filipinoFatherFirstNames = [
  "Roberto",
  "Antonio",
  "Reynaldo",
  "Eduardo",
  "Ricardo",
  "Romeo",
  "Raymundo",
  "Rolando",
  "Crisanto",
  "Felipe",
  "Manuel",
  "Domingo",
  "Armando",
  "Gerardo",
  "Norberto",
];

const filipinoMaternalSurnames = [
  "Robles",
  "Navarro",
  "Salvador",
  "Cabrera",
  "Yangco",
  "Macaraeg",
  "Ortega",
  "Salazar",
  "Morales",
  "Fernandez",
  "Concepcion",
  "Gatchalian",
  "Hilario",
  "Pajaro",
  "Rivera",
];

const siblingFirstNames = [
  "Joel",
  "Karla",
  "Diego",
  "Maricel",
  "Mark Lawrence",
  "Yumi",
  "Reggie",
  "Ela",
  "Paolo",
  "Lara",
  "Ronnie",
  "Liza",
  "Andre",
  "Faye",
  "Jaime",
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

const taglishGoalDescriptions = [
  "Aiming to finish bago mag-weekend para may rest day pa ako.",
  "Konting push lang, kaya pa.",
  "Para hindi cramming ulit pagdating ng deadline.",
  "Para mas makasabay ako sa class discussion.",
  "Slow and steady — magpa-pace lang.",
  "Hopefully this time, mas focused ako.",
];

// ─── Helper functions ────────────────────────────────────────────────────────

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

function buildJournalContent(profile) {
  const pool = taglishJournalsByProfile[profile] || taglishJournalsByProfile.mild;
  const numEntries = Math.random() < 0.5 ? 2 : 3;
  const picks = new Set();
  while (picks.size < numEntries && picks.size < pool.length) {
    picks.add(pickRandom(pool));
  }
  return Array.from(picks).join("\n\n");
}

function buildPostContent(topic) {
  const numExtras = Math.floor(Math.random() * 2) + 1;
  const extras = Array.from({ length: numExtras }, () =>
    pickRandom(postElaborations),
  ).join(" ");
  return `${topic.content}\n\n${extras}`;
}

function buildPrimaryContactName(student) {
  const isMother = Math.random() < 0.5;
  const firstName = isMother
    ? pickRandom(filipinoMotherFirstNames)
    : pickRandom(filipinoFatherFirstNames);
  return `${firstName} ${student.lastName}`;
}

function buildSecondaryContactName(student, relationship) {
  if (relationship === "Sibling") {
    const firstName = pickRandom(siblingFirstNames);
    return `${firstName} ${student.lastName}`;
  }
  // Relative — different surname (maternal-side)
  const isFemale = Math.random() < 0.5;
  const firstName = isFemale
    ? pickRandom(filipinoMotherFirstNames)
    : pickRandom(filipinoFatherFirstNames);
  return `${firstName} ${pickRandom(filipinoMaternalSurnames)}`;
}

// ─── Student mental health profiles ──────────────────────────────────────────
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
      firstName: "Ricardo",
      lastName: "Esteban",
      phone: "09171000099",
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
    { firstName: "Miguel", lastName: "Reyes", email: "miguel.reyes@kumustaka.com", phone: "09171000091", gender: "MALE", sectionId: sectionA.id },
    { firstName: "Elena", lastName: "Cruz", email: "elena.cruz@kumustaka.com", phone: "09171000092", gender: "FEMALE", sectionId: sectionB.id },
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

  // ─── 1 Counselor (connected to both sections) ─────────────────────────────
  console.log("\n👨‍⚕️ Creating 1 guidance counselor...");
  const counselorData = {
    firstName: "Grace",
    lastName: "Santos",
    email: "grace.santos@kumustaka.com",
    phone: "09171000093",
    gender: "FEMALE",
  };
  const counselorPass = genPassword(DEFAULT_PASSWORD);
  const counselor = await prisma.user.create({
    data: {
      email: counselorData.email,
      salt: counselorPass.salt,
      hash: counselorPass.hash,
      role: "COUNSELOR",
      firstName: counselorData.firstName,
      lastName: counselorData.lastName,
      phone: counselorData.phone,
      gender: counselorData.gender,
      avatar: getGravatar(counselorData.email),
      counselor: { create: {} },
    },
    include: { counselor: true },
  });
  await prisma.counselor.update({
    where: { id: counselor.counselor.id },
    data: { sections: { connect: sections.map((s) => ({ id: s.id })) } },
  });
  console.log(`   ${counselor.firstName} ${counselor.lastName} → both sections`);

  // ─── 30 Students (15 per section) ─────────────────────────────────────────
  // Profile distribution per section: 6 healthy / 4 mild / 3 moderate / 2 severe
  // Across both sections: 12 healthy (Green), 8 mild + 6 moderate (Yellow / Yellow-Red),
  // and 4 severe (Red) — guarantees all three zones are populated.
  console.log("\n👨‍🎓 Creating 30 students (15 per section)...");

  const studentDefs = [
    // ── Section A: Grade 10 - Hope ──
    { firstName: "Gabriel",   lastName: "Mendoza",  email: "gabriel.mendoza@student.kumustaka.com",   phone: "09171000001", gender: "MALE",   sectionId: sectionA.id, profile: "healthy"  },
    { firstName: "Andrea",    lastName: "Castillo", email: "andrea.castillo@student.kumustaka.com",   phone: "09171000002", gender: "FEMALE", sectionId: sectionA.id, profile: "healthy"  },
    { firstName: "Sebastian", lastName: "Cruz",     email: "sebastian.cruz@student.kumustaka.com",    phone: "09171000003", gender: "MALE",   sectionId: sectionA.id, profile: "healthy"  },
    { firstName: "Bianca",    lastName: "Torres",   email: "bianca.torres@student.kumustaka.com",     phone: "09171000004", gender: "FEMALE", sectionId: sectionA.id, profile: "healthy"  },
    { firstName: "Joaquin",   lastName: "Reyes",    email: "joaquin.reyes@student.kumustaka.com",     phone: "09171000005", gender: "MALE",   sectionId: sectionA.id, profile: "healthy"  },
    { firstName: "Nicole",    lastName: "Aquino",   email: "nicole.aquino@student.kumustaka.com",     phone: "09171000006", gender: "FEMALE", sectionId: sectionA.id, profile: "healthy"  },
    { firstName: "Matthew",   lastName: "Ramos",    email: "matthew.ramos@student.kumustaka.com",     phone: "09171000007", gender: "MALE",   sectionId: sectionA.id, profile: "mild"     },
    { firstName: "Hannah",    lastName: "Gonzales", email: "hannah.gonzales@student.kumustaka.com",   phone: "09171000008", gender: "FEMALE", sectionId: sectionA.id, profile: "mild"     },
    { firstName: "Christian", lastName: "Bautista", email: "christian.bautista@student.kumustaka.com",phone: "09171000009", gender: "MALE",   sectionId: sectionA.id, profile: "mild"     },
    { firstName: "Sofia",     lastName: "Lopez",    email: "sofia.lopez@student.kumustaka.com",       phone: "09171000010", gender: "FEMALE", sectionId: sectionA.id, profile: "mild"     },
    { firstName: "Daniel",    lastName: "Garcia",   email: "daniel.garcia@student.kumustaka.com",     phone: "09171000011", gender: "MALE",   sectionId: sectionA.id, profile: "moderate" },
    { firstName: "Patricia",  lastName: "Alvarez",  email: "patricia.alvarez@student.kumustaka.com",  phone: "09171000012", gender: "FEMALE", sectionId: sectionA.id, profile: "moderate" },
    { firstName: "Joshua",    lastName: "Tan",      email: "joshua.tan@student.kumustaka.com",        phone: "09171000013", gender: "MALE",   sectionId: sectionA.id, profile: "moderate" },
    { firstName: "Erika",     lastName: "Domingo",  email: "erika.domingo@student.kumustaka.com",     phone: "09171000014", gender: "FEMALE", sectionId: sectionA.id, profile: "severe"   },
    { firstName: "Aaron",     lastName: "Velasco",  email: "aaron.velasco@student.kumustaka.com",     phone: "09171000015", gender: "MALE",   sectionId: sectionA.id, profile: "severe"   },

    // ── Section B: Grade 10 - Faith ──
    { firstName: "Lance",      lastName: "Villanueva",   email: "lance.villanueva@student.kumustaka.com",     phone: "09171000016", gender: "MALE",   sectionId: sectionB.id, profile: "healthy"  },
    { firstName: "Mikaela",    lastName: "Santiago",     email: "mikaela.santiago@student.kumustaka.com",     phone: "09171000017", gender: "FEMALE", sectionId: sectionB.id, profile: "healthy"  },
    { firstName: "Jericho",    lastName: "Manalo",       email: "jericho.manalo@student.kumustaka.com",       phone: "09171000018", gender: "MALE",   sectionId: sectionB.id, profile: "healthy"  },
    { firstName: "Camille",    lastName: "Bernardo",     email: "camille.bernardo@student.kumustaka.com",     phone: "09171000019", gender: "FEMALE", sectionId: sectionB.id, profile: "healthy"  },
    { firstName: "Kyle",       lastName: "Pascual",      email: "kyle.pascual@student.kumustaka.com",         phone: "09171000020", gender: "MALE",   sectionId: sectionB.id, profile: "healthy"  },
    { firstName: "Jasmine",    lastName: "Padilla",      email: "jasmine.padilla@student.kumustaka.com",      phone: "09171000021", gender: "FEMALE", sectionId: sectionB.id, profile: "healthy"  },
    { firstName: "Renz",       lastName: "Soriano",      email: "renz.soriano@student.kumustaka.com",         phone: "09171000022", gender: "MALE",   sectionId: sectionB.id, profile: "mild"     },
    { firstName: "Althea",     lastName: "Buenaventura", email: "althea.buenaventura@student.kumustaka.com",  phone: "09171000023", gender: "FEMALE", sectionId: sectionB.id, profile: "mild"     },
    { firstName: "Marcus",     lastName: "Espino",       email: "marcus.espino@student.kumustaka.com",        phone: "09171000024", gender: "MALE",   sectionId: sectionB.id, profile: "mild"     },
    { firstName: "Trisha Mae", lastName: "Gutierrez",    email: "trishamae.gutierrez@student.kumustaka.com",  phone: "09171000025", gender: "FEMALE", sectionId: sectionB.id, profile: "mild"     },
    { firstName: "Vincent",    lastName: "Salonga",      email: "vincent.salonga@student.kumustaka.com",      phone: "09171000026", gender: "MALE",   sectionId: sectionB.id, profile: "moderate" },
    { firstName: "Bea",        lastName: "Robles",       email: "bea.robles@student.kumustaka.com",           phone: "09171000027", gender: "FEMALE", sectionId: sectionB.id, profile: "moderate" },
    { firstName: "Khalil",     lastName: "Diaz",         email: "khalil.diaz@student.kumustaka.com",          phone: "09171000028", gender: "MALE",   sectionId: sectionB.id, profile: "moderate" },
    { firstName: "Rhiana",     lastName: "Mercado",      email: "rhiana.mercado@student.kumustaka.com",       phone: "09171000029", gender: "FEMALE", sectionId: sectionB.id, profile: "severe"   },
    { firstName: "Elijah",     lastName: "Magbanua",     email: "elijah.magbanua@student.kumustaka.com",      phone: "09171000030", gender: "MALE",   sectionId: sectionB.id, profile: "severe"   },
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
          notes:
            Math.random() < 0.7
              ? pickRandom(taglishMoodNotesByLevel[moodLevel])
              : null,
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
          content: buildJournalContent(sd.profile),
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
      const completionRate =
        sd.profile === "severe"
          ? 0.3
          : sd.profile === "moderate"
            ? 0.5
            : 0.7;

      for (let i = 0; i < numGoals; i++) {
        const isCompleted = Math.random() < completionRate;
        if (isCompleted) completedGoals++;
        await prisma.goal.create({
          data: {
            studentId: student.student.id,
            title: pickRandom(goalTitles),
            description: pickRandom(taglishGoalDescriptions),
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

    // ── Emergency contacts (Filipino names) ──
    const primaryRelationship = Math.random() < 0.7 ? "Parent" : "Guardian";
    await prisma.emergencyContact.create({
      data: {
        studentId: student.student.id,
        name: buildPrimaryContactName(student),
        relationship: primaryRelationship,
        phone:
          "09" +
          Math.floor(100000000 + Math.random() * 900000000),
        isPrimary: true,
      },
    });
    if (Math.random() < 0.5) {
      const secondaryRelationship =
        Math.random() < 0.5 ? "Relative" : "Sibling";
      await prisma.emergencyContact.create({
        data: {
          studentId: student.student.id,
          name: buildSecondaryContactName(student, secondaryRelationship),
          relationship: secondaryRelationship,
          phone:
            "09" +
            Math.floor(100000000 + Math.random() * 900000000),
          isPrimary: false,
        },
      });
    }
  }

  // ─── Forum posts & comments (section-isolated, Taglish) ───────────────────
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
      const author = sStudents[i % sStudents.length];
      const postDate = getRandomRecentDate();

      const post = await prisma.forumPost.create({
        data: {
          title: topic.title,
          content: buildPostContent(topic),
          authorId: author.id,
          sectionId: section.id,
          createdAt: postDate,
          isPublished: true,
          images: [],
        },
      });

      // Reactions — only from students in the same section (~40% of section)
      for (const s of sStudents) {
        if (Math.random() < 0.4) {
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
              pickRandom(taglishCommentTemplates) +
              " " +
              pickRandom(taglishCommentSentences),
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

  // ─── Conversations (Taglish) ──────────────────────────────────────────────
  console.log("\n💬 Creating conversations...");
  const convoStudentsA = sectionStudents[sectionA.id].slice(0, 3);
  const conversation = await prisma.conversation.create({
    data: {
      title: "Mental Health Support Group",
      createdAt: getRandomRecentDate(),
      isGroup: true,
      participants: {
        connect: [
          { id: counselor.id },
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
    {
      senderId: counselor.id,
      content:
        "Hi everyone! Welcome sa group natin. Safe space ito para mag-share at magtanong tungkol sa mental health concerns niyo.",
    },
    {
      senderId: convoStudentsA[0].id,
      content:
        "Salamat po Ma'am! Honestly stressed ako sa school lately, sobrang dami ng deadlines.",
    },
    {
      senderId: convoStudentsA[1].id,
      content:
        "Same Ma'am, ang bigat ng load ngayong quarter. Hirap mag-cope.",
    },
    {
      senderId: counselor.id,
      content:
        "Normal yan especially during exam season. Let's discuss some coping strategies natin sa next session. Anong specific challenges niyo?",
    },
    {
      senderId: convoStudentsA[2].id,
      content:
        "Sa akin po, hindi ako makatulog ng maayos kasi anxious lagi about grades. Tapos pagod na pagod ako buong araw.",
    },
    {
      senderId: counselor.id,
      content:
        "Salamat sa pagshare. Mag-set tayo ng one-on-one para mas detalyadong mapag-usapan. I'll DM you to schedule.",
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
          connect: convoWithParticipants.participants
            .filter((p) => p.id !== msg.senderId)
            .map((p) => ({ id: p.id })),
        },
      },
    });
  }

  // ─── Interventions for at-risk students ───────────────────────────────────
  console.log("\n🚨 Creating interventions for at-risk students...");
  const severeStudents = students.filter((s) => s._profile === "severe");
  const moderateStudents = students.filter((s) => s._profile === "moderate");

  for (const ss of severeStudents) {
    await prisma.intervention.create({
      data: {
        counselorId: counselor.counselor.id,
        studentId: ss.student.id,
        title: "Crisis Support and Monitoring",
        description:
          "Bi-weekly individual counseling sessions focused on emotional regulation, coping strategies, and academic support. Student is showing signs of severe distress.",
        status: "IN_PROGRESS",
        createdAt: getRandomRecentDate(),
      },
    });
    console.log(`   Crisis intervention for ${ss.firstName} ${ss.lastName}`);
  }

  for (const ms of moderateStudents) {
    await prisma.intervention.create({
      data: {
        counselorId: counselor.counselor.id,
        studentId: ms.student.id,
        title: "Academic Stress Management",
        description:
          "Weekly sessions to develop stress management techniques and improve study habits.",
        status: "IN_PROGRESS",
        createdAt: getRandomRecentDate(),
      },
    });
    console.log(`   Stress management for ${ms.firstName} ${ms.lastName}`);
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  const healthyCount = students.filter((s) => s._profile === "healthy").length;
  const mildCount = students.filter((s) => s._profile === "mild").length;
  const moderateCount = students.filter((s) => s._profile === "moderate").length;
  const severeCount = students.filter((s) => s._profile === "severe").length;

  console.log("\n✅ Seeding completed!");
  console.log(`   Sections:   ${sections.length}`);
  console.log(`   Admin:      1 (${admin.firstName} ${admin.lastName})`);
  console.log(`   Teachers:   ${teachers.length}`);
  console.log(`   Counselor:  1 (${counselor.firstName} ${counselor.lastName})`);
  console.log(`   Students:   ${students.length} total`);
  console.log(`     Green-zone   (healthy):  ${healthyCount}`);
  console.log(`     Yellow-zone  (mild):     ${mildCount}`);
  console.log(`     Yellow/Red   (moderate): ${moderateCount}`);
  console.log(`     Red-zone     (severe):   ${severeCount}`);
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
