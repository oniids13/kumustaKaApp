const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createEmergencyContact = async (
  userId,
  { name, relationship, phone, isPrimary = false }
) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    if (isPrimary) {
      await prisma.emergencyContact.updateMany({
        where: {
          studentId: student.id,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const newContact = await prisma.emergencyContact.create({
      data: {
        name,
        relationship,
        phone,
        isPrimary,
        student: {
          connect: { id: student.id },
        },
      },
      select: {
        id: true,
        name: true,
        relationship: true,
        phone: true,
        isPrimary: true,
      },
    });

    return newContact;
  } catch (error) {
    throw new Error(`Failed to create emergency contact: ${error.message}`);
  }
};

const getAllEmergencyContact = async (userId) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    const allContacts = await prisma.emergencyContact.findMany({
      where: {
        studentId: student.id,
      },
      select: {
        id: true,
        name: true,
        relationship: true,
        phone: true,
        isPrimary: true,
      },
      orderBy: {
        isPrimary: "desc",
      },
    });

    return allContacts;
  } catch (error) {
    throw new Error(`Failed to get all emergency contact: ${error.message}`);
  }
};

module.exports = {
  createEmergencyContact,
  getAllEmergencyContact,
};
