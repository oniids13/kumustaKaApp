const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getAllResources = async () => {
  try {
    const allResources = await prisma.resource.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        type: true,
      },
    });

    return allResources;
  } catch (error) {
    console.error("Error fetching resources:", error);
    throw error;
  }
};

module.exports = { getAllResources };
