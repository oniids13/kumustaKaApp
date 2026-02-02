const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { validPassword } = require("../utils/passwordUtil");
const { getGravatar } = require("../utils/avatar");

const createUser = async (userData) => {
  const { email, salt, hash, role, firstName, lastName, phone, gender, emergencyContact } = userData;
  try {
    const userCreateData = {
      email,
      salt,
      hash,
      role,
      firstName,
      lastName,
      phone,
      gender,
      avatar: getGravatar(email),
    };

    switch (role) {
      case "ADMIN":
        userCreateData.admin = { create: {} };
        break;
      case "TEACHER":
        userCreateData.teacher = { create: {} };
        break;
      case "COUNSELOR":
        userCreateData.counselor = { create: {} };
        break;
      case "STUDENT":
        // Create student with emergency contact if provided
        if (emergencyContact) {
          userCreateData.student = { 
            create: {
              emergencyContacts: {
                create: {
                  name: emergencyContact.name,
                  phone: emergencyContact.phone,
                  relationship: emergencyContact.relationship,
                  isPrimary: emergencyContact.isPrimary || true
                }
              }
            }
          };
        } else {
          userCreateData.student = { create: {} };
        }
        break;
      default:
        throw new Error("Invalid role");
    }

    const user = await prisma.user.create({
      data: userCreateData,
      select: {
        id: true,
        email: true,
        salt: true,
        hash: true,
        firstName: true,
        lastName: true,
        phone: true,
        gender: true,
        role: true,
        avatar: true,
        ...(role === "ADMIN" && { admin: true }),
        ...(role === "TEACHER" && { teacher: true }),
        ...(role === "STUDENT" && { 
          student: {
            select: {
              id: true,
              emergencyContacts: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  relationship: true,
                  isPrimary: true
                }
              }
            }
          }
        }),
        ...(role === "COUNSELOR" && { counselor: true }),
      },
    });

    // Create initial password history entry
    await prisma.passwordHistory.create({
      data: {
        userId: user.id,
        hash,
        salt,
      },
    });
    
    console.log(`[INFO] Created user with role ${role}${emergencyContact ? ' and emergency contact' : ''}`);
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
        status: true,
        avatar: true,
      },
    });
    if (!user) {
      return { message: "User not found" };
    }

    // Check if user account is active
    if (user.status !== "ACTIVE") {
      return { message: "Account is deactivated. Please contact administrator." };
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

const changeUserPassword = async (userId, newPasswordData) => {
  const { salt, hash } = newPasswordData;
  
  try {
    // Get the last 3 password hashes and salts
    const previousPasswords = await prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    // Check if new password matches any of the previous 3
    for (const prevPassword of previousPasswords) {
      if (validPassword(newPasswordData.plainPassword, prevPassword.hash, prevPassword.salt)) {
        throw new Error("REUSED_PASSWORD");
      }
    }

    // Update user's current password
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { salt, hash },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    // Add current password to history
    await prisma.passwordHistory.create({
      data: {
        userId,
        hash,
        salt,
      },
    });

    // Keep only the last 3 password history records
    const allHistory = await prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (allHistory.length > 3) {
      const toDelete = allHistory.slice(3);
      await prisma.passwordHistory.deleteMany({
        where: {
          id: { in: toDelete.map(p => p.id) }
        },
      });
    }

    console.log(`[INFO] Password changed for user ${userId}`);
    return updatedUser;
  } catch (error) {
    console.error("Error changing password:", error);
    throw error;
  }
};

const getUserForPasswordChange = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        salt: true,
        hash: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
    return user;
  } catch (error) {
    console.error("Error fetching user for password change:", error);
    throw error;
  }
};

module.exports = {
  createUser,
  getUserLogin,
  getUserById,
  updateUserLastLogin,
  changeUserPassword,
  getUserForPasswordChange,
};
