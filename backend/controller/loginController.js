const jwt = require("jsonwebtoken");
const { getUserLogin, updateUserLastLogin } = require("../model/userQueries");
require("dotenv").config();

const secretKey = process.env.JWT_SECRETKEY;

const loginController = async (req, res) => {
  let { email, password } = req.body;

  const user = await getUserLogin(email, password);

  if (!user || !user.id) {
    // Check if it's a status-related message
    if (user && user.message) {
      if (user.message.includes("deactivated")) {
        return res.status(403).json({ message: user.message });
      }
      return res.status(401).json({ message: user.message });
    }
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // Update last login timestamp
  await updateUserLastLogin(user.id);

  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: `${user.firstName} ${user.lastName}`,
    avatar: user.avatar,
  };

  const token = jwt.sign(tokenPayload, secretKey, { expiresIn: "1d" });

  return res.status(200).json({
    message: "Login successful",
    token: token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
    },
  });
};

module.exports = { loginController };
