"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-context";

export default function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-4 text-6xl">🍽️</div>
      <h1 className="text-4xl font-black text-slate-900">{t("Page Not Found")}</h1>
      <p className="mt-4 text-lg text-slate-600">{t("The page you are looking for is not available in our cafeteria store.")}</p>
      <Link href="/" className="mt-8 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-red-600">
        {t("Back to Home")}
      </Link>
    </main>
  );
}
