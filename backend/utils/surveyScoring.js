const DAILY_SURVEY_SCORING = {
  // Questions with normal scoring (1-5)
  normalItems: [1, 3, 5, 7, 8, 10, 12],

  // Questions with reverse scoring (5-1)
  reverseItems: [2, 4, 6, 9, 11],
};

function getLikertOptions(questionId) {
  const baseOptions = [
    { label: "Strongly Disagree", value: 1 },
    { label: "Disagree", value: 2 },
    { label: "Neutral", value: 3 },
    { label: "Agree", value: 4 },
    { label: "Strongly Agree", value: 5 },
  ];

  if (DAILY_SURVEY_SCORING.reverseItems.includes(questionId)) {
    return baseOptions.reverse().map((opt) => ({
      ...opt,
      value: 6 - opt.value, // Reverse the values (5 becomes 1, 4 becomes 2, etc.)
    }));
  }
  return baseOptions;
}

module.exports = {
  getLikertOptions,
  DAILY_SURVEY_SCORING,
};
