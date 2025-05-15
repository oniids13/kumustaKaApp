const { getPHTime } = require("./phTime");

const getTodayRange = () => {
  // Use Philippine time for consistency across the app
  const phNow = getPHTime();

  // Get user's local date without time component
  const todayStart = new Date(phNow);
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(phNow);
  todayEnd.setHours(23, 59, 59, 999);

  // Add debugging information
  console.log(
    `[DEBUG] Date Range Calculation:
    - Server time: ${new Date().toISOString()}
    - Adjusted PH time: ${phNow.toISOString()}
    - Today's range: ${todayStart.toISOString()} to ${todayEnd.toISOString()}`
  );

  return {
    todayStart,
    todayEnd,
    debugInfo: {
      serverTime: new Date().toISOString(),
      phTime: phNow.toISOString(),
      calculatedStart: todayStart.toISOString(),
      calculatedEnd: todayEnd.toISOString(),
    },
  };
};

const getDateOfWeek = (week, year) => {
  const date = new Date(year, 0, 1 + (week - 1) * 7);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

module.exports = { getTodayRange, getDateOfWeek };
