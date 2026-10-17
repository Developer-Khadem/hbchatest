"use client";

import { useLanguage } from "@/components/language-context";

export default function ReturnsPolicyPage() {
  const { t } = useLanguage();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 text-slate-700 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black text-slate-900">{t("Return & Refund Policy")}</h1>
      <div className="mt-6 space-y-4 leading-7">
        <p>{t("Returns intro")}</p>
        <p>{t("Returns verification")}</p>
        <p>{t("Returns review")}</p>
      </div>
    </main>
  );
}
