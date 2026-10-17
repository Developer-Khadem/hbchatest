"use client";

import { type FormEvent, useState } from "react";
import { useLanguage } from "@/components/language-context";

type TicketResponse = {
  ticketNumber?: string;
  error?: string;
};

const categories = ["Order", "Delivery", "Payment", "Product", "Return or refund", "Other"] as const;

export function SupportTicketForm() {
  const { t } = useLanguage();
  const [ticketNumber, setTicketNumber] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          phone: formData.get("phone"),
          subject: formData.get("subject"),
          category: formData.get("category"),
          message: formData.get("message"),
          website: formData.get("website"),
        }),
      });
      const result = (await response.json()) as TicketResponse;
      if (!response.ok) {
        setError(result.error || "Unable to submit your support ticket. Please try again.");
        return;
      }
      if (!result.ticketNumber) throw new Error("The support ticket response did not include a reference number.");

      setTicketNumber(result.ticketNumber);
      form.reset();
    } catch (requestError) {
      console.error("Unable to submit support ticket", requestError);
      setError("Unable to submit your support ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (ticketNumber) {
    return (
      <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6" role="status">
        <h2 className="text-xl font-bold text-emerald-900">{t("Support ticket submitted")}</h2>
        <p className="mt-2 text-sm text-emerald-800">{t("Save this ticket number for reference.")}</p>
        <p className="mt-4 rounded-xl bg-white px-4 py-3 text-lg font-black tracking-wider text-emerald-900">
          {ticketNumber}
        </p>
        <button
          type="button"
          onClick={() => setTicketNumber("")}
          className="mt-5 rounded-xl border border-emerald-700 px-4 py-2.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
        >
          {t("Submit another ticket")}
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={submitTicket} className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          {t("Name")}
          <input
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          {t("Phone number")}
          <input
            name="phone"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            placeholder="01XXXXXXXXX"
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
      </div>

      <label className="block text-sm font-semibold text-slate-700">
        {t("Ticket category")}
        <select
          name="category"
          required
          defaultValue=""
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="" disabled>{t("Choose a category")}</option>
          {categories.map((category) => (
            <option key={category} value={category}>{t(category)}</option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        {t("Subject")}
        <input
          name="subject"
          type="text"
          required
          minLength={3}
          maxLength={120}
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        {t("How can we help?")}
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={3000}
          rows={6}
          className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
      </label>

      <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{t(error)}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? t("Submitting ticket...") : t("Submit support ticket")}
      </button>
    </form>
  );
}
