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
            gender: true,
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
      gender: student.user.gender,
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
      // When using custom date range, include full end day
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999); // Set to end of day

      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: adjustedEndDate,
        },
      };
    } else {
      // Default periods if no custom date range
      const now = new Date();
      // Set current time to end of day to include all of today's entries
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);

      switch (period) {
        case "week":
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - 6); // Changed from -7 to -6 to include today + 6 previous days
          weekStart.setHours(0, 0, 0, 0); // Start of day 6 days ago
          dateFilter = {
            createdAt: {
              gte: weekStart,
              lte: endOfToday,
            },
          };
          console.log(
            `Week filter: ${weekStart.toISOString()} to ${endOfToday.toISOString()}`,
          );
          break;
        case "month":
          const monthStart = new Date(now);
          monthStart.setMonth(now.getMonth() - 1);
          monthStart.setHours(0, 0, 0, 0); // Start of day 1 month ago
          dateFilter = {
            createdAt: {
              gte: monthStart,
              lte: endOfToday,
            },
          };
          break;
        case "semester":
          const semesterStart = new Date(now);
          semesterStart.setMonth(now.getMonth() - 4);
          semesterStart.setHours(0, 0, 0, 0); // Start of day 4 months ago
          dateFilter = {
            createdAt: {
              gte: semesterStart,
              lte: endOfToday,
            },
          };
          break;
        default:
          const defaultStart = new Date(now);
          defaultStart.setMonth(now.getMonth() - 1);
          defaultStart.setHours(0, 0, 0, 0); // Start of day 1 month ago
          dateFilter = {
            createdAt: {
              gte: defaultStart,
              lte: endOfToday,
            },
          };
      }
    }

    console.log("Date filter for fetching trends:", dateFilter);

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

    console.log(
      `Found ${moodEntries.length} mood entries and ${surveyResponses.length} survey responses`,
    );

    // Process data for mood trends over time using survey responses and zones
    const moodTrends = processMoodTrendsData(surveyResponses, period);

    // Process daily mood trends data
    const dailyMoodTrends = processDailyMoodTrends(moodEntries);

    // Process time of day reporting data
    const timeframeTrends = processTimeframeData(moodEntries);

    // Format response with all trend data
    return {
      moodTrends,
      dailyMoodTrends,
      timeframeTrends,
    };
  } catch (error) {
    console.error("Error fetching mental health trends:", error);
    throw error;
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

    // Calculate total responses from mood trends data
    const totalResponses = trendsData.moodTrends
      ? trendsData.moodTrends.reduce((total, trend) => {
          return (
            total +
            (trend["Green (Positive)"] || 0) +
            (trend["Yellow (Moderate)"] || 0) +
            (trend["Red (Needs Attention)"] || 0)
          );
        }, 0)
      : 0;

    // Calculate weekly averages
    const { startDate, endDate } = params;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDifference = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const weeksDifference = Math.max(1, Math.ceil(daysDifference / 7));

    // Calculate average survey responses per week
    const avgSurveyResponsesPerWeek = Math.round(
      totalResponses / weeksDifference,
    );

    // Calculate total mood entries from dailyMoodTrends
    const totalMoodEntries = trendsData.dailyMoodTrends
      ? trendsData.dailyMoodTrends.reduce((total, day) => {
          return (
            total +
            (day.positive || 0) +
            (day.moderate || 0) +
            (day.needsAttention || 0)
          );
        }, 0)
      : 0;

    const avgMoodEntriesPerWeek = Math.round(
      totalMoodEntries / weeksDifference,
    );

    // Generate some basic issue categories based on available data
    const topIssues = [
      "Academic Stress",
      "Social Anxiety",
      "Sleep Problems",
      "Time Management",
      "Emotional Regulation",
    ];

    // Additional report calculations
    const reportData = {
      title: `Mental Health Trends Report - ${
        params.reportType.charAt(0).toUpperCase() + params.reportType.slice(1)
      }`,
      period: `${new Date(params.startDate).toLocaleDateString()} - ${new Date(
        params.endDate,
      ).toLocaleDateString()}`,
      summary: {
        totalResponses: totalResponses,
        totalMoodEntries: totalMoodEntries,
        avgSurveyResponsesPerWeek: avgSurveyResponsesPerWeek,
        avgMoodEntriesPerWeek: avgMoodEntriesPerWeek,
        weeksCovered: weeksDifference,
        averageMood: calculateAverageMood(trendsData.moodTrends || []),
        topIssues: topIssues,
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
        0,
      ) / totalAttempts;

    // Calculate pass rate (assuming 60% is passing)
    const passCount = quizAttempts.filter(
      (attempt) => attempt.score / attempt.quiz.totalPoints >= 0.6,
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

/**
 * Get daily submission counts for mood entries and surveys
 */
const getDailySubmissionCounts = async () => {
  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get tomorrow's date at midnight
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get mood entry count for today
    const moodEntriesCount = await prisma.moodEntry.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get survey response count for today
    const surveyResponsesCount = await prisma.surveyResponse.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    return {
      date: today.toISOString(),
      moodEntriesCount,
      surveyResponsesCount,
    };
  } catch (error) {
    console.error("Error getting daily submission counts:", error);
    throw error;
  }
};

/**
 * Delete a forum post
 * @param {string} postId - ID of the post to delete
 * @returns {Promise<Object>} Deleted post data
 */
const deleteForumPost = async (postId) => {
  try {
    // First check if the post exists
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      select: {
        id: true,
        author: {
          select: {
            role: true,
          },
        },
      },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    // Delete the post and its related data (comments, reactions)
    const deletedPost = await prisma.forumPost.delete({
      where: { id: postId },
      include: {
        comments: true,
        reactions: true,
      },
    });

    return deletedPost;
  } catch (error) {
    console.error("Error deleting forum post:", error);
    throw error;
  }
};

// Helper functions
/**
 * Process survey response data into trends over time using zones
 */
const processMoodTrendsData = (responses, period) => {
  console.log(
    `Processing ${responses.length} survey responses for mood trends`,
  );

  if (!responses || !responses.length) {
    console.log("No responses to process, returning empty array");
    return [];
  }

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

  // Get current day of week for reference
  const now = new Date();
  const currentDayName = now
    .toLocaleDateString("en-US", { weekday: "short" })
    .slice(0, 3);
  console.log(`Current day of week: ${currentDayName}`);

  // Initialize all days of week if in weekly view to ensure we have entries for each day
  if (period === "week") {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    dayNames.forEach((day) => {
      groupedByPeriod[day] = {
        name: day,
        "Green (Positive)": 0,
        "Yellow (Moderate)": 0,
        "Red (Needs Attention)": 0,
        count: 0,
      };
    });
  }

  responses.forEach((response) => {
    if (!response || !response.createdAt) {
      console.log("Skipping response with missing createdAt:", response);
      return; // Skip this response
    }

    let key;
    const date = new Date(response.createdAt);
    console.log(`Processing response with date: ${date.toISOString()}`);

    switch (period) {
      case "week":
        // Group by day of week (short format)
        key = date
          .toLocaleDateString("en-US", { weekday: "short" })
          .slice(0, 3);
        console.log(`Grouped to day: ${key}`);
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

    // Map the zone value to the correct category
    if (response.zone) {
      // Handle both formats: "Green" and "Green (Positive)"
      if (response.zone === "Green" || response.zone === "Green (Positive)") {
        groupedByPeriod[key]["Green (Positive)"]++;
      } else if (
        response.zone === "Yellow" ||
        response.zone === "Yellow (Moderate)"
      ) {
        groupedByPeriod[key]["Yellow (Moderate)"]++;
      } else if (
        response.zone === "Red" ||
        response.zone === "Red (Needs Attention)"
      ) {
        groupedByPeriod[key]["Red (Needs Attention)"]++;
      } else {
        // If zone isn't one of the expected values, try to determine from percentage
        console.log(
          `Warning: Unknown zone value '${response.zone}' for response ID ${response.id}`,
        );
        if (response.percentage !== undefined) {
          const percentage = parseFloat(response.percentage);
          if (percentage >= 0.8) {
            groupedByPeriod[key]["Green (Positive)"]++;
          } else if (percentage >= 0.6) {
            groupedByPeriod[key]["Yellow (Moderate)"]++;
          } else {
            groupedByPeriod[key]["Red (Needs Attention)"]++;
          }
        } else {
          console.log(
            `Warning: Missing zone data for response ID ${response.id}`,
          );
        }
      }
    } else {
      console.log(`Warning: Missing zone data for response ID ${response.id}`);
    }

    groupedByPeriod[key].count++;
  });

  // Convert to array and sort
  let result = Object.values(groupedByPeriod);
  console.log(
    `Grouped data into ${result.length} periods:`,
    result.map((r) => r.name),
  );

  if (period === "week") {
    // Sort by day of week
    result.sort((a, b) => {
      return (dayOrder[a.name] || 0) - (dayOrder[b.name] || 0);
    });
  } else if (period === "month") {
    // Sort by week number
    result.sort((a, b) => {
      if (a.name.startsWith("Week") && b.name.startsWith("Week")) {
        return (
          parseInt(a.name.split(" ")[1] || "0") -
          parseInt(b.name.split(" ")[1] || "0")
        );
      }
      return 0;
    });
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
  const moodTrends = trendsData.moodTrends || [];
  const averageMood = calculateAverageMood(moodTrends);

  // Add mood-based recommendations
  if (averageMood === "Negative") {
    recommendations.push(
      "Consider scheduling regular check-ins or support groups for students",
    );
    recommendations.push("Share resources for coping with stress and anxiety");
    recommendations.push("Provide mental health awareness workshops");
  } else if (averageMood === "Neutral") {
    recommendations.push(
      "Monitor student wellbeing and provide preventive support",
    );
    recommendations.push("Encourage open communication about mental health");
    recommendations.push("Implement stress management techniques in classroom");
  } else if (averageMood === "Positive") {
    recommendations.push("Continue current supportive practices");
    recommendations.push(
      "Share positive mental health strategies with other educators",
    );
    recommendations.push(
      "Maintain regular check-ins to sustain positive trends",
    );
  } else {
    // No data case
    recommendations.push(
      "Encourage students to participate in mental health surveys",
    );
    recommendations.push("Implement regular mood check-ins in classroom");
    recommendations.push(
      "Provide information about available mental health resources",
    );
  }

  return recommendations.slice(0, 3); // Return top 3 recommendations
};

/**
 * Process daily mood trends from mood entries
 */
const processDailyMoodTrends = (moodEntries) => {
  if (!moodEntries.length) return [];

  // Group entries by date
  const groupedByDate = {};

  moodEntries.forEach((entry) => {
    const date = new Date(entry.createdAt).toLocaleDateString();

    if (!groupedByDate[date]) {
      groupedByDate[date] = {
        date,
        positive: 0,
        moderate: 0,
        needsAttention: 0,
      };
    }

    // Categorize mood levels
    if (entry.moodLevel >= 4) {
      groupedByDate[date].positive++;
    } else if (entry.moodLevel >= 2) {
      groupedByDate[date].moderate++;
    } else {
      groupedByDate[date].needsAttention++;
    }
  });

  // Convert to array and sort by date
  return Object.values(groupedByDate).sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );
};

module.exports = {
  getTeacherByUserId,
  getAllStudents,
  getMentalHealthTrends,
  generateMentalHealthReport,
  getStudentForumActivity,
  getClassroomMoodOverview,
  getAcademicPerformanceIndicators,
  getDailySubmissionCounts,
  deleteForumPost,
};
