const fs = require("fs");
const path = require("path");

const createUploadsDir = () => {
  const uploadDir = path.join(__dirname, "../uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Uploads directory created:", uploadDir);
  }
};

module.exports = {
  createUploadsDir,
};
