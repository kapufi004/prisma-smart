// Prisma configuration
// Note: Prisma uses prisma/schema.prisma for configuration
// Set DATABASE_URL environment variable in .env file
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});