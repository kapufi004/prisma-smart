const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.admin.findUnique({
    where: { email: "admin@smartstore.com" }
  });

  if (!existing) {
    await prisma.admin.create({
      data: {
        email: "admin@smartstore.com",
        password: "admin123"
      }
    });
    console.log("Default admin created: admin@smartstore.com / admin123");
  } else {
    console.log("Admin already exists, skipping seed.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
