function calculateDailySurveyScore(responses) {
  let totalScore = 0;
  let maxScore = responses.length * 5; // max per item is 5

  responses.forEach((item) => {
    if (item.selectedValue) {
      totalScore += item.selectedValue;
    }
  });

  // Compute percentage score
  const percentage = (totalScore / maxScore) * 100;

  // Interpret score zone
  let zone;
  if (percentage >= 80) {
    zone = "Green (Positive)";
  } else if (percentage >= 60) {
    zone = "Yellow (Moderate)";
  } else {
    zone = "Red (Needs Attention)";
  }

  return {
    totalScore,
    maxScore,
    percentage: Math.round(percentage),
    zone,
  };
}

module.exports = { calculateDailySurveyScore };
