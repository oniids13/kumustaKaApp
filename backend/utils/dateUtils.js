const { getPHTime } = require("./phTime");

const getTodayRange = (clientTime = null) => {
  // If client time is provided, use it as a reference
  // Otherwise use Philippine time for consistency across the app
  const referenceTime = clientTime ? new Date(clientTime) : getPHTime();

  // Get user's local date without time component
  const todayStart = new Date(referenceTime);
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(referenceTime);
  todayEnd.setHours(23, 59, 59, 999);

  // Add debugging information
  console.log(
    `[DEBUG] Date Range Calculation:
    - Server time: ${new Date().toISOString()}
    - Reference time: ${referenceTime.toISOString()} (${
      clientTime ? "from client" : "from server"
    })
    - Today's range: ${todayStart.toISOString()} to ${todayEnd.toISOString()}`
  );

  return {
    todayStart,
    todayEnd,
    debugInfo: {
      serverTime: new Date().toISOString(),
      referenceTime: referenceTime.toISOString(),
      referenceSource: clientTime ? "client" : "server",
      calculatedStart: todayStart.toISOString(),
      calculatedEnd: todayEnd.toISOString(),
    },
  };
};

// Updated to use ISO week calculation matching the frontend
const getDateOfWeek = (weekNumber, year) => {
  // Get January 4th of the year (which is always in week 1)
  const jan4 = new Date(year, 0, 4);
  
  // Find the Monday of week 1
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  
  // Calculate the Monday of the requested week
  const targetWeekMonday = new Date(week1Monday);
  targetWeekMonday.setDate(week1Monday.getDate() + (weekNumber - 1) * 7);
  
  return targetWeekMonday;
};

// Get the ISO week number for a given date (matching frontend calculation)
const getISOWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
};

// Get week date range for mood entries
const getWeekDateRange = (weekNumber, year) => {
  const startDate = getDateOfWeek(weekNumber, year);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  
  console.log(`[DEBUG] Week ${weekNumber} range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
  
  return { startDate, endDate };
};

module.exports = { 
  getTodayRange, 
  getDateOfWeek, 
  getISOWeekNumber, 
  getWeekDateRange 
};
