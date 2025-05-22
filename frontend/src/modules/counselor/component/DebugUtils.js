/**
 * Utility functions for debugging mental health data issues
 * This file can be imported in the browser console for direct debugging
 */

/**
 * Test the zone calculation for a specific student
 * @param {string} studentId - The ID of the student to check
 */
export async function debugStudentZone(studentId) {
  // Get auth token from localStorage
  const userData = JSON.parse(localStorage.getItem("userData")) || {};
  const token = userData.token;

  if (!token) {
    console.error("No authentication token found");
    return;
  }

  try {
    console.log(`Debugging zone calculation for student ${studentId}`);

    // Get today's date and 30 days ago for consistent testing
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Format dates for API
    const startDate = formatDate(thirtyDaysAgo);
    const endDate = formatDate(today);

    console.log(`Using date range: ${startDate} to ${endDate}`);

    // Fetch all data for this student
    const [surveyResponse, moodResponse, assessmentResponse] =
      await Promise.all([
        fetch(
          `http://localhost:3000/api/counselor/student/${studentId}/surveys?startDate=${startDate}&endDate=${endDate}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ).then((res) => res.json()),

        fetch(
          `http://localhost:3000/api/counselor/student/${studentId}/moods?startDate=${startDate}&endDate=${endDate}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ).then((res) => res.json()),

        fetch(
          `http://localhost:3000/api/counselor/student/${studentId}/initialAssessment`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
          .then((res) => res.json())
          .catch(() => null),
      ]);

    // Log the raw data
    console.log("Raw survey data:", surveyResponse);
    console.log("Raw mood data:", moodResponse);
    console.log("Raw assessment data:", assessmentResponse);

    // Extract the data from the responses
    const surveys = surveyResponse.surveys || [];
    const moods = moodResponse.moods || [];
    const assessment = assessmentResponse;

    console.log(
      `Found ${surveys.length} surveys and ${moods.length} mood entries`
    );

    // Check survey zones
    if (surveys.length > 0) {
      console.log("Survey zones:");
      surveys.slice(0, 5).forEach((survey, index) => {
        console.log(
          `  Survey ${index + 1}: ${
            survey.zone || "No zone"
          } (${typeof survey.zone})`
        );
      });
    }

    // Check mood levels
    if (moods.length > 0) {
      console.log("Mood levels:");
      moods.slice(0, 5).forEach((mood, index) => {
        console.log(
          `  Mood ${index + 1}: ${mood.moodLevel} (${typeof mood.moodLevel})`
        );
      });

      // Calculate average mood
      const validMoods = moods.filter((m) => typeof m.moodLevel === "number");
      if (validMoods.length > 0) {
        const avgMood =
          validMoods.reduce((sum, m) => sum + m.moodLevel, 0) /
          validMoods.length;
        console.log(`Average mood level: ${avgMood.toFixed(2)}`);
        console.log(
          `This would put them in: ${
            avgMood <= 2 ? "Red" : avgMood <= 3.5 ? "Yellow" : "Green"
          } zone`
        );
      } else {
        console.log("No valid mood entries found");
      }
    }

    // Calculate zone
    let zone = calculateZone(surveys, moods, assessment);
    console.log(`Calculated zone: ${zone}`);

    return {
      surveys,
      moods,
      assessment,
      zone,
    };
  } catch (error) {
    console.error("Error debugging student zone:", error);
  }
}

/**
 * Calculate zone based on the same logic as the MentalHealthOverview component
 */
function calculateZone(surveys, moods, assessment) {
  // First check if the student has a recent survey with zone information
  if (surveys.length > 0 && surveys[0].zone) {
    // Fix inconsistent zone naming
    const rawZone = surveys[0].zone;
    let normalizedZone = rawZone;

    // Convert simple color names to full zone names
    if (rawZone === "Yellow") normalizedZone = "Yellow (Moderate)";
    else if (rawZone === "Red") normalizedZone = "Red (Needs Attention)";
    else if (rawZone === "Green") normalizedZone = "Green (Positive)";

    return normalizedZone;
  }
  // If no survey but has mood data, calculate zone from mood level
  else if (moods.length > 0) {
    // Validate mood data - ensure we have valid mood levels (numbers)
    const validMoods = moods.filter((m) => typeof m.moodLevel === "number");

    if (validMoods.length === 0) {
      return "No Data";
    }

    // Calculate average mood directly from valid entries
    const avgMood =
      validMoods.reduce((sum, m) => sum + m.moodLevel, 0) / validMoods.length;

    if (avgMood <= 2) return "Red (Needs Attention)";
    else if (avgMood <= 3.5) return "Yellow (Moderate)";
    else return "Green (Positive)";
  }
  // If no survey or mood but has initial assessment, use that
  else if (assessment) {
    const { depressionScore, anxietyScore, stressScore } = assessment;

    // Ensure we have valid scores
    if (
      typeof depressionScore === "number" &&
      typeof anxietyScore === "number" &&
      typeof stressScore === "number"
    ) {
      const avgScore = (depressionScore + anxietyScore + stressScore) / 3;

      if (avgScore >= 15) return "Red (Needs Attention)";
      else if (avgScore >= 10) return "Yellow (Moderate)";
      else return "Green (Positive)";
    } else {
      return "Invalid Data";
    }
  }

  return "No Data";
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Export a global debug object for easier console access
window.MentalHealthDebug = {
  debugStudentZone,
};
