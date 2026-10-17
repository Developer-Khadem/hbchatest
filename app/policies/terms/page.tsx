"use client";

import { useLanguage } from "@/components/language-context";

export default function TermsPage() {
  const { t } = useLanguage();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 text-slate-700 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black text-slate-900">{t("Terms & Conditions")}</h1>
      <div className="mt-6 space-y-4 leading-7">
        <p>{t("Terms intro")}</p>
        <p>{t("Terms products")}</p>
        <p>{t("Terms disputes")}</p>
      </div>
    </main>
  );
}
