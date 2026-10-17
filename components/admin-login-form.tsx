"use client";

import { type FormEvent, useState } from "react";
import { useLanguage } from "@/components/language-context";

export function AdminLoginForm() {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof result === "object" && result !== null && "error" in result && typeof result.error === "string"
            ? result.error
            : "Unable to process admin login.";
        setError(t(message));
        return;
      }

      window.location.assign(new URL("/admin", window.location.origin));
    } catch {
      setError(t("Unable to process admin login."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg items-center px-4 py-12 sm:px-6">
      <form onSubmit={handleSubmit} className="w-full space-y-6 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-lg sm:p-9">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">{t("Admin")}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">{t("Admin sign in")}</h1>
          <p className="mt-2 text-sm text-slate-600">{t("Enter the local admin password to continue.")}</p>
        </div>

        <label className="block space-y-2 text-sm font-semibold text-slate-700">
          <span>{t("Admin password")}</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            maxLength={128}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-300"
          />
        </label>

        {error ? <p role="alert" className="text-sm font-semibold text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-wait disabled:opacity-60"
        >
          {isSubmitting ? t("Signing in...") : t("Admin sign in")}
        </button>
      </form>
    </main>
  );
}
