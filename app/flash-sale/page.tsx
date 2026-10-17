"use client";

import Link from "next/link";
import { ArrowLeft, Flame } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { useLanguage } from "@/components/language-context";
import { ProductCard } from "@/components/product-card";

export default function FlashSalePage() {
  const { t } = useLanguage();
  const { products, isProductsLoading, productsError } = useCart();
  const flashSaleProducts = products.filter((product) => product.salePrice !== undefined);

  return (
    <main className="min-h-screen bg-transparent px-4 py-10 text-slate-900 sm:px-6 sm:py-12 lg:px-8">
      <section className="mx-auto max-w-7xl rounded-[2rem] bg-gradient-to-br from-red-50 via-white to-amber-50 p-5 sm:p-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700">
          <ArrowLeft aria-hidden="true" size={16} />
          {t("Back to Home")}
        </Link>

        <div className="mb-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-red-700">
            <Flame aria-hidden="true" size={15} />
            {t("Flash Sale")}
          </p>
          <h1 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">{t("Limited-time deals")}</h1>
          <p className="mt-2 text-sm text-slate-600">{t("Save on customer favorites while the offers last.")}</p>
        </div>

        {isProductsLoading ? (
          <p className="py-10 text-center text-slate-600">{t("Loading products...")}</p>
        ) : productsError ? (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-center text-red-700">{t(productsError)}</p>
        ) : flashSaleProducts.length ? (
          <div className="grid gap-x-6 gap-y-3 sm:gap-y-6 sm:grid-cols-2 xl:grid-cols-4">
            {flashSaleProducts.map((product) => (
              <ProductCard key={product.id} product={product} variant="standard" />
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-slate-600">{t("No products found in this collection.")}</p>
        )}
      </section>
    </main>
  );
}
