const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Get teacher by user ID
 */
const getTeacherByUserId = async (userId) => {
  try {
    return await prisma.teacher.findFirst({
      where: {
        userId,
      },
    });
  } catch (error) {
    console.error("Error finding teacher:", error);
    throw error;
  }
};

/**
 * Get all students for teacher view
 */
const getAllStudents = async () => {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        user: {
          lastName: "asc",
        },
      },
    });

    // Format the student data
    return students.map((student) => ({
      id: student.id,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      email: student.user.email,
      avatar: student.user.avatar,
    }));
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
};

/**
 * Get mental health trends based on student surveys
 * @param {Object} params - Query parameters
 * @param {string} params.period - Time period ('week', 'month', 'semester')
 * @param {Date} [params.startDate] - Start date for custom range
 * @param {Date} [params.endDate] - End date for custom range
 * @param {string} teacherId - Teacher ID for filtering
 * @returns {Object} Aggregated trend data
 */
const getMentalHealthTrends = async (params, teacherId) => {
  try {
    const { period, startDate, endDate } = params;

    // Calculate date range based on period or custom dates
    let dateFilter = {};

    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    } else {
      // Default periods if no custom date range
      const now = new Date();

      switch (period) {
        case "week":
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - 7);
          dateFilter = {
            createdAt: {
              gte: weekStart,
            },
          };
          break;
        case "month":
          const monthStart = new Date(now);
          monthStart.setMonth(now.getMonth() - 1);
          dateFilter = {
            createdAt: {
              gte: monthStart,
            },
          };
          break;
        case "semester":
          const semesterStart = new Date(now);
          semesterStart.setMonth(now.getMonth() - 4);
          dateFilter = {
            createdAt: {
              gte: semesterStart,
            },
          };
          break;
        default:
          const defaultStart = new Date(now);
          defaultStart.setMonth(now.getMonth() - 1);
          dateFilter = {
            createdAt: {
              gte: defaultStart,
            },
          };
      }
    }

    // Fetch mood entry data for time of day reporting
    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        ...dateFilter,
      },
      select: {
        id: true,
        moodLevel: true,
        notes: true,
        createdAt: true,
        student: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Fetch survey responses for additional data
    const surveyResponses = await prisma.surveyResponse.findMany({
      where: {
        ...dateFilter,
      },
      select: {
        id: true,
        answers: true,
        score: true,
        zone: true,
        createdAt: true,
        phDate: true,
        student: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Process data for mood trends over time using survey responses and zones
    const moodTrends = processMoodTrendsData(surveyResponses, period);

    // Process data for issue categories using survey responses
    const issueCategories = processIssueCategories(surveyResponses);

    // Process data for time of day reporting
    const timeframeTrends = processTimeframeData(moodEntries);

    return {
      moodTrends,
      issueCategories,
      timeframeTrends,
      totalResponses: moodEntries.length + surveyResponses.length,
    };
  } catch (error) {
    console.error("Error fetching mental health trends:", error);
    throw new Error("Failed to fetch mental health trends data");
  }
};

/**
 * Generate mental health report
 * @param {Object} params - Report parameters
 * @param {string} teacherId - Teacher ID
 * @returns {Object} Report data
 */
const generateMentalHealthReport = async (params, teacherId) => {
  try {
    // First get the trends data using the same query
    const trendsData = await getMentalHealthTrends(params, teacherId);

    // Additional report calculations
    const reportData = {
      title: `Mental Health Trends Report - ${
        params.reportType.charAt(0).toUpperCase() + params.reportType.slice(1)
      }`,
      period: `${new Date(params.startDate).toLocaleDateString()} - ${new Date(
        params.endDate
      ).toLocaleDateString()}`,
      summary: {
        totalResponses: trendsData.totalResponses,
        averageMood: calculateAverageMood(trendsData.moodTrends),
        topIssues: trendsData.issueCategories.map((category) => category.name),
        recommendedActions: generateRecommendedActions(trendsData),
      },
      charts: [
        { title: "Mood Trends Over Time", type: "line" },
        { title: "Top Issue Categories", type: "pie" },
        { title: "Time of Day Reporting", type: "bar" },
      ],
      // Include the trends data as well
      trends: trendsData,
    };

    return reportData;
  } catch (error) {
    console.error("Error generating mental health report:", error);
    throw new Error("Failed to generate mental health report");
  }
};

/**
 * Get student forum activity
 */
const getStudentForumActivity = async (teacherId) => {
  try {
    // Get posts by students
    const posts = await prisma.forumPost.findMany({
      where: {
        author: {
          role: "STUDENT",
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return posts;
  } catch (error) {
    console.error("Error fetching student forum activity:", error);
    throw error;
  }
};

/**
 * Get classroom mood overview
 */
const getClassroomMoodOverview = async (period = "week") => {
  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate;

    switch (period) {
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    }

    // Get mood entries for the period
    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        moodLevel: true,
        createdAt: true,
        student: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Get survey responses for the period
    const surveyResponses = await prisma.surveyResponse.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        zone: true,
        createdAt: true,
      },
    });

    // Calculate mood distribution
    const moodDistribution = {
      positive: 0,
      neutral: 0,
      negative: 0,
    };

    moodEntries.forEach((entry) => {
      if (entry.moodLevel >= 4) moodDistribution.positive++;
      else if (entry.moodLevel >= 2) moodDistribution.neutral++;
      else moodDistribution.negative++;
    });

    // Calculate zone distribution
    const zoneDistribution = {
      "Green (Positive)": 0,
      "Yellow (Moderate)": 0,
      "Red (Needs Attention)": 0,
    };

    surveyResponses.forEach((response) => {
      if (response.zone in zoneDistribution) {
        zoneDistribution[response.zone]++;
      }
    });

    return {
      period,
      moodDistribution,
      zoneDistribution,
      totalMoodEntries: moodEntries.length,
      totalSurveyResponses: surveyResponses.length,
    };
  } catch (error) {
    console.error("Error fetching classroom mood overview:", error);
    throw error;
  }
};

/**
 * Get student academic performance indicators
 */
const getAcademicPerformanceIndicators = async (teacherId) => {
  try {
    // Get quiz attempts
    const quizAttempts = await prisma.quizAttempt.findMany({
      select: {
        score: true,
        student: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        quiz: {
          select: {
            title: true,
            totalPoints: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate average scores
    const totalAttempts = quizAttempts.length;
    if (totalAttempts === 0) {
      return {
        averageScore: 0,
        passRate: 0,
        totalAttempts: 0,
        recentAttempts: [],
      };
    }

    const averageScore =
      quizAttempts.reduce(
        (sum, attempt) =>
          sum + (attempt.score / attempt.quiz.totalPoints) * 100,
        0
      ) / totalAttempts;

    // Calculate pass rate (assuming 60% is passing)
    const passCount = quizAttempts.filter(
      (attempt) => attempt.score / attempt.quiz.totalPoints >= 0.6
    ).length;

    const passRate = (passCount / totalAttempts) * 100;

    // Format recent attempts
    const recentAttempts = quizAttempts.slice(0, 10).map((attempt) => ({
      student: `${attempt.student.user.firstName} ${attempt.student.user.lastName}`,
      quiz: attempt.quiz.title,
      score: attempt.score,
      totalPoints: attempt.quiz.totalPoints,
      percentage: ((attempt.score / attempt.quiz.totalPoints) * 100).toFixed(1),
    }));

    return {
      averageScore,
      passRate,
      totalAttempts,
      recentAttempts,
    };
  } catch (error) {
    console.error("Error fetching academic performance indicators:", error);
    throw error;
  }
};

// Helper functions
/**
 * Process survey response data into trends over time using zones
 */
const processMoodTrendsData = (responses, period) => {
  if (!responses.length) return [];

  // Group by time period
  const groupedByPeriod = {};

  // For sorting days of the week properly
  const dayOrder = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };

  responses.forEach((response) => {
    let key;
    const date = new Date(response.createdAt);

    switch (period) {
      case "week":
        // Group by day of week (short format)
        key = date
          .toLocaleDateString("en-US", { weekday: "short" })
          .slice(0, 3);
        break;
      case "month":
        // Group by week
        const weekNum = Math.ceil(date.getDate() / 7);
        key = `Week ${weekNum}`;
        break;
      case "semester":
        // Group by month
        key = date.toLocaleDateString("en-US", { month: "short" });
        break;
      default:
        // Default to grouping by week
        const defaultWeekNum = Math.ceil(date.getDate() / 7);
        key = `Week ${defaultWeekNum}`;
    }

    if (!groupedByPeriod[key]) {
      groupedByPeriod[key] = {
        name: key,
        "Green (Positive)": 0,
        "Yellow (Moderate)": 0,
        "Red (Needs Attention)": 0,
        count: 0,
      };
    }

    // Use the zone data directly from the response
    if (response.zone) {
      groupedByPeriod[key][response.zone]++;
    }

    groupedByPeriod[key].count++;
  });

  // Convert to array and sort
  let result = Object.values(groupedByPeriod);

  if (period === "week") {
    // Sort by day of week
    result.sort((a, b) => {
      return dayOrder[a.name] - dayOrder[b.name];
    });
  } else if (period === "month") {
    // Sort by week number
    result.sort((a, b) => {
      if (a.name.startsWith("Week") && b.name.startsWith("Week")) {
        return parseInt(a.name.split(" ")[1]) - parseInt(b.name.split(" ")[1]);
      }
      return 0;
    });
  } else if (period === "semester") {
    // Sort by month (not implemented yet, would need a month order mapping)
    // Default sorting is fine for now
  }

  return result;
};

/**
 * Process issue categories from survey responses
 */
const processIssueCategories = (responses) => {
  if (!responses.length) return [];

  const categories = {
    "Academic Stress": { name: "Academic Stress", value: 0 },
    "Social Anxiety": { name: "Social Anxiety", value: 0 },
    "Family Problems": { name: "Family Problems", value: 0 },
    "Sleep Issues": { name: "Sleep Issues", value: 0 },
    "Future Concerns": { name: "Future Concerns", value: 0 },
    Other: { name: "Other", value: 0 },
  };

  // Analyze survey responses to extract common issues
  responses.forEach((response) => {
    try {
      const answers =
        typeof response.answers === "string"
          ? JSON.parse(response.answers)
          : response.answers;

      // Logic to categorize responses into issue categories
      // This will depend on your survey structure
      if (answers) {
        if (answers.stress_level > 3) categories["Academic Stress"].value++;
        if (answers.social_anxiety > 3) categories["Social Anxiety"].value++;
        if (answers.family_issues) categories["Family Problems"].value++;
        if (answers.sleep_problems) categories["Sleep Issues"].value++;
        if (answers.future_worries) categories["Future Concerns"].value++;

        // Default increment if no specific categories matched
        if (response.zone === "Red" || response.zone === "Yellow") {
          categories["Other"].value++;
        }
      }
    } catch (error) {
      console.error("Error processing survey response:", error);
      // Increment "Other" category if we couldn't parse the response
      categories["Other"].value++;
    }
  });

  // Convert to array and sort by count, filter out zeros
  return Object.values(categories)
    .filter((cat) => cat.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Return top 5 categories
};

/**
 * Process time of day reporting data
 */
const processTimeframeData = (entries) => {
  if (!entries.length) return [];

  const timeframes = {
    Morning: { name: "Morning", value: 0 },
    Afternoon: { name: "Afternoon", value: 0 },
    Evening: { name: "Evening", value: 0 },
  };

  entries.forEach((entry) => {
    const hour = new Date(entry.createdAt).getHours();

    if (hour >= 5 && hour < 12) {
      timeframes.Morning.value++;
    } else if (hour >= 12 && hour < 18) {
      timeframes.Afternoon.value++;
    } else {
      timeframes.Evening.value++;
    }
  });

  return Object.values(timeframes);
};

/**
 * Calculate the average mood from trends data
 */
const calculateAverageMood = (moodTrends) => {
  if (!moodTrends.length) return "No Data";

  let totalGreen = 0;
  let totalYellow = 0;
  let totalRed = 0;

  moodTrends.forEach((period) => {
    totalGreen += period["Green (Positive)"];
    totalYellow += period["Yellow (Moderate)"];
    totalRed += period["Red (Needs Attention)"];
  });

  const total = totalGreen + totalYellow + totalRed;

  if (total === 0) return "No Data";

  const weightedScore =
    (totalGreen * 3 + totalYellow * 2 + totalRed * 1) / total;

  if (weightedScore >= 2.5) return "Positive";
  if (weightedScore >= 1.5) return "Neutral";
  return "Negative";
};

/**
 * Generate recommended actions based on trends data
 */
const generateRecommendedActions = (trendsData) => {
  const recommendations = [];

  // Get the predominant mood
  const moodTrends = trendsData.moodTrends;
  const averageMood = calculateAverageMood(moodTrends);

  // Get the top issue
  const topIssues = trendsData.issueCategories;
  const topIssue = topIssues.length > 0 ? topIssues[0].name : null;

  // Add mood-based recommendations
  if (averageMood === "Negative") {
    recommendations.push(
      "Consider scheduling regular check-ins or support groups for students"
    );
    recommendations.push("Share resources for coping with stress and anxiety");
  }

  // Add issue-based recommendations
  if (topIssue) {
    switch (topIssue) {
      case "Academic Stress":
        recommendations.push(
          "Consider reviewing homework load and assignment deadlines"
        );
        recommendations.push("Provide study skills workshops or resources");
        break;
      case "Social Anxiety":
        recommendations.push("Create more structured small-group activities");
        recommendations.push(
          "Consider team-building exercises to build classroom community"
        );
        break;
      case "Family Problems":
        recommendations.push("Share resources for family counseling services");
        recommendations.push(
          "Ensure students know how to access the school counselor"
        );
        break;
      case "Sleep Issues":
        recommendations.push("Educate students about sleep hygiene");
        recommendations.push(
          "Consider discussing the impact of screen time on sleep"
        );
        break;
      case "Future Concerns":
        recommendations.push("Provide career counseling resources");
        recommendations.push("Discuss stress management techniques");
        break;
    }
  }

  return recommendations.slice(0, 3); // Return top 3 recommendations
};

module.exports = {
  getTeacherByUserId,
  getAllStudents,
  getMentalHealthTrends,
  generateMentalHealthReport,
  getStudentForumActivity,
  getClassroomMoodOverview,
  getAcademicPerformanceIndicators,
};
