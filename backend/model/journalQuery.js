const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createJournal = async (studentId, content) => {
  try {
    const newJournal = await prisma.journal.create({
      data: {
        content,
        student: { connect: { id: studentId } },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    return newJournal;
  } catch (error) {
    throw new Error("Error creating journal entry: " + error.message);
  }
};

const getAllJournals = async (studentId) => {
  try {
    const allJournals = await prisma.journal.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return allJournals;
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
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
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
