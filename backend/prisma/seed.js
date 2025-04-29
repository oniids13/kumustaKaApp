const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const resources = require("../resources/resources");

async function main() {
  console.log(`Start seeding...`);

  for (const resource of resources) {
    const exists = await prisma.resource.findFirst({
      where: { url: resource.url },
    });
    if (exists) {
      console.log(`Skipping existing resource: ${resource.title}`);
      continue;
    }
    const createdResource = await prisma.resource.create({
      data: resource,
    });
    console.log(`Created resource: ${createdResource.title}`);
  }

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
