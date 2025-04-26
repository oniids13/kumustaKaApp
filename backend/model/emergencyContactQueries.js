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

const updateEmergencyContact = async (
  userId,
  contactId,
  { name, relationship, phone, isPrimary = false }
) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        emergencyContacts: {
          where: { id: contactId },
          select: { id: true },
        },
      },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    if (student.emergencyContacts.length === 0) {
      throw new Error("Emergency contact not found or unauthorized");
    }

    if (isPrimary) {
      await prisma.emergencyContact.updateMany({
        where: {
          studentId: student.id,
          isPrimary: true,
          NOT: { id: contactId },
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const updatedContact = await prisma.emergencyContact.update({
      where: {
        id: contactId,
      },
      data: {
        name,
        relationship,
        phone,
        isPrimary,
      },
      select: {
        id: true,
        name: true,
        relationship: true,
        phone: true,
        isPrimary: true,
      },
    });

    return updatedContact;
  } catch (error) {
    throw new Error(`Failed to update emergency contact: ${error.message}`);
  }
};

const deleteEmergenctContact = async (userId, contactId) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        emergencyContacts: {
          where: { id: contactId },
          select: { id: true },
        },
      },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    if (student.emergencyContacts.length === 0) {
      throw new Error("Emergency contact not found or unauthorized");
    }

    await prisma.emergencyContact.delete({
      where: {
        id: contactId,
      },
    });

    return { success: "Contact deleted successfully" };
  } catch (error) {
    throw new Error(`Error deleting contact ${error.message}`);
  }
};

module.exports = {
  createEmergencyContact,
  getAllEmergencyContact,
  updateEmergencyContact,
  deleteEmergenctContact,
};
