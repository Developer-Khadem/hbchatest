import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL must be configured to use the database");
}

function normalizeDatabaseUrl(url: string) {
  const parsedUrl = new URL(url);
  const sslMode = parsedUrl.searchParams.get("sslmode")?.toLowerCase();
  const deprecatedModes = ["prefer", "require", "verify-ca"];

  if (
    sslMode &&
    deprecatedModes.includes(sslMode) &&
    parsedUrl.searchParams.get("uselibpqcompat") !== "true"
  ) {
    parsedUrl.searchParams.set("sslmode", "verify-full");
  }

  return parsedUrl.toString();
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: normalizeDatabaseUrl(databaseUrl) }),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
