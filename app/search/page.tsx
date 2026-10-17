import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { SearchResults } from "@/components/search-results";
import type { Product } from "@/lib/site-data";
import { searchStoreProducts } from "@/lib/product-search";

export const metadata: Metadata = {
  title: "Search products | H B C Achar Shop",
  description: "Search H B C Achar Shop products by name, category, or ingredients.",
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <Suspense fallback={<main className="mx-auto min-h-[50vh] max-w-7xl px-4 py-16 text-center text-slate-600">Searching products...</main>}>
      <SearchPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchPageContent({ searchParams }: SearchPageProps) {
  await connection();
  const params = await searchParams;
  const rawQuery = typeof params.q === "string" ? params.q : "";
  const query = rawQuery.trim().slice(0, 100);

  let products: Product[] = [];
  let hasMore = false;
  let hasError = false;

  if (query) {
    try {
      const results = await searchStoreProducts(query, 49);
      hasMore = results.length > 48;
      products = results.slice(0, 48);
    } catch (error) {
      console.error("Unable to search storefront products", error);
      hasError = true;
    }
  }

  return (
    <SearchResults
      query={query}
      products={products}
      hasMore={hasMore}
      hasError={hasError}
    />
  );
}
