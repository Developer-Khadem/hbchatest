import type { Prisma } from "@prisma/client";
import { seedAdminCatalogIfEmpty, serializeStoreProduct } from "@/lib/admin-products";
import { prisma } from "@/lib/prisma";

export function buildProductSearchWhere(query: string): Prisma.AcharProductWhereInput {
  const terms = query.trim().split(/\s+/u).filter(Boolean);

  return {
    isActive: true,
    OR: [
      { AND: terms.map((term) => ({ name: { contains: term, mode: "insensitive" } })) },
      { AND: terms.map((term) => ({ englishName: { contains: term, mode: "insensitive" } })) },
    ],
  };
}

function getMatchRank(name: string, englishName: string, query: string) {
  const normalizedQuery = query.toLocaleLowerCase();
  const names = [name, englishName].map((value) => value.trim().toLocaleLowerCase());

  if (names.some((value) => value === normalizedQuery)) return 0;
  if (names.some((value) => value.startsWith(normalizedQuery))) return 1;
  if (names.some((value) => value.includes(normalizedQuery))) return 2;
  return 3;
}

export async function searchStoreProducts(query: string, take: number) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  await seedAdminCatalogIfEmpty(prisma);

  const records = await prisma.acharProduct.findMany({
    where: buildProductSearchWhere(normalizedQuery),
    orderBy: { createdAt: "desc" },
  });

  return records
    .sort((left, right) => {
      const rankDifference =
        getMatchRank(left.name, left.englishName, normalizedQuery) -
        getMatchRank(right.name, right.englishName, normalizedQuery);
      return rankDifference || right.createdAt.getTime() - left.createdAt.getTime();
    })
    .slice(0, take)
    .map(serializeStoreProduct);
}
