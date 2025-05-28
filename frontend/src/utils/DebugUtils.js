/**
 * Utility functions for debugging mental health data issues
 * This file can be imported in the browser console for direct debugging
 */

/**
 * Test the zone calculation for a specific student
 * @param {string} studentId - The ID of the student to check
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 */
export async function debugStudentZone(studentId, startDate, endDate) {
  // Get auth token from localStorage
  const userData = JSON.parse(localStorage.getItem("userData")) || {};
  const token = userData.token;

  if (!token) {
    return;
  }

  try {
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

    // Extract the data from the responses
    const surveys = surveyResponse.surveys || [];
    const moods = moodResponse.moods || [];
    const assessment = assessmentResponse;

    // Calculate zone
    let zone = calculateZone(surveys, moods, assessment);

    return {
      surveys,
      moods,
      assessment,
      zone,
    };
  } catch (error) {
    console.error("Error in debugStudentZone:", error);
    return null;
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
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Export a global debug object for easier console access
window.MentalHealthDebug = {
  debugStudentZone,
  formatDate,
};
