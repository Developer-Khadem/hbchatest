"use client";

import Link from "next/link";
import Image from "next/image";
import { type FormEvent, useState } from "react";
import { useCart } from "@/components/cart-context";
import { useLanguage } from "@/components/language-context";
import bangladeshLocations from "@/lib/bangladesh-locations.json";
import { localizeBangladeshLocation } from "@/lib/bangladesh-location-localization";
import { localizeProduct } from "@/lib/localization";
import { getProductImageSource } from "@/lib/product-images";
import { districtDeliveryFees } from "@/lib/site-data";

export default function CheckoutPage() {
  const { items, products, subtotal, clearCart, isProductsLoading, productsError } = useCart();
  const { language, t } = useLanguage();
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH_ON_DELIVERY");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const districts = bangladeshLocations.divisions.flatMap((entry) => entry.districts);
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: formData.get("customer"),
          phone: formData.get("phone"),
          district: formData.get("district"),
          upazila: formData.get("upazila"),
          road: formData.get("road"),
          address: formData.get("address"),
          note,
          paymentMethod,
          transactionId: formData.get("transactionId"),
          payerPhone: formData.get("payerPhone"),
          items: items.map(({ productId, quantity }) => ({ productId, quantity })),
        }),
      });
      const result: unknown = await response.json();
      if (
        !response.ok ||
        typeof result !== "object" ||
        result === null ||
        !("order" in result) ||
        typeof result.order !== "object" ||
        result.order === null ||
        !("orderNumber" in result.order) ||
        typeof result.order.orderNumber !== "string"
      ) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Unable to place your order right now. Please try again.";
        throw new Error(message);
      }

      setOrderNumber(result.order.orderNumber);
      setOrderPlaced(true);
      clearCart();
    } catch (error) {
      console.error("Unable to submit checkout order", error);
      setSubmitError(error instanceof Error ? error.message : "Unable to place your order right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
          <p className="mt-3 text-lg text-emerald-800">{t("Your order number is")} <strong>{orderNumber}</strong></p>
          <p className="mt-2 text-sm text-emerald-700">{t("We have received your order and will contact you to confirm delivery.")}</p>
          <Link href="/" className="mt-6 inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white">
            {t("Continue shopping")}
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
                <input required name="customer" autoComplete="name" maxLength={100} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-0 transition focus:border-red-300" placeholder={t("Your full name")} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("Mobile Number")}</label>
                <input required name="phone" type="tel" autoComplete="tel" maxLength={20} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-300" placeholder="01XXXXXXXXX" />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("District")}</label>
                <select
                  required
                  name="district"
                  value={district}
                  onChange={(event) => {
                    setDistrict(event.target.value);
                    setThana("");
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-300"
                >
                  <option value="" disabled>{t("Select district")}</option>
                  {districts.map((entry) => (
                    <option key={entry.name} value={entry.name}>{localizeBangladeshLocation(entry.name, language)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("Thana / Upazila")}</label>
                <select
                  required
                  name="upazila"
                  value={thana}
                  onChange={(event) => setThana(event.target.value)}
                  disabled={!district}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-300"
                >
                  <option value="" disabled>{t("Select thana / upazila")}</option>
                  {thanas.map((entry) => (
                    <option key={entry} value={entry}>{localizeBangladeshLocation(entry, language)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">{t("Village / Road")}</label>
              <input name="road" maxLength={200} autoComplete="street-address" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-300" placeholder={t("Village / Road / House")} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">{t("Detailed Address")}</label>
              <textarea required name="address" minLength={5} maxLength={500} autoComplete="street-address" className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-300" placeholder={t("House number, road, landmark, etc.")} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">{t("Order Note")}</label>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-300" placeholder={t("Special instructions for kitchen / rider")} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-sm font-semibold text-slate-700">{t("Payment Method")}</div>
              <div className="flex flex-wrap gap-3">
                <label className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                  <input type="radio" name="payment" value="CASH_ON_DELIVERY" checked={paymentMethod === "CASH_ON_DELIVERY"} onChange={() => setPaymentMethod("CASH_ON_DELIVERY")} className="mr-2" /> {t("Cash on Delivery")}
                </label>
                <label className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                  <input type="radio" name="payment" value="DIGITAL_WALLET" checked={paymentMethod === "DIGITAL_WALLET"} onChange={() => setPaymentMethod("DIGITAL_WALLET")} className="mr-2" /> {t("Digital Wallet")}
                </label>
              </div>
              {paymentMethod === "DIGITAL_WALLET" ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">{t("Wallet transaction ID")}</label>
                    <input required name="transactionId" maxLength={100} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-red-300" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">{t("Payer mobile number")}</label>
                    <input required name="payerPhone" type="tel" maxLength={20} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-red-300" placeholder="01XXXXXXXXX" />
                  </div>
                </div>
              ) : null}
            </div>

            {submitError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{t(submitError)}</p> : null}

            <button type="submit" disabled={isSubmitting || cartProducts.length === 0} className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60">
              {t(isSubmitting ? "Submitting order..." : "Confirm Order")}
            </button>
          </form>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900">{t("Order Review")}</h2>
            <div className="mt-5 space-y-4">
              {cartProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <Image
                    src={getProductImageSource(product.image)}
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
