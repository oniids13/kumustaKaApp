function getPHTime(date = new Date()) {
  // Create a more reliable PH time calculation that doesn't depend on system timezone
  // Get the current UTC time
  const inputDate = new Date(date);

  // Get the UTC time components
  const utcYear = inputDate.getUTCFullYear();
  const utcMonth = inputDate.getUTCMonth();
  const utcDate = inputDate.getUTCDate();
  const utcHours = inputDate.getUTCHours();
  const utcMinutes = inputDate.getUTCMinutes();
  const utcSeconds = inputDate.getUTCSeconds();
  const utcMilliseconds = inputDate.getUTCMilliseconds();

  // PH is UTC+8, so add 8 hours to UTC time
  // We use explicit time component construction to avoid DST issues
  const phDate = new Date(
    Date.UTC(
      utcYear,
      utcMonth,
      utcDate,
      utcHours + 8, // Add 8 hours for PH timezone
      utcMinutes,
      utcSeconds,
      utcMilliseconds
    )
  );

  return phDate;
}

function getPHDateString(date = new Date()) {
  return getPHTime(date).toISOString().split("T")[0];
}

module.exports = {
  getPHTime,
  getPHDateString,
};
