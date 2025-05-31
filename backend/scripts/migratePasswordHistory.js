const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function migratePasswordHistory() {
  try {
    console.log("🔄 Starting password history migration...");

    // Get all users who don't have password history records
    const users = await prisma.user.findMany({
      select: {
        id: true,
        salt: true,
        hash: true,
        firstName: true,
        lastName: true,
      },
    });

    console.log(`📊 Found ${users.length} users to check`);

    let migrated = 0;
    
    for (const user of users) {
      // Check if user already has password history
      const existingHistory = await prisma.passwordHistory.findFirst({
        where: { userId: user.id },
      });

      if (!existingHistory) {
        // Create password history record for their current password
        await prisma.passwordHistory.create({
          data: {
            userId: user.id,
            hash: user.hash,
            salt: user.salt,
          },
        });
        
        migrated++;
        console.log(`✅ Migrated password history for user: ${user.firstName} ${user.lastName}`);
      } else {
        console.log(`⏭️  Password history already exists for user: ${user.firstName} ${user.lastName}`);
      }
    }

    console.log(`🎉 Migration completed! Migrated ${migrated} users.`);
  } catch (error) {
    console.error("❌ Error during migration:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration if this script is called directly
if (require.main === module) {
  migratePasswordHistory();
}

module.exports = { migratePasswordHistory }; 