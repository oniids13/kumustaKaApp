const { getDailySurvey, createSurvey } = require("../model/surveyQueries");
const dailySurveyTemplate = require("../resources/dailySurveyTemplate");

async function ensureDailySurveyExists() {
  try {
    // Check if survey already exists
    const existingSurvey = await getDailySurvey();
    if (existingSurvey) return existingSurvey;

    // Create from template if doesn't exist
    console.log("Creating daily survey...");
    return await createSurvey(dailySurveyTemplate);
  } catch (error) {
    console.error("Failed to initialize daily survey:", error);
    throw error;
  }
}

module.exports = { ensureDailySurveyExists };
