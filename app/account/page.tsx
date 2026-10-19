"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useLanguage } from "@/components/language-context";

type AccountUser = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
};

type AuthResponse = {
  user?: AccountUser | null;
  error?: string;
};

type AuthMode = "signin" | "signup";

export default function AccountPage() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [user, setUser] = useState<AccountUser | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    fetch("/api/auth", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as AuthResponse;
        if (!response.ok) throw new Error(result.error || "Unable to load account. Please try again.");
        if (isActive) setUser(result.user ?? null);
      })
      .catch((requestError: unknown) => {
        if (isActive) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load account. Please try again.");
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          name,
          phone,
          email,
          password,
        }),
      });
      const result = (await response.json()) as AuthResponse;
      if (!response.ok) {
        setError(result.error || "Unable to process account request. Please try again.");
        return;
      }
      setUser(result.user ?? null);
      setPassword("");
    } catch {
      setError("Unable to process account request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signout" }),
      });
      const result = (await response.json()) as AuthResponse;
      if (!response.ok) {
        setError(result.error || "Unable to process account request. Please try again.");
        return;
      }
      setUser(null);
      setMode("signin");
    } catch {
      setError("Unable to process account request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {isLoading ? (
          <p className="py-8 text-center text-slate-600" role="status">{t("Loading account...")}</p>
        ) : user ? (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl font-black text-emerald-700">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <h1 className="mt-5 text-3xl font-black text-slate-900">{t("Welcome back")}, {user.name}</h1>
            <p className="mt-3 text-slate-600">{t("Signed in as")} {user.phone}</p>
            {user.email ? <p className="mt-1 text-sm text-slate-500">{user.email}</p> : null}
            {error ? <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{t(error)}</p> : null}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSubmitting}
              className="mt-7 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? t("Signing out...") : t("Sign out")}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-7 text-center">
              <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                {t(mode === "signin" ? "Sign in to your account" : "Create your account")}
              </h1>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-full bg-slate-100 p-1" role="tablist" aria-label={t("Account")}>
              {(["signin", "signup"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={mode === tab}
                  onClick={() => {
                    setMode(tab);
                    setError("");
                  }}
                  className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${
                    mode === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t(tab === "signin" ? "Sign in" : "Sign up")}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" ? (
                <>
                  <div>
                    <label htmlFor="account-name" className="mb-2 block text-sm font-semibold text-slate-700">{t("Name")}</label>
                    <input
                      id="account-name"
                      required
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-red-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="account-email" className="mb-2 block text-sm font-semibold text-slate-700">{t("Email (optional)")}</label>
                    <input
                      id="account-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-red-300"
                    />
                  </div>
                </>
              ) : null}

              <div>
                <label htmlFor="account-phone" className="mb-2 block text-sm font-semibold text-slate-700">{t("Phone number")}</label>
                <input
                  id="account-phone"
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  pattern="01[3-9][0-9]{8}"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-red-300"
                />
              </div>

              <div>
                <label htmlFor="account-password" className="mb-2 block text-sm font-semibold text-slate-700">{t("Password")}</label>
                <input
                  id="account-password"
                  required
                  type="password"
                  minLength={8}
                  maxLength={128}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-red-300"
                />
                {mode === "signup" ? <p className="mt-2 text-xs text-slate-500">{t("Password (at least 8 characters)")}</p> : null}
              </div>

              {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{t(error)}</p> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? t(mode === "signin" ? "Signing in..." : "Creating account...")
                  : t(mode === "signin" ? "Sign in" : "Create an account")}
              </button>
            </form>

          </>
        )}
      </section>
    </main>
  );
}
