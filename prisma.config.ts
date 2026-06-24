// Prisma configuration
// Prisma CLI reads .env files automatically
import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DATABASE_URL
  || process.env.MYSQL_URL;

if (!databaseUrl) {
  throw new Error(
    "Missing DATABASE_URL environment variable. "
    + "On Railway, set DATABASE_URL = $MYSQL_URL in your project variables.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});