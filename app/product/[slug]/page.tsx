import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/product-detail-view";
import { getStoreProducts } from "@/lib/store-catalog";
import type { Product } from "@/lib/site-data";

type ProductPageProps = { params: Promise<{ slug: string }> };

export default function ProductDetailPage({ params }: ProductPageProps) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-600">Loading product...</main>}>
      <ProductDetails params={params} />
    </Suspense>
  );
}

async function ProductDetails({ params }: ProductPageProps) {
  const { slug } = await params;
  await connection();

  let products: Product[];
  try {
    products = await getStoreProducts();
  } catch (error) {
    console.error("Unable to load storefront product detail", error);
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 text-center text-red-700" role="alert">
        Unable to load this product right now. Please try again later.
      </main>
    );
  }

  const product = products.find((entry) => entry.slug === slug);
  if (!product) notFound();

  const relatedProducts = products
    .filter((entry) => entry.category === product.category && entry.id !== product.id)
    .slice(0, 3);

  return <ProductDetailView product={product} relatedProducts={relatedProducts} />;
}
