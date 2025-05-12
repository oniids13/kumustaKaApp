const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Get aggregated mental health trends based on student surveys
 * @param {Object} params - Query parameters
 * @param {string} params.period - Time period ('week', 'month', 'semester')
 * @param {Date} [params.startDate] - Start date for custom range
 * @param {Date} [params.endDate] - End date for custom range
 * @param {string} teacherId - Teacher ID for filtering by class/section
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

    // Since there's no direct relationship between teachers and students in the schema,
    // we'll aggregate data across all students for now.
    // You might want to modify this if you add a class/section relationship later.

    // Fetch mood entry data
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

    // Process data for mood trends over time using mood entries
    const moodTrends = processMoodTrendsData(moodEntries, period);

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
 * Process mood entry data into trends over time
 */
const processMoodTrendsData = (entries, period) => {
  if (!entries.length) return [];

  // Group by time period
  const groupedByPeriod = {};

  entries.forEach((entry) => {
    let key;
    const date = new Date(entry.createdAt);

    switch (period) {
      case "week":
        // Group by day of week
        key = date.toLocaleDateString("en-US", { weekday: "short" });
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
        happy: 0,
        neutral: 0,
        sad: 0,
        anxious: 0,
        count: 0,
      };
    }

    // Map mood levels to categories
    // Assuming mood levels: 5=very happy, 4=happy, 3=neutral, 2=sad, 1=very sad/anxious
    if (entry.moodLevel >= 4) {
      groupedByPeriod[key].happy++;
    } else if (entry.moodLevel === 3) {
      groupedByPeriod[key].neutral++;
    } else if (entry.moodLevel === 2) {
      groupedByPeriod[key].sad++;
    } else {
      groupedByPeriod[key].anxious++;
    }

    groupedByPeriod[key].count++;
  });

  // Convert to array and sort
  return Object.values(groupedByPeriod).sort((a, b) => {
    // Sort by week number if applicable
    if (a.name.startsWith("Week") && b.name.startsWith("Week")) {
      return parseInt(a.name.split(" ")[1]) - parseInt(b.name.split(" ")[1]);
    }
    return 0;
  });
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
 * Calculate the average mood from trends data
 */
const calculateAverageMood = (moodTrends) => {
  if (!moodTrends.length) return "No Data";

  let totalHappy = 0;
  let totalNeutral = 0;
  let totalSad = 0;
  let totalAnxious = 0;

  moodTrends.forEach((period) => {
    totalHappy += period.happy;
    totalNeutral += period.neutral;
    totalSad += period.sad;
    totalAnxious += period.anxious;
  });

  const total = totalHappy + totalNeutral + totalSad + totalAnxious;

  if (total === 0) return "No Data";

  const weightedScore =
    (totalHappy * 4 + totalNeutral * 3 + totalSad * 2 + totalAnxious * 1) /
    total;

  if (weightedScore >= 3.5) return "Happy";
  if (weightedScore >= 2.5) return "Neutral";
  if (weightedScore >= 1.5) return "Sad";
  return "Anxious";
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
  if (averageMood === "Anxious" || averageMood === "Sad") {
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
        recommendations.push(
          "Share information about sleep hygiene and its importance"
        );
        recommendations.push(
          "Consider discussing the impact of screen time before bed"
        );
        break;
      default:
        recommendations.push(
          `Address ${topIssue} through targeted resources and support`
        );
    }
  }

  // If no specific recommendations yet, add general ones
  if (recommendations.length === 0) {
    recommendations.push("Continue monitoring student mental health trends");
    recommendations.push("Provide general wellness resources to all students");
  }

  return recommendations.slice(0, 3); // Return top 3 recommendations
};

module.exports = {
  getMentalHealthTrends,
  generateMentalHealthReport,
};
