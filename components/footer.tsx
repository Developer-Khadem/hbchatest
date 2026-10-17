"use client";

import Link from "next/link";
import Image from "next/image";
import { type MouseEvent } from "react";
import { LifeBuoy, Mail, MapPin, Phone } from "lucide-react";
import { useLanguage } from "@/components/language-context";
import { scrollToSection } from "@/lib/scroll-to-section";
import { storeInfo } from "@/lib/site-data";

export function Footer() {
  const { t } = useLanguage();
  const navigateToHomeSection = (event: MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (window.location.pathname !== "/") return;

    const target = document.getElementById(targetId);
    if (!target) return;
    event.preventDefault();
    const categoryTab = targetId === "homepage-balachao-section"
      ? document.getElementById("category-showcase-tab-balachao")
      : targetId.startsWith("category-showcase-tab-")
        ? target
        : null;
    if (categoryTab instanceof HTMLButtonElement) {
      categoryTab.click();
    }
    window.history.pushState(null, "", `/#${targetId}`);
    scrollToSection(targetId);
  };

  return (
    <footer className="landscape-footer relative isolate mt-20 overflow-hidden border-t border-slate-200 bg-slate-900 pb-[calc(3.8125rem+env(safe-area-inset-bottom))] text-slate-200 lg:pb-0">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('/img/ocean.jpg')] bg-cover bg-center opacity-40"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-slate-950/55" />
      <div className="landscape-footer-grid relative z-10 mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-8 px-4 py-12 sm:grid-cols-4 sm:gap-x-8 sm:px-6 lg:grid-cols-5 lg:gap-x-12 lg:gap-y-10 lg:px-8">
        <div className="col-span-2 space-y-4 text-left sm:col-span-4 lg:col-span-1">
          <div className="flex items-start justify-start gap-3">
            <span className="relative -mt-2.5 block h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white">
              <Image
                src="/img/logo/logo-current.jpg"
                alt={`${storeInfo.name} logo`}
                fill
                sizes="56px"
                className="object-contain"
              />
            </span>
            <span className="text-left">
              <span className="block text-base font-black text-white">{storeInfo.name}</span>
              <span className="block whitespace-nowrap text-[8px] uppercase tracking-[0.1em] text-amber-300">{t(storeInfo.slogan)}</span>
            </span>
          </div>
          <p className="text-left text-sm leading-7 text-slate-300">
            {t("ঐতিহ্যের আচার-বালাচাও উপভোগ করুন। যত্নে ও মানসম্মত উপকরণে তৈরি। নিরাপদ অর্ডারে ঘরে পৌঁছে দিই।")}
          </p>
        </div>

        <div className="relative left-[calc((100vw-100%)/2-1rem)] col-span-2 mx-auto grid w-fit max-w-full grid-cols-[minmax(0,8rem)_minmax(0,6.75rem)] justify-items-start gap-x-10 gap-y-8 sm:static sm:contents">
        <div className="col-span-1 w-full max-w-40 text-left sm:max-w-none">
          <h3 className="mb-4 text-lg font-bold text-white">{t("Explore")}</h3>
          <ul className="flex flex-col items-start space-y-2 text-xs text-slate-300 sm:text-sm">
            <li><Link href="/#homepage-products-section" onClick={(event) => navigateToHomeSection(event, "homepage-products-section")} className="hover:text-amber-300">{t("Pickles")}</Link></li>
            <li><Link href="/#homepage-balachao-section" onClick={(event) => navigateToHomeSection(event, "homepage-balachao-section")} className="hover:text-amber-300">{t("Balachao")}</Link></li>
            <li><Link href="/#homepage-combo-section" onClick={(event) => navigateToHomeSection(event, "homepage-combo-section")} className="hover:text-amber-300">{t("Combo Packs")}</Link></li>
          </ul>
        </div>

        <div className="col-span-1 w-full max-w-40 text-left sm:max-w-none">
          <h3 className="mb-4 text-lg font-bold text-white">{t("Policies")}</h3>
          <ul className="flex flex-col items-start space-y-2 text-xs text-slate-300 sm:text-sm">
            <li><Link href="/policies/privacy" className="hover:text-amber-300">{t("Privacy Policy")}</Link></li>
            <li><Link href="/policies/terms" className="hover:text-amber-300">{t("Terms & Conditions")}</Link></li>
            <li><Link href="/policies/shipping" className="hover:text-amber-300">{t("Shipping Policy")}</Link></li>
            <li><Link href="/policies/returns" className="hover:text-amber-300">{t("Return & Refund")}</Link></li>
          </ul>
        </div>

        <div className="col-span-1 w-full max-w-40 text-left sm:max-w-none">
          <h3 className="mb-4 text-sm font-bold text-white sm:text-lg">{t("Contact")}</h3>
          <ul className="space-y-2 text-left text-xs text-slate-300 [overflow-wrap:anywhere] sm:text-sm">
            <li className="flex items-start gap-2">
              <Phone aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-amber-300" />
              <span>{storeInfo.phone}</span>
            </li>
            <li className="flex items-start gap-2">
              <Mail aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-amber-300" />
              <span>{storeInfo.email}</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-amber-300" />
              <span>{t(storeInfo.address)}</span>
            </li>
            <li className="flex items-start gap-2">
              <LifeBuoy aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-amber-300" />
              <Link href="/support" className="transition hover:text-amber-300">{t("Support Ticket")}</Link>
            </li>
          </ul>
        </div>

        <div className="col-span-1 w-full max-w-40 text-left sm:max-w-none">
          <h3 className="mb-4 text-sm font-bold text-white sm:text-lg">{t("Follow us")}</h3>
          <div className="flex flex-wrap items-center justify-start gap-1.5 sm:gap-3">
            <a
              href="#"
              onClick={(event) => event.preventDefault()}
              aria-label="Facebook"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0866FF] text-white transition hover:bg-[#0756D6] sm:h-10 sm:w-10"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.8v8h3.4z" />
              </svg>
            </a>
            <a
              href="#"
              onClick={(event) => event.preventDefault()}
              aria-label="Telegram"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#26A5E4] text-white transition hover:bg-[#168AC4] sm:h-10 sm:w-10"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M23.9 3.6 20.3 20.6c-.3 1.2-1 1.5-2 .9l-5.5-4-2.6 2.5c-.3.3-.5.5-1.1.5l.4-5.6 10.2-9.2c.4-.4-.1-.6-.7-.2L6.4 13.6 1 11.9c-1.2-.4-1.2-1.2.3-1.8L22.5 1.8c1-.4 1.8.2 1.4 1.8Z" />
              </svg>
            </a>
            <a
              href="#"
              onClick={(event) => event.preventDefault()}
              aria-label="TikTok"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition hover:bg-slate-800 sm:h-10 sm:w-10"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                <path d="M15.5 3c.3 2.3 1.6 3.7 4 3.9v3.2a8.4 8.4 0 0 1-4-.9v6.3a6.4 6.4 0 1 1-6.4-6.4c.5 0 1 .1 1.4.2v3.4a3.2 3.2 0 1 0 1.8 2.9V3h3.2Z" fill="#25F4EE" transform="translate(-.45 .25)" />
                <path d="M15.5 3c.3 2.3 1.6 3.7 4 3.9v3.2a8.4 8.4 0 0 1-4-.9v6.3a6.4 6.4 0 1 1-6.4-6.4c.5 0 1 .1 1.4.2v3.4a3.2 3.2 0 1 0 1.8 2.9V3h3.2Z" fill="#FE2C55" transform="translate(.45 -.2)" />
                <path d="M15.5 3c.3 2.3 1.6 3.7 4 3.9v3.2a8.4 8.4 0 0 1-4-.9v6.3a6.4 6.4 0 1 1-6.4-6.4c.5 0 1 .1 1.4.2v3.4a3.2 3.2 0 1 0 1.8 2.9V3h3.2Z" fill="white" />
              </svg>
            </a>
          </div>
        </div>
        </div>
      </div>

      <div className="landscape-footer-copyright relative z-10 border-t border-slate-800 py-5 text-center text-sm text-slate-400">
        © 2026 {storeInfo.name}. {t("All rights reserved.")}
      </div>
    </footer>
  );
}
