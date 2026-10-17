"use client";

import Link from "next/link";
import Image from "next/image";
import { type FormEvent, useState } from "react";
import { useCart } from "@/components/cart-context";
import { useLanguage } from "@/components/language-context";
import bangladeshLocations from "@/lib/bangladesh-locations.json";
import { localizeProduct } from "@/lib/localization";
import { districtDeliveryFees } from "@/lib/site-data";

export default function CheckoutPage() {
  const { items, products, subtotal, clearCart, isProductsLoading, productsError } = useCart();
  const { language, t } = useLanguage();
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");
  const [note, setNote] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const districts = bangladeshLocations.divisions.find((entry) => entry.name === division)?.districts ?? [];
  const thanas = districts.find((entry) => entry.name === district)?.upazilas ?? [];

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
    .filter(Boolean) as Array<(typeof products)[number] & { quantity: number; effectivePrice: number }>;

  const currentFee = district
    ? districtDeliveryFees.find((entry) => entry.district === district)?.fee ?? 60
    : 0;
  const payableTotal = subtotal + currentFee;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOrderPlaced(true);
    clearCart();
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">{t("Checkout")}</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">{t("Place Your Order")}</h1>
      </div>

      {orderPlaced ? (
        <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
          <h2 className="text-3xl font-black text-emerald-700">{t("Order placed successfully!")}</h2>
          <p className="mt-3 text-lg text-emerald-800">{t("Your order ID: HBC-2408. Confirmation SMS will be sent shortly.")}</p>
          <Link href="/track" className="mt-6 inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white">
            {t("Track Order")}
          </Link>
        </div>
      ) : isProductsLoading ? (
        <p className="rounded-2xl bg-white p-8 text-center text-slate-600">{t("Loading products...")}</p>
      ) : productsError ? (
        <p role="alert" className="rounded-2xl bg-red-50 p-8 text-center text-red-700">{t(productsError)}</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("Customer Name")}</label>
                <input required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-0 transition focus:border-red-300" placeholder={t("Your full name")} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("Mobile Number")}</label>
                <input required type="tel" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-300" placeholder="01XXXXXXXXX" />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("Division")}</label>
                <select
                  required
                  value={division}
                  onChange={(event) => {
                    setDivision(event.target.value);
                    setDistrict("");
                    setThana("");
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-300"
                >
                  <option value="" disabled>{t("Select division")}</option>
                  {bangladeshLocations.divisions.map((entry) => (
                    <option key={entry.name} value={entry.name}>{entry.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("District")}</label>
                <select
                  required
                  value={district}
                  onChange={(event) => {
                    setDistrict(event.target.value);
                    setThana("");
                  }}
                  disabled={!division}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-300"
                >
                  <option value="" disabled>{t("Select district")}</option>
                  {districts.map((entry) => (
                    <option key={entry.name} value={entry.name}>{entry.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("Thana / Upazila")}</label>
                <select
                  required
                  value={thana}
                  onChange={(event) => setThana(event.target.value)}
                  disabled={!district}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-300"
                >
                  <option value="" disabled>{t("Select thana / upazila")}</option>
                  {thanas.map((entry) => (
                    <option key={entry} value={entry}>{entry}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("Union / Area")}</label>
                <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-300" placeholder={t("Union / Area")} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("Village / Road")}</label>
                <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-300" placeholder={t("Village / Road / House")} />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">{t("Detailed Address")}</label>
              <textarea className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-300" placeholder={t("House number, road, landmark, etc.")} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">{t("Order Note")}</label>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-300" placeholder={t("Special instructions for kitchen / rider")} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-sm font-semibold text-slate-700">{t("Payment Method")}</div>
              <div className="flex flex-wrap gap-3">
                <label className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                  <input type="radio" name="payment" defaultChecked className="mr-2" /> {t("Cash on Delivery")}
                </label>
                <label className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                  <input type="radio" name="payment" className="mr-2" /> {t("Digital Wallet")}
                </label>
              </div>
            </div>

            <button type="submit" className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-600">
              {t("Confirm Order")}
            </button>
          </form>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900">{t("Order Review")}</h2>
            <div className="mt-5 space-y-4">
              {cartProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-900">{product.name}</div>
                    <div className="text-xs text-slate-500">{t("Qty:")} {product.quantity}</div>
                  </div>
                  <div className="text-sm font-bold text-red-600">৳{(product.salePrice ?? product.price) * product.quantity}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between"><span>{t("Subtotal")}</span><span>৳{subtotal}</span></div>
              <div className="flex items-center justify-between"><span>{t("Delivery fee")}</span><span>৳{currentFee}</span></div>
              <div className="flex items-center justify-between"><span>{t("Discount")}</span><span>-৳0</span></div>
            </div>
            <div className="mt-5 border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between text-lg font-black text-slate-900"><span>{t("Total")}</span><span>৳{payableTotal}</span></div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
