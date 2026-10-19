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

type InvoiceOrder = {
  orderNumber: string;
  customer: string;
  phone: string;
  division: string | null;
  district: string;
  upazila: string;
  road: string | null;
  address: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  orderItems: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
};

function isInvoiceOrder(value: unknown): value is InvoiceOrder {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const order = value as Record<string, unknown>;
  return (
    typeof order.orderNumber === "string" &&
    typeof order.customer === "string" &&
    typeof order.phone === "string" &&
    (typeof order.division === "string" || order.division === null) &&
    typeof order.district === "string" &&
    typeof order.upazila === "string" &&
    (typeof order.road === "string" || order.road === null) &&
    typeof order.address === "string" &&
    typeof order.subtotal === "number" &&
    typeof order.discount === "number" &&
    typeof order.deliveryFee === "number" &&
    typeof order.total === "number" &&
    typeof order.createdAt === "string" &&
    Array.isArray(order.orderItems) &&
    order.orderItems.every((item: unknown) => {
      if (typeof item !== "object" || item === null || Array.isArray(item)) return false;
      const invoiceItem = item as Record<string, unknown>;
      return (
        typeof invoiceItem.id === "string" &&
        typeof invoiceItem.name === "string" &&
        typeof invoiceItem.quantity === "number" &&
        typeof invoiceItem.unitPrice === "number"
      );
    })
  );
}

export default function CheckoutPage() {
  const { items, products, subtotal, clearCart, isProductsLoading, productsError } = useCart();
  const { language, t } = useLanguage();
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH_ON_DELIVERY");
  const [invoiceOrder, setInvoiceOrder] = useState<InvoiceOrder | null>(null);
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

  const printInvoice = async () => {
    const invoice = document.querySelector<HTMLElement>(".invoice-print");
    if (!invoice) {
      setSubmitError("Unable to prepare the invoice for printing.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setSubmitError("Allow pop-ups to print or save the invoice as PDF.");
      return;
    }

    printWindow.document.documentElement.lang = language;
    printWindow.document.head.innerHTML = `
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        @page { margin: 16mm; }
        body { margin: 0; color: #0f172a; font-family: Arial, "Noto Sans Bengali", sans-serif; }
        article { max-width: 900px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; }
        header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; }
        header p, section p { margin: 6px 0 0; }
        header p:first-child { color: #dc2626; font-weight: 700; letter-spacing: .12em; }
        h2 { margin: 8px 0 0; font-size: 28px; }
        h3 { margin: 0 0 8px; }
        section { padding: 20px 0; }
        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
        th, td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; }
        th { border-top: 1px solid #e2e8f0; color: #475569; }
        th:not(:first-child), td:not(:first-child) { text-align: right; }
        dl { max-width: 360px; margin: 24px 0 0 auto; font-size: 14px; }
        dl > div { display: flex; justify-content: space-between; gap: 24px; margin: 10px 0; }
        dl > div:last-child { border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 18px; font-weight: 700; }
        @media print { article { border: 0; padding: 0; } }
        @media (max-width: 600px) { header { flex-direction: column; } }
      </style>
    `;
    printWindow.document.title = `${t("Invoice")} ${invoiceOrder?.orderNumber ?? ""}`;
    printWindow.document.body.replaceChildren(printWindow.document.importNode(invoice, true));
    printWindow.document.close();

    try {
      await printWindow.document.fonts.ready;
      window.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 100);
    } catch (error) {
      console.error("Unable to open the invoice print dialog", error);
      printWindow.close();
      setSubmitError("Unable to open the print dialog. Please try again.");
    }
  };

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
      if (typeof result !== "object" || result === null) {
        throw new Error("Unable to place your order right now. Please try again.");
      }
      if (!response.ok || !("order" in result) || !isInvoiceOrder(result.order)) {
        const message =
          "error" in result && typeof result.error === "string"
            ? result.error
            : "Unable to place your order right now. Please try again.";
        throw new Error(message);
      }

      setInvoiceOrder(result.order);
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

      {invoiceOrder ? (
        <div>
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <h2 className="text-3xl font-black text-emerald-700">{t("Order placed successfully!")}</h2>
            <p className="mt-2 text-sm text-emerald-800">{t("We have received your order and will contact you to confirm delivery.")}</p>
          </div>
          <article className="invoice-print mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
            <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-red-600">H B C Achar Shop</p>
                <h2 className="mt-2 text-3xl font-black text-slate-900">{t("Invoice")}</h2>
              </div>
              <div className="text-sm text-slate-600 sm:text-right">
                <p><strong>{t("Order")}:</strong> {invoiceOrder.orderNumber}</p>
                <p className="mt-1"><strong>{t("Date")}:</strong> {new Intl.DateTimeFormat(language === "bn" ? "bn-BD" : "en-BD", { dateStyle: "medium", timeStyle: "short" }).format(new Date(invoiceOrder.createdAt))}</p>
              </div>
            </header>

            <section className="py-6 text-sm text-slate-700">
              <h3 className="mb-2 font-bold text-slate-900">{t("Bill to")}</h3>
              <p>{invoiceOrder.customer} · {invoiceOrder.phone}</p>
              <p className="mt-1">{[invoiceOrder.road, invoiceOrder.upazila, invoiceOrder.district, invoiceOrder.division, invoiceOrder.address].filter(Boolean).join(", ")}</p>
            </section>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-y border-slate-200 text-slate-600">
                    <th className="py-3 pr-3 font-semibold">{t("Product")}</th>
                    <th className="px-3 py-3 text-right font-semibold">{t("Quantity")}</th>
                    <th className="px-3 py-3 text-right font-semibold">{t("Unit price")}</th>
                    <th className="py-3 pl-3 text-right font-semibold">{t("Amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceOrder.orderItems.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 text-slate-700">
                      <td className="py-3 pr-3 font-medium">{item.name}</td>
                      <td className="px-3 py-3 text-right">{item.quantity}</td>
                      <td className="px-3 py-3 text-right">৳{item.unitPrice}</td>
                      <td className="py-3 pl-3 text-right">৳{item.unitPrice * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="ml-auto mt-6 max-w-sm space-y-3 text-sm text-slate-700">
              <div className="flex justify-between gap-6"><dt>{t("Subtotal")}</dt><dd>৳{invoiceOrder.subtotal}</dd></div>
              <div className="flex justify-between gap-6"><dt>{t("Discount")}</dt><dd>-৳{invoiceOrder.discount}</dd></div>
              <div className="flex justify-between gap-6"><dt>{t("Delivery fee")}</dt><dd>৳{invoiceOrder.deliveryFee}</dd></div>
              <div className="flex justify-between gap-6 border-t border-slate-200 pt-3 text-lg font-black text-slate-900"><dt>{t("Total")}</dt><dd>৳{invoiceOrder.total}</dd></div>
            </dl>
          </article>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={printInvoice} className="rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white">{t("Print invoice")}</button>
            <button type="button" onClick={printInvoice} className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800">{t("Save as PDF")}</button>
            <Link href="/" className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white">{t("Continue shopping")}</Link>
          </div>
          {submitError ? <p role="alert" className="mt-4 text-center text-sm font-semibold text-red-700">{t(submitError)}</p> : null}
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
              <div className="flex flex-col gap-3">
                <label className="flex min-w-0 items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700">
                  <input type="radio" name="payment" value="DIGITAL_WALLET" checked={paymentMethod === "DIGITAL_WALLET"} onChange={() => setPaymentMethod("DIGITAL_WALLET")} className="mr-2 shrink-0" /> {t("Nagad")}
                </label>
                <label className="flex min-w-0 items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700">
                  <input type="radio" name="payment" value="CASH_ON_DELIVERY" checked={paymentMethod === "CASH_ON_DELIVERY"} onChange={() => setPaymentMethod("CASH_ON_DELIVERY")} className="mr-2 shrink-0" /> {t("Cash on Delivery")}
                </label>
              </div>
              {paymentMethod === "DIGITAL_WALLET" ? (
                <div className="mt-4 space-y-4">
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    {t("Pay with Nagad to")}{" "}
                    <a href="tel:01757121627" className="font-black underline">01757121627</a>
                    . {t("Enter the transaction ID after payment.")}
                  </p>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">{t("Payer mobile number")}</label>
                    <input required name="payerPhone" type="tel" autoComplete="tel" maxLength={20} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-red-300" placeholder="01XXXXXXXXX" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">{t("Nagad transaction ID")}</label>
                    <input required name="transactionId" maxLength={100} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-red-300" />
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
