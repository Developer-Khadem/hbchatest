"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-context";
import { orderTrackingSteps } from "@/lib/site-data";

export default function TrackOrderPage() {
  const { t } = useLanguage();
  const [orderId, setOrderId] = useState("HBC-2401");
  const [phone, setPhone] = useState("01757121627");

  return (
    <main className="mx-auto max-w-7xl px-4 py-2 sm:px-6 sm:py-12 lg:px-8">
      <div className="mb-2 sm:mb-8">
        <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">{t("Track Your Order")}</h1>
      </div>

      <div className="grid gap-4 sm:gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-black text-slate-900">{t("Order Lookup")}</h2>
          <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700 sm:mb-2">{t("Order Number")}</label>
              <input value={orderId} onChange={(event) => setOrderId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 sm:py-3" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700 sm:mb-2">{t("Mobile Number")}</label>
              <input value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 sm:py-3" />
            </div>
            <button className="w-full rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-600 sm:py-3">
              {t("Check Status")}
            </button>
          </div>
        </div>

        <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-red-600">{t("Live Status")}</p>
              <h2 className="text-3xl font-black text-slate-900">HBC-2401</h2>
            </div>
            <div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700">{t("In Transit")}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {t("Courier: Steadfast • Tracking ID: SF-7895421 • Estimated Delivery: Tomorrow, 5:00 PM")}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {orderTrackingSteps.map((step, index) => (
              <div key={step} className={`rounded-2xl border p-4 ${index <= 5 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                <div className="text-xs font-bold uppercase tracking-[0.12em]">{t("Step")} {index + 1}</div>
                <div className="mt-2 font-semibold">{t(step)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
