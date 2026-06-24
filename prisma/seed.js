const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Seed admin
  const existingAdmin = await prisma.admin.findUnique({
    where: { email: "admin@smartstore.com" }
  });

  if (!existingAdmin) {
    await prisma.admin.create({
      data: {
        email: "admin@smartstore.com",
        password: "admin123"
      }
    });
    console.log("Default admin created: admin@smartstore.com / admin123");
  } else {
    console.log("Admin already exists, skipping.");
  }

  // Seed sample products
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    const products = [
      {
        name: "Smart Watch Pro",
        description: "Premium smartwatch with heart rate monitor, GPS, and 7-day battery life.",
        price: 250000,
        image: "/uploads/1781471789423-smart.jpg"
      },
      {
        name: "Smart Watch Lite",
        description: "Affordable smartwatch with fitness tracking and notifications.",
        price: 120000,
        image: "/uploads/1781471691632-smart1.jpg"
      },
      {
        name: "Smart Watch Sport",
        description: "Rugged smartwatch designed for athletes with water resistance up to 50m.",
        price: 180000,
        image: "/uploads/1781471506684-smart2.png"
      }
    ];

    for (const product of products) {
      await prisma.product.create({ data: product });
    }
    console.log(`${products.length} sample products created.`);
  } else {
    console.log(`Products already exist (${productCount}), skipping seed.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
