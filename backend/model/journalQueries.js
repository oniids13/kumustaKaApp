const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createJournal = async (userId, content) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    const newJournal = await prisma.journal.create({
      data: {
        content,
        student: { connect: { id: student.id } },
        isPrivate: true,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
      },
    });

    return newJournal;
  } catch (error) {
    throw new Error("Error creating journal entry: " + error.message);
  }
};

const getAllJournals = async (userId) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    const allJournal = await prisma.journal.findMany({
      where: {
        studentId: student.id,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return allJournal;
  } catch (error) {
    throw new Error("Error fetching journals: " + error.message);
  }
};

const editJournal = async (journalId, content) => {
  try {
    const updatedJournal = await prisma.journal.update({
      where: { id: journalId },
      data: { content },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return updatedJournal;
  } catch (error) {
    throw new Error("Error updating journal entry: " + error.message);
  }
};

const deleteJournal = async (journalId) => {
  try {
    const deletedJournal = await prisma.journal.delete({
      where: { id: journalId },
    });
    return deletedJournal;
  } catch (error) {
    throw new Error("Error deleting journal entry: " + error.message);
  }
};

module.exports = {
  createJournal,
  getAllJournals,
  editJournal,
  deleteJournal,
};
