"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart-context";
import { useLanguage } from "@/components/language-context";
import { getProductImageSource } from "@/lib/product-images";
import { localizeProduct } from "@/lib/localization";

export default function CartPage() {
  const { items, products, updateQuantity, removeItem, subtotal, totalItems, deliveryFee, totalPrice, clearCart, isProductsLoading, productsError } = useCart();
  const { language, t } = useLanguage();

  const cartProducts = items
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) return null;
      return {
        ...localizeProduct(product, language),
        quantity: item.quantity,
        effectivePrice: product.salePrice ?? product.price,
      };
    })
    .filter(Boolean) as Array<
      (typeof products)[number] & { quantity: number; effectivePrice: number }
    >;

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="whitespace-nowrap text-xl font-black leading-tight text-slate-900 sm:text-4xl">{t("Your Basket")}</h1>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          {totalItems} {t("items selected")}
        </div>
      </div>

      {isProductsLoading ? (
        <p className="rounded-2xl bg-white p-8 text-center text-slate-600">{t("Loading products...")}</p>
      ) : productsError ? (
        <p role="alert" className="rounded-2xl bg-red-50 p-8 text-center text-red-700">{t(productsError)}</p>
      ) : cartProducts.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center">
          <h2 className="text-2xl font-black text-slate-900">{t("Your cart is empty")}</h2>
          <p className="mt-3 text-slate-600">{t("Add some iconic achar and combo picks to continue.")}</p>
          <Link href="/#homepage-products-panel" className="mt-6 inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-red-600">
            {t("Continue Shopping")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-5">
            {cartProducts.map((product) => (
              <div key={product.id} className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                <div className="relative h-28 w-full shrink-0 sm:w-32">
                  <Image
                    src={getProductImageSource(product.image)}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 128px"
                    unoptimized
                    className="rounded-2xl object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-slate-900">{product.name}</h2>
                    <button onClick={() => removeItem(product.id)} className="text-sm font-semibold text-red-600">
                      {t("Remove")}
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{product.category}</p>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
                      <button onClick={() => updateQuantity(product.id, product.quantity - 1)} className="h-8 w-8 text-lg text-slate-700">
                        −
                      </button>
                      <span className="min-w-10 text-center text-sm font-bold text-slate-900">{product.quantity}</span>
                      <button onClick={() => updateQuantity(product.id, product.quantity + 1)} className="h-8 w-8 text-lg text-slate-700">
                        +
                      </button>
                    </div>
                    <div className="text-lg font-black text-red-600">৳{product.effectivePrice * product.quantity}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900">{t("Order Summary")}</h2>
            <div className="mt-5 space-y-4 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>{t("Subtotal")}</span>
                <span>৳{subtotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("Delivery fee")}</span>
                <span>৳{deliveryFee}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("Voucher")}</span>
                <span>-৳0</span>
              </div>
            </div>
            <div className="mt-6 border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between text-lg font-black text-slate-900">
                <span>{t("Total")}</span>
                <span>৳{totalPrice}</span>
              </div>

              <div className="mt-5 space-y-3">
                <Link href="/checkout" className="block rounded-full bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white hover:bg-red-600">
                  {t("Proceed to Checkout")}
                </Link>
                <button onClick={clearCart} className="block w-full rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:border-red-200 hover:text-red-600">
                  {t("Clear cart")}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
