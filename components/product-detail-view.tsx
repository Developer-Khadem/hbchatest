"use client";

import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { useLanguage } from "@/components/language-context";
import { localizeProduct } from "@/lib/localization";
import type { Product } from "@/lib/site-data";

export function ProductDetailView({
  product,
  relatedProducts,
}: {
  product: Product;
  relatedProducts: Product[];
}) {
  const { language, t } = useLanguage();
  const localizedProduct = localizeProduct(product, language);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-sm text-slate-500">
        <Link href="/" className="hover:text-red-600">{t("Home")}</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">{localizedProduct.name}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm">
            <Image
              src={localizedProduct.image}
              alt={localizedProduct.name}
              width={1200}
              height={520}
              unoptimized
              className="h-[520px] w-full rounded-[1.5rem] object-cover"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {localizedProduct.gallery.map((image, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                <Image
                  src={image}
                  alt={`${localizedProduct.name} ${t("view")} ${index + 1}`}
                  width={400}
                  height={128}
                  unoptimized
                  className="h-32 w-full rounded-xl object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-red-600">
            <span className="rounded-full bg-red-100 px-2 py-1">{localizedProduct.badge}</span>
            <span>{localizedProduct.category}</span>
          </div>

          <div>
            <h1 className="text-4xl font-black text-slate-900">{localizedProduct.name}</h1>
            <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
              <span>⭐ {localizedProduct.rating} ({localizedProduct.reviews} {t("reviews")})</span>
              <span>{t("Stock:")} {localizedProduct.stock} {t("left")}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-4xl font-black text-red-600">৳{localizedProduct.salePrice ?? localizedProduct.price}</span>
            {localizedProduct.salePrice ? <span className="text-xl text-slate-400 line-through">৳{localizedProduct.price}</span> : null}
          </div>

          <p className="text-base leading-8 text-slate-700">{localizedProduct.description}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/checkout" className="rounded-full bg-slate-900 px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-red-600">
              {t("Buy Now")}
            </Link>
            <Link href="/cart" className="rounded-full border border-slate-300 bg-white px-6 py-3 text-center text-sm font-bold text-slate-900 transition hover:border-red-200 hover:text-red-600">
              {t("Add to Cart")}
            </Link>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
            <h2 className="text-lg font-bold text-slate-900">{t("Highlights")}</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {localizedProduct.highlights.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            {localizedProduct.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase text-slate-600">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-16">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">{t("Related Items")}</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">{t("You may also like")}</h2>
        </div>
        <div className="grid gap-x-6 gap-y-3 md:gap-y-6 md:grid-cols-2 xl:grid-cols-3">
          {relatedProducts.map((related) => (
            <ProductCard key={related.id} product={related} />
          ))}
        </div>
      </section>
    </main>
  );
}
