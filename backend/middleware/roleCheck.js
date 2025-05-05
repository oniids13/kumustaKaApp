// Middleware to check admin role
function isAdmin(req, res, next) {
  if (req.user.role === "ADMIN") return next();
  res.status(403).json({ error: "Admin access required" });
}

// Middleware to check student role
function isStudent(req, res, next) {
  if (req.user.role === "STUDENT") return next();
  res.status(403).json({ error: "Student access required" });
}

module.exports = {
  isAdmin,
  isStudent,
};
