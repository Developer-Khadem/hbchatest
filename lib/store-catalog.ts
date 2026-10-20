import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { serializeStoreProduct } from "@/lib/admin-products";
import { prisma } from "@/lib/prisma";

export const STORE_PRODUCTS_CACHE_TAG = "store-products";

export async function getStoreProducts() {
  return getCachedStoreProducts();
}

async function getCachedStoreProducts() {
  "use cache";
  cacheLife("minutes");
  cacheTag(STORE_PRODUCTS_CACHE_TAG);

  const records = await prisma.acharProduct.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return records.map(serializeStoreProduct);
}

export function invalidateStoreProducts() {
  revalidateTag(STORE_PRODUCTS_CACHE_TAG, "max");
}
