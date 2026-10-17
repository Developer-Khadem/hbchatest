"use client";

import { ProductCard } from "@/components/product-card";
import { useLanguage } from "@/components/language-context";
import type { Product } from "@/lib/site-data";

type SearchResultsProps = {
  query: string;
  products: Product[];
  hasMore: boolean;
  hasError: boolean;
};

export function SearchResults({ query, products, hasMore, hasError }: SearchResultsProps) {
  const { t } = useLanguage();

  return (
    <main className="min-h-[60vh] bg-transparent px-4 py-10 text-slate-900 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-extrabold text-slate-900">{t("Search results")}</h1>

        {!query ? (
          <p className="mt-4 text-slate-600">{t("Enter a product name, category, or ingredient to search.")}</p>
        ) : hasError ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700" role="alert">
            {t("Unable to search products right now. Please try again.")}
          </p>
        ) : products.length === 0 ? (
          <p className="mt-4 text-slate-600" role="status">
            {t("No products found for")} <span className="font-semibold text-slate-900">“{query}”</span>
          </p>
        ) : (
          <>
            <p className="mt-2 text-slate-600" role="status" aria-live="polite">
              {products.length} {t("matches for")} <span className="font-semibold text-slate-900">“{query}”</span>
            </p>
            {hasMore ? (
              <p className="mt-2 text-sm text-slate-500">{t("Showing the first 48 matches. Try a more specific search.")}</p>
            ) : null}
            <div className="landscape-product-grid portrait-search-results-grid mt-8 grid grid-cols-1 gap-x-6 gap-y-3 sm:gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} variant="standard" />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
