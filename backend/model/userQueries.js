const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { validPassword } = require("../utils/passwordUtil");
const { getGravatar } = require("../utils/avatar");

const createUser = async (userData) => {
  const { email, salt, hash, role, firstName, lastName, phone } = userData;
  try {
    const userData = {
      email,
      salt,
      hash,
      role,
      firstName,
      lastName,
      phone,
      avatar: getGravatar(email),
    };

    switch (role) {
      case "ADMIN":
        userData.admin = { create: {} };
        break;
      case "TEACHER":
        userData.teacher = { create: {} };
        break;
      case "COUNSELOR":
        userData.counselor = { create: {} };
        break;
      case "STUDENT":
        userData.student = { create: {} };
        break;
      default:
        throw new Error("Invalid role");
    }

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        salt: true,
        hash: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatar: true,
        ...(role === "ADMIN" && { admin: true }),
        ...(role === "TEACHER" && { teacher: true }),
        ...(role === "STUDENT" && { student: true }),
        ...(role === "COUNSELOR" && { counselor: true }),
      },
    });
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

const getUserLogin = async (email, password) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
      select: {
        id: true,
        email: true,
        salt: true,
        hash: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatar: true,
      },
    });
    if (!user) {
      return { message: "User not found" };
    }

    const isValid = validPassword(password, user.hash, user.salt);

    if (isValid) {
      return user;
    } else {
      return { message: "Invalid password" };
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

const updateUserLastLogin = async (userId) => {
  try {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        lastLogin: new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error("Error updating user last login:", error);
    throw error;
  }
};

const getUserById = async (id) => {
  if (!id) {
    throw new Error("User ID is required");
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });
    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

module.exports = {
  createUser,
  getUserLogin,
  getUserById,
  updateUserLastLogin,
};
