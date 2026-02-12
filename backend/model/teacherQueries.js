const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { normalizeZoneName } = require("./surveyQueries");

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
const getMentalHealthTrends = async (params, teacherId, sectionId = null) => {
  try {
    const { period, startDate, endDate } = params;

    let studentFilter = {};
    if (sectionId) {
      const sectionStudents = await prisma.student.findMany({
        where: { sectionId },
        select: { id: true },
      });
      const studentIds = sectionStudents.map((s) => s.id);
      studentFilter = studentIds.length > 0 ? { studentId: { in: studentIds } } : { studentId: { in: [] } };
    }

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
        ...studentFilter,
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
        ...studentFilter,
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
 * @param {string} userId - User ID of teacher (for section-filtered analytics)
 * @returns {Object} Report data
 */
const generateMentalHealthReport = async (params, teacherId, userId = null) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { sectionId: true },
    });
    const sectionId = teacher?.sectionId || null;

    // First get the trends data (filtered by teacher's section if assigned)
    const trendsData = await getMentalHealthTrends(params, teacherId, sectionId);

    const period = params.startDate && params.endDate
      ? (() => {
          const days = Math.ceil((new Date(params.endDate) - new Date(params.startDate)) / (1000 * 60 * 60 * 24));
          if (days <= 35) return "1month";
          if (days <= 95) return "3months";
          if (days <= 185) return "6months";
          return "12months";
        })()
      : "1month";

    const analyticsData = userId && sectionId
      ? await getClassroomAnalytics(userId, period, {
          startDate: params.startDate,
          endDate: params.endDate,
        })
      : null;

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

    const recommendedActions = params.includeRecommendations !== false
      ? (analyticsData?.prescriptiveInsights?.length > 0
          ? analyticsData.prescriptiveInsights.map((i) => i.recommendation)
          : generateRecommendedActions(trendsData))
      : [];

    const reportData = {
      title: `Mental Health Trends Report - ${
        params.reportType.charAt(0).toUpperCase() + params.reportType.slice(1)
      }${analyticsData?.sectionName ? ` (${analyticsData.sectionName})` : ""}`,
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
        recommendedActions: recommendedActions.slice(0, 5),
      },
      charts: [
        { title: "Mood Trends Over Time", type: "line" },
        { title: "Top Issue Categories", type: "pie" },
        { title: "Time of Day Reporting", type: "bar" },
      ],
      trends: trendsData,
      descriptiveAnalysis: analyticsData ? {
        sectionName: analyticsData.sectionName,
        totalStudents: analyticsData.overallStats?.totalStudents,
        riskIndicators: analyticsData.riskIndicators,
        overallStats: analyticsData.overallStats,
        genderAnalytics: analyticsData.genderAnalytics,
        monthlyTrends: analyticsData.monthlyTrends,
      } : null,
      prescriptiveInsights: analyticsData?.prescriptiveInsights || [],
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

/**
 * Get students in the teacher's section (basic info only — no mental health data)
 */
const getSectionStudents = async (userId) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      select: { sectionId: true },
    });

    if (!teacher || !teacher.sectionId) {
      return [];
    }

    const students = await prisma.student.findMany({
      where: { sectionId: teacher.sectionId },
      select: {
        id: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            gender: true,
            status: true,
          },
        },
        emergencyContacts: {
          where: { isPrimary: true },
          take: 1,
          select: {
            name: true,
            phone: true,
            relationship: true,
          },
        },
      },
      orderBy: {
        user: { lastName: "asc" },
      },
    });

    return students.map((student) => ({
      id: student.id,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      email: student.user.email,
      phone: student.user.phone,
      avatar: student.user.avatar,
      gender: student.user.gender,
      status: student.user.status,
      emergencyContact: student.emergencyContacts[0] || null,
    }));
  } catch (error) {
    console.error("Error fetching section students:", error);
    throw error;
  }
};

/**
 * Get comprehensive classroom analytics for teacher's section
 * Returns descriptive and prescriptive analysis based on real student data
 * @param {string} userId - User ID of the teacher
 * @param {string} period - 1month, 3months, 6months, 12months
 * @param {Object} [options] - Optional { startDate, endDate } for custom date range
 */
const getClassroomAnalytics = async (userId, period, options = {}) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      select: { sectionId: true, section: { select: { id: true, name: true, gradeLevel: true } } },
    });

    if (!teacher || !teacher.sectionId) {
      return {
        genderAnalytics: [],
        sectionAnalytics: [],
        monthlyTrends: [],
        quarterlyTrends: [],
        riskIndicators: { highRisk: 0, moderateRisk: 0, lowRisk: 0, decliningMoodCount: 0, lowParticipationCount: 0, totalStudents: 0, activeInterventions: 0, completedInterventions: 0 },
        overallStats: { totalStudents: 0, overallAvgMood: null, overallAvgScore: null, overallParticipation: 0, assessmentStats: null },
        prescriptiveInsights: [],
        sectionName: null,
      };
    }

    const sectionId = teacher.sectionId;
    const section = teacher.section;
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    let periodStart;

    let periodEnd = now;
    if (options.startDate && options.endDate) {
      periodStart = new Date(options.startDate);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd = new Date(options.endDate);
      periodEnd.setHours(23, 59, 59, 999);
    } else {
      switch (period) {
        case "3months":
          periodStart = new Date(now);
          periodStart.setMonth(now.getMonth() - 3);
          break;
        case "6months":
          periodStart = new Date(now);
          periodStart.setMonth(now.getMonth() - 6);
          break;
        case "12months":
          periodStart = new Date(now);
          periodStart.setFullYear(now.getFullYear() - 1);
          break;
        default:
          periodStart = new Date(now);
          periodStart.setMonth(now.getMonth() - 1);
      }
    }
    periodStart.setHours(0, 0, 0, 0);
    const dateFilter = { createdAt: { gte: periodStart, lte: periodEnd } };

    const students = await prisma.student.findMany({
      where: { sectionId },
      select: {
        id: true,
        sectionId: true,
        user: { select: { gender: true, firstName: true, lastName: true } },
      },
    });

    const studentIds = students.map((s) => s.id);
    const studentById = {};
    students.forEach((s) => { studentById[s.id] = s; });

    const [surveyResponses, moodEntries, initialAssessments] = await Promise.all([
      prisma.surveyResponse.findMany({
        where: { studentId: { in: studentIds }, ...dateFilter },
        select: { id: true, zone: true, score: true, percentage: true, createdAt: true, studentId: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.moodEntry.findMany({
        where: { studentId: { in: studentIds }, ...dateFilter },
        select: { id: true, moodLevel: true, createdAt: true, studentId: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.initialAssessment.findMany({
        where: { studentId: { in: studentIds } },
        select: { studentId: true, anxietyScore: true, depressionScore: true, stressScore: true, totalScore: true },
      }),
    ]);

    // Gender analytics
    const genderGroups = {};
    students.forEach((s) => {
      const g = s.user.gender || "UNKNOWN";
      if (!genderGroups[g]) genderGroups[g] = { studentIds: [], label: g };
      genderGroups[g].studentIds.push(s.id);
    });

    const genderAnalytics = Object.entries(genderGroups).map(([gender, group]) => {
      const gSurveys = surveyResponses.filter((sr) => group.studentIds.includes(sr.studentId));
      const gMoods = moodEntries.filter((m) => group.studentIds.includes(m.studentId));
      const gAssessments = initialAssessments.filter((a) => group.studentIds.includes(a.studentId));
      const zones = { green: 0, yellow: 0, red: 0 };
      gSurveys.forEach((sr) => {
        const z = normalizeZoneName(sr.zone);
        if (z && z.startsWith("Green")) zones.green++;
        else if (z && z.startsWith("Yellow")) zones.yellow++;
        else if (z && z.startsWith("Red")) zones.red++;
      });
      const totalSurveys = zones.green + zones.yellow + zones.red;
      const avgMood = gMoods.length > 0 ? +(gMoods.reduce((sum, m) => sum + m.moodLevel, 0) / gMoods.length).toFixed(2) : null;
      const avgAnxiety = gAssessments.length > 0 ? +(gAssessments.reduce((s, a) => s + a.anxietyScore, 0) / gAssessments.length).toFixed(1) : null;
      const avgDepression = gAssessments.length > 0 ? +(gAssessments.reduce((s, a) => s + a.depressionScore, 0) / gAssessments.length).toFixed(1) : null;
      const avgStress = gAssessments.length > 0 ? +(gAssessments.reduce((s, a) => s + a.stressScore, 0) / gAssessments.length).toFixed(1) : null;
      return {
        gender: gender === "PREFER_NOT_TO_SAY" ? "Prefer Not To Say" : gender.charAt(0) + gender.slice(1).toLowerCase(),
        totalStudents: group.studentIds.length,
        zones,
        totalSurveys,
        avgMood,
        avgAnxiety,
        avgDepression,
        avgStress,
        redZonePercentage: totalSurveys > 0 ? +((zones.red / totalSurveys) * 100).toFixed(1) : 0,
      };
    });

    // Section analytics (single section for teacher)
    const sSurveys = surveyResponses.filter((sr) => studentIds.includes(sr.studentId));
    const sMoods = moodEntries.filter((m) => studentIds.includes(m.studentId));
    const sAssessments = initialAssessments.filter((a) => studentIds.includes(a.studentId));
    const zones = { green: 0, yellow: 0, red: 0 };
    sSurveys.forEach((sr) => {
      const z = normalizeZoneName(sr.zone);
      if (z && z.startsWith("Green")) zones.green++;
      else if (z && z.startsWith("Yellow")) zones.yellow++;
      else if (z && z.startsWith("Red")) zones.red++;
    });
    const totalSurveys = zones.green + zones.yellow + zones.red;
    const avgMood = sMoods.length > 0 ? +(sMoods.reduce((sum, m) => sum + m.moodLevel, 0) / sMoods.length).toFixed(2) : null;
    const studentsWithSurveys = new Set(sSurveys.map((sr) => sr.studentId)).size;
    const participationRate = students.length > 0 ? +((studentsWithSurveys / students.length) * 100).toFixed(1) : 0;
    const avgAnxiety = sAssessments.length > 0 ? +(sAssessments.reduce((s, a) => s + a.anxietyScore, 0) / sAssessments.length).toFixed(1) : null;
    const avgDepression = sAssessments.length > 0 ? +(sAssessments.reduce((s, a) => s + a.depressionScore, 0) / sAssessments.length).toFixed(1) : null;
    const avgStress = sAssessments.length > 0 ? +(sAssessments.reduce((s, a) => s + a.stressScore, 0) / sAssessments.length).toFixed(1) : null;

    const sectionAnalytics = [{
      sectionId: section.id,
      sectionName: section.name,
      gradeLevel: section.gradeLevel,
      totalStudents: students.length,
      zones,
      totalSurveys,
      avgMood,
      participationRate,
      avgAnxiety,
      avgDepression,
      avgStress,
    }];

    // Monthly trends
    const monthlyMap = {};
    surveyResponses.forEach((sr) => {
      const key = `${sr.createdAt.getFullYear()}-${String(sr.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap[key]) monthlyMap[key] = { green: 0, yellow: 0, red: 0, moodSum: 0, moodCount: 0 };
      const z = normalizeZoneName(sr.zone);
      if (z && z.startsWith("Green")) monthlyMap[key].green++;
      else if (z && z.startsWith("Yellow")) monthlyMap[key].yellow++;
      else if (z && z.startsWith("Red")) monthlyMap[key].red++;
    });
    moodEntries.forEach((m) => {
      const key = `${m.createdAt.getFullYear()}-${String(m.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap[key]) monthlyMap[key] = { green: 0, yellow: 0, red: 0, moodSum: 0, moodCount: 0 };
      monthlyMap[key].moodSum += m.moodLevel;
      monthlyMap[key].moodCount++;
    });
    const monthlyTrends = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        monthLabel: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        ...data,
        totalSurveys: data.green + data.yellow + data.red,
        avgMood: data.moodCount > 0 ? +(data.moodSum / data.moodCount).toFixed(2) : null,
        redPercentage: (data.green + data.yellow + data.red) > 0 ? +((data.red / (data.green + data.yellow + data.red)) * 100).toFixed(1) : 0,
      }));

    // Quarterly trends
    const quarterlyMap = {};
    surveyResponses.forEach((sr) => {
      const q = Math.ceil((sr.createdAt.getMonth() + 1) / 3);
      const key = `${sr.createdAt.getFullYear()}-Q${q}`;
      if (!quarterlyMap[key]) quarterlyMap[key] = { green: 0, yellow: 0, red: 0, moodSum: 0, moodCount: 0 };
      const z = normalizeZoneName(sr.zone);
      if (z && z.startsWith("Green")) quarterlyMap[key].green++;
      else if (z && z.startsWith("Yellow")) quarterlyMap[key].yellow++;
      else if (z && z.startsWith("Red")) quarterlyMap[key].red++;
    });
    moodEntries.forEach((m) => {
      const q = Math.ceil((m.createdAt.getMonth() + 1) / 3);
      const key = `${m.createdAt.getFullYear()}-Q${q}`;
      if (!quarterlyMap[key]) quarterlyMap[key] = { green: 0, yellow: 0, red: 0, moodSum: 0, moodCount: 0 };
      quarterlyMap[key].moodSum += m.moodLevel;
      quarterlyMap[key].moodCount++;
    });
    const quarterlyTrends = Object.entries(quarterlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([quarter, data]) => ({
        quarter,
        ...data,
        totalSurveys: data.green + data.yellow + data.red,
        avgMood: data.moodCount > 0 ? +(data.moodSum / data.moodCount).toFixed(2) : null,
        redPercentage: (data.green + data.yellow + data.red) > 0 ? +((data.red / (data.green + data.yellow + data.red)) * 100).toFixed(1) : 0,
      }));

    // Risk indicators
    const latestSurveyByStudent = {};
    surveyResponses.forEach((sr) => {
      if (!latestSurveyByStudent[sr.studentId] || sr.createdAt > latestSurveyByStudent[sr.studentId].createdAt) {
        latestSurveyByStudent[sr.studentId] = sr;
      }
    });
    let highRisk = 0, moderateRisk = 0, lowRisk = 0;
    Object.values(latestSurveyByStudent).forEach((sr) => {
      const z = normalizeZoneName(sr.zone);
      if (z && z.startsWith("Red")) highRisk++;
      else if (z && z.startsWith("Yellow")) moderateRisk++;
      else lowRisk++;
    });

    const sevenDaysAgo = new Date(periodEnd);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(periodEnd);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const decliningStudents = [];
    studentIds.forEach((sid) => {
      const recentMoods = moodEntries.filter((m) => m.studentId === sid && m.createdAt >= sevenDaysAgo);
      const previousMoods = moodEntries.filter((m) => m.studentId === sid && m.createdAt >= fourteenDaysAgo && m.createdAt < sevenDaysAgo);
      if (recentMoods.length >= 2 && previousMoods.length >= 2) {
        const recentAvg = recentMoods.reduce((s, m) => s + m.moodLevel, 0) / recentMoods.length;
        const prevAvg = previousMoods.reduce((s, m) => s + m.moodLevel, 0) / previousMoods.length;
        if (recentAvg < prevAvg - 0.5) decliningStudents.push(sid);
      }
    });

    const twoWeeksAgo = new Date(periodEnd);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const recentSurveyStudents = new Set(surveyResponses.filter((sr) => sr.createdAt >= twoWeeksAgo).map((sr) => sr.studentId));
    const lowParticipation = studentIds.filter((sid) => !recentSurveyStudents.has(sid));

    const riskIndicators = {
      highRisk,
      moderateRisk,
      lowRisk,
      decliningMoodCount: decliningStudents.length,
      lowParticipationCount: lowParticipation.length,
      totalStudents: students.length,
      activeInterventions: 0,
      completedInterventions: 0,
    };

    const totalSurveyResponses = surveyResponses.length;
    const totalMoodEntries = moodEntries.length;
    const overallAvgMood = moodEntries.length > 0 ? +(moodEntries.reduce((s, m) => s + m.moodLevel, 0) / moodEntries.length).toFixed(2) : null;
    const overallAvgScore = surveyResponses.length > 0 ? +(surveyResponses.reduce((s, sr) => s + sr.percentage, 0) / surveyResponses.length).toFixed(1) : null;
    const overallParticipation = students.length > 0 ? +((new Set(surveyResponses.map((sr) => sr.studentId)).size / students.length) * 100).toFixed(1) : 0;

    const assessmentStats = initialAssessments.length > 0 ? {
      avgAnxiety: +(initialAssessments.reduce((s, a) => s + a.anxietyScore, 0) / initialAssessments.length).toFixed(1),
      avgDepression: +(initialAssessments.reduce((s, a) => s + a.depressionScore, 0) / initialAssessments.length).toFixed(1),
      avgStress: +(initialAssessments.reduce((s, a) => s + a.stressScore, 0) / initialAssessments.length).toFixed(1),
      avgTotal: +(initialAssessments.reduce((s, a) => s + a.totalScore, 0) / initialAssessments.length).toFixed(1),
    } : null;

    // Prescriptive insights for teachers
    const insights = [];

    if (highRisk > 0) {
      const redStudentIds = Object.entries(latestSurveyByStudent)
        .filter(([, sr]) => normalizeZoneName(sr.zone)?.startsWith("Red"))
        .map(([sid]) => sid);
      const names = redStudentIds.map((sid) => studentById[sid]).filter(Boolean).map((s) => `${s.user.firstName} ${s.user.lastName}`).slice(0, 5);
      const more = redStudentIds.length > 5 ? ` and ${redStudentIds.length - 5} more` : "";
      insights.push({
        type: "critical",
        severity: "high",
        title: "Students Requiring Guidance Referral",
        description: `${highRisk} student(s) in your class are in the Red Zone: ${names.join(", ")}${more}. Their survey scores indicate they need professional support.`,
        recommendation: "Refer these students to the guidance counselor immediately. Document your observations and any concerns. As a teacher, you can offer classroom accommodations and a supportive environment, but professional counseling is essential for students in this zone.",
      });
    }

    const persistentlyLowMoodStudents = [];
    studentIds.forEach((sid) => {
      const recentMoods = moodEntries.filter((m) => m.studentId === sid && m.createdAt >= sevenDaysAgo);
      if (recentMoods.length >= 3) {
        const avg = recentMoods.reduce((s, m) => s + m.moodLevel, 0) / recentMoods.length;
        if (avg <= 2.0) persistentlyLowMoodStudents.push({ sid, avg: avg.toFixed(1) });
      }
    });
    if (persistentlyLowMoodStudents.length > 0) {
      const names = persistentlyLowMoodStudents.map((s) => studentById[s.sid]).filter(Boolean).map((s) => `${s.user.firstName} ${s.user.lastName}`).slice(0, 5);
      insights.push({
        type: "critical",
        severity: "high",
        title: "Persistently Low Mood in Class",
        description: `${persistentlyLowMoodStudents.length} student(s) have maintained average mood of 2.0 or below over the past 7 days (${names.join(", ")}${persistentlyLowMoodStudents.length > 5 ? " and more" : ""}).`,
        recommendation: "Reach out for a private, non-judgmental check-in. Share your observations with the guidance counselor. Consider whether academic pressure, peer relationships, or other factors may be contributing. Provide a safe space for expression in your classroom.",
      });
    }

    if (decliningStudents.length > 0) {
      const names = decliningStudents.map((sid) => studentById[sid]).filter(Boolean).map((s) => `${s.user.firstName} ${s.user.lastName}`).slice(0, 5);
      insights.push({
        type: "warning",
        severity: "medium",
        title: "Declining Mood Trends",
        description: `${decliningStudents.length} student(s) show declining mood over the past week (${names.join(", ")}${decliningStudents.length > 5 ? " and more" : ""}).`,
        recommendation: "Proactively check in with these students. Observe their engagement and behavior. Consider connecting with the guidance counselor to discuss support strategies. Small acts of kindness and acknowledgment can make a significant difference.",
      });
    }

    const yellowTrendingRed = [];
    Object.entries(latestSurveyByStudent).forEach(([sid, latestSr]) => {
      const z = normalizeZoneName(latestSr.zone);
      if (z && z.startsWith("Yellow")) {
        const studentSurveys = surveyResponses.filter((sr) => sr.studentId === sid).sort((a, b) => a.createdAt - b.createdAt);
        if (studentSurveys.length >= 3) {
          const lastThree = studentSurveys.slice(-3);
          const declining = lastThree.every((sr, i) => i === 0 || sr.percentage <= studentSurveys[studentSurveys.length - 3 + i - 1]?.percentage);
          if (declining && lastThree[lastThree.length - 1].percentage < 65) yellowTrendingRed.push(sid);
        }
      }
    });
    if (yellowTrendingRed.length > 0) {
      const names = yellowTrendingRed.map((sid) => studentById[sid]).filter(Boolean).map((s) => `${s.user.firstName} ${s.user.lastName}`).slice(0, 4);
      insights.push({
        type: "warning",
        severity: "high",
        title: "Students at Risk of Escalation",
        description: `${yellowTrendingRed.length} student(s) in Yellow Zone show declining survey scores (${names.join(", ")}${yellowTrendingRed.length > 4 ? " and more" : ""}).`,
        recommendation: "Monitor these students closely and encourage them to complete wellness check-ins. Consider referring them to the guidance counselor for preventive support. Foster a supportive classroom climate where asking for help is normalized.",
      });
    }

    if (lowParticipation.length > 0 && students.length > 0) {
      const pct = ((lowParticipation.length / students.length) * 100).toFixed(0);
      const names = lowParticipation.map((sid) => studentById[sid]).filter(Boolean).map((s) => `${s.user.firstName} ${s.user.lastName}`).slice(0, 5);
      insights.push({
        type: "info",
        severity: "low",
        title: "Low Survey Participation",
        description: `${lowParticipation.length} student(s) (${pct}%) have not completed a survey in the past 2 weeks (${names.join(", ")}${lowParticipation.length > 5 ? " and more" : ""}).`,
        recommendation: "Encourage participation during homeroom or advisory. Explain the purpose and confidentiality of wellness check-ins. Non-participation may indicate avoidance — approach with curiosity rather than pressure.",
      });
    }

    const maleStats = genderAnalytics.find((g) => g.gender === "Male");
    const femaleStats = genderAnalytics.find((g) => g.gender === "Female");
    if (maleStats && femaleStats && maleStats.avgMood && femaleStats.avgMood) {
      const diff = Math.abs(maleStats.avgMood - femaleStats.avgMood);
      if (diff >= 0.5) {
        const lowerGender = maleStats.avgMood < femaleStats.avgMood ? "Male" : "Female";
        const lowerMood = lowerGender === "Male" ? maleStats.avgMood : femaleStats.avgMood;
        const lowerRed = lowerGender === "Male" ? maleStats.redZonePercentage : femaleStats.redZonePercentage;
        insights.push({
          type: "analysis",
          severity: "medium",
          title: "Gender-Based Mental Health Variation",
          description: `${lowerGender} students show lower average mood (${lowerMood}/5) with ${lowerRed}% Red Zone rate.`,
          recommendation: `Create inclusive support approaches for ${lowerGender} students. Consider gender-specific discussions or activities that normalize emotional expression. Collaborate with the guidance counselor on targeted support.`,
        });
      }
    }

    if (monthlyTrends.length >= 2) {
      const latest = monthlyTrends[monthlyTrends.length - 1];
      const previous = monthlyTrends[monthlyTrends.length - 2];
      if (latest.redPercentage > previous.redPercentage + 5) {
        insights.push({
          type: "warning",
          severity: "high",
          title: "Increasing Red Zone Trend",
          description: `Red Zone percentage increased from ${previous.redPercentage}% in ${previous.monthLabel} to ${latest.redPercentage}% in ${latest.monthLabel}.`,
          recommendation: "Investigate potential triggers (exams, seasonal factors). Implement classroom mindfulness or stress-management moments. Increase communication with the guidance counselor to coordinate support.",
        });
      } else if (latest.redPercentage < previous.redPercentage - 5) {
        insights.push({
          type: "positive",
          severity: "low",
          title: "Improving Mental Health Trends",
          description: `Red Zone percentage decreased from ${previous.redPercentage}% to ${latest.redPercentage}% in ${latest.monthLabel}.`,
          recommendation: "Continue current supportive practices. Document what may have contributed to improvement. Maintain regular check-ins with the guidance counselor.",
        });
      }
      if (latest.avgMood && previous.avgMood && (latest.avgMood - previous.avgMood) <= -0.3) {
        insights.push({
          type: "warning",
          severity: "medium",
          title: "Overall Mood Decline",
          description: `Average mood dropped from ${previous.avgMood}/5 in ${previous.monthLabel} to ${latest.avgMood}/5 in ${latest.monthLabel}.`,
          recommendation: "Assess external factors. Consider wellness activities, brief mindfulness exercises, or connecting with the guidance counselor for class-wide support strategies.",
        });
      }
    }

    if (overallAvgMood && overallAvgMood >= 3.5 && highRisk === 0) {
      insights.push({
        type: "positive",
        severity: "low",
        title: "Overall Positive Class Climate",
        description: `Average mood is ${overallAvgMood}/5 with no students in Red Zone. ${overallParticipation >= 80 ? "Participation is strong at " + overallParticipation + "%." : ""}`,
        recommendation: "Maintain supportive practices. Use this period to strengthen classroom community and build resilience. Continue regular check-ins.",
      });
    }

    if (overallParticipation >= 85) {
      insights.push({
        type: "positive",
        severity: "low",
        title: "Strong Student Engagement",
        description: `${overallParticipation}% of students have completed at least one survey. Data is representative.`,
        recommendation: "Acknowledge student participation. Continue fostering trust and transparency about how wellness data supports student welfare.",
      });
    }

    if (initialAssessments.length > 0) {
      const highAnxiety = initialAssessments.filter((a) => a.anxietyScore > 15);
      const highDepression = initialAssessments.filter((a) => a.depressionScore > 14);
      if (highAnxiety.length > 0) {
        const pct = ((highAnxiety.length / initialAssessments.length) * 100).toFixed(0);
        insights.push({
          type: "warning",
          severity: "high",
          title: "Elevated Anxiety (DASS-21)",
          description: `${highAnxiety.length} student(s) (${pct}%) scored in severe anxiety range on initial assessment.`,
          recommendation: "Share this with the guidance counselor. Create a low-pressure classroom environment. Consider accommodations for anxiety triggers (e.g., flexible deadlines, quiet spaces).",
        });
      }
      if (highDepression.length > 0) {
        const pct = ((highDepression.length / initialAssessments.length) * 100).toFixed(0);
        insights.push({
          type: "critical",
          severity: "high",
          title: "Elevated Depression (DASS-21)",
          description: `${highDepression.length} student(s) (${pct}%) scored in severe depression range.`,
          recommendation: "Ensure these students are connected with the guidance counselor. Monitor for withdrawal, academic decline, changes in behavior. Provide a supportive, non-judgmental presence.",
        });
      }
    }

    if (students.length > 0 && surveyResponses.length === 0 && moodEntries.length === 0) {
      insights.push({
        type: "info",
        severity: "low",
        title: "No Wellness Data Yet",
        description: "No survey or mood data has been recorded for your class in this period.",
        recommendation: "Encourage students to participate in wellness check-ins and mood tracking. Explain the purpose and confidentiality. Integrate brief check-ins into your classroom routine.",
      });
    }

    return {
      genderAnalytics,
      sectionAnalytics,
      monthlyTrends,
      quarterlyTrends,
      riskIndicators,
      overallStats: {
        totalStudents: students.length,
        totalSurveyResponses,
        totalMoodEntries,
        overallAvgMood,
        overallAvgScore,
        overallParticipation,
        assessmentStats,
      },
      prescriptiveInsights: insights,
      sectionName: section.name,
      period: { start: periodStart.toISOString(), end: periodEnd.toISOString() },
    };
  } catch (error) {
    console.error("Error in getClassroomAnalytics:", error);
    throw error;
  }
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
  getSectionStudents,
  getClassroomAnalytics,
};
