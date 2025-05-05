// utils/scoreCalculator.js
const { DAILY_SURVEY_SCORING } = require("./surveyScoring");

function calculateDailySurveyScore(answers) {
  if (!answers || typeof answers !== "object") {
    throw new Error("Answers must be an object");
  }

  let totalScore = 0;
  const maxPossible = Object.keys(answers).length * 5;

  // Calculate score with reverse items handled
  Object.entries(answers).forEach(([questionId, value]) => {
    const numId = parseInt(questionId);

    if (DAILY_SURVEY_SCORING.reverseItems.includes(numId)) {
      // For reverse items, the score is (6 - selected value)
      totalScore += 6 - value;
    } else {
      totalScore += value;
    }
  });

  const percentage = (totalScore / maxPossible) * 100;
  const roundedPercentage = Math.round(percentage);

  let zone;
  if (roundedPercentage >= 80) zone = "Green (Positive)";
  else if (roundedPercentage >= 60) zone = "Yellow (Moderate)";
  else zone = "Red (Needs Attention)";

  return {
    totalScore,
    percentage: roundedPercentage,
    zone,
  };
}

module.exports = calculateDailySurveyScore;
