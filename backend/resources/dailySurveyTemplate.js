const { getLikertOptions } = require("../utils/surveyScoring");

module.exports = {
  title: "Daily Mental Health Check-In",
  description:
    "A 12-item self-report for daily mental health monitoring (PH Timezone).",
  type: "DAILY",
  questions: [
    // Positive items (normal scoring: 1-5)
    {
      id: 1,
      question: "I felt calm and relaxed.",
      options: getLikertOptions(1), // 1=Strongly Disagree → 5=Strongly Agree
    },
    {
      id: 3,
      question: "I felt connected with my classmates or friends.",
      options: getLikertOptions(1),
    },
    {
      id: 5,
      question: "I enjoyed the things I did today.",
      options: getLikertOptions(1),
    },
    {
      id: 7,
      question: "I had enough energy to do my tasks.",
      options: getLikertOptions(1),
    },
    {
      id: 8,
      question: "I felt hopeful about my future.",
      options: getLikertOptions(1),
    },
    {
      id: 10,
      question: "I felt proud of something I did today.",
      options: getLikertOptions(1),
    },
    {
      id: 12,
      question: "I was able to manage my emotions today.",
      options: getLikertOptions(1),
    },

    // Negative items (reverse scoring: 5-1)
    {
      id: 2,
      question: "I had trouble focusing on my schoolwork.",
      options: getLikertOptions(2), // 5=Strongly Disagree → 1=Strongly Agree
    },
    {
      id: 4,
      question: "I felt anxious or nervous.",
      options: getLikertOptions(2),
    },
    {
      id: 6,
      question: "I felt overwhelmed or stressed.",
      options: getLikertOptions(2),
    },
    {
      id: 9,
      question: "I had trouble sleeping or felt tired.",
      options: getLikertOptions(2),
    },
    {
      id: 11,
      question: "I felt sad or down.",
      options: getLikertOptions(2),
    },
  ],
};
