import type { Prisma } from "@prisma/client";
import { serializeStoreProduct } from "@/lib/admin-products";
import { prisma } from "@/lib/prisma";

export function buildProductSearchWhere(
  query: string,
  scope: "all" | "name" = "all",
): Prisma.AcharProductWhereInput {
  const terms = query.trim().split(/\s+/u).filter(Boolean);
  const matchesForTerm = (term: string): Prisma.AcharProductWhereInput[] => {
    const matches: Prisma.AcharProductWhereInput[] = [
      { name: { contains: term, mode: "insensitive" } },
      { englishName: { contains: term, mode: "insensitive" } },
    ];

    if (scope === "all") {
      matches.push(
        { category: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { shortDesc: { contains: term, mode: "insensitive" } },
        { ingredients: { contains: term, mode: "insensitive" } },
        { slug: { contains: term, mode: "insensitive" } },
        { tags: { has: term } },
      );
    }

    return matches;
  };

  return {
    isActive: true,
    AND: terms.map((term) => ({ OR: matchesForTerm(term) })),
  };
}

export async function searchStoreProducts(query: string, take: number, scope: "all" | "name" = "all") {
  const records = await prisma.acharProduct.findMany({
    where: buildProductSearchWhere(query, scope),
    orderBy: { createdAt: "desc" },
    take,
  });

  return records.map(serializeStoreProduct);
}
