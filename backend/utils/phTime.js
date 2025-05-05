function getPHTime(date = new Date()) {
  // PH is UTC+8
  const offset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  return new Date(date.getTime() + offset);
}

function getPHDateString(date = new Date()) {
  return getPHTime(date).toISOString().split("T")[0];
}

module.exports = {
  getPHTime,
  getPHDateString,
};
