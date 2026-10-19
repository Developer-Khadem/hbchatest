"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, type MouseEvent, useEffect, useRef, useState } from "react";
import { House, Menu, Moon, Search, ShoppingCart, Sun, Truck, UserRound, X } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { useLanguage } from "@/components/language-context";
import { useTheme } from "@/components/theme-context";
import { localizeProduct } from "@/lib/localization";
import { scrollToSection } from "@/lib/scroll-to-section";
import { storeInfo, type Product } from "@/lib/site-data";

type SuggestionStatus = "idle" | "loading" | "ready" | "error";
type ProductSuggestion = Product;
const tabletLandscapeMediaQuery = "(orientation: landscape) and (min-width: 1024px) and (max-width: 1279px) and (max-height: 900px)";
const mobileLandscapeMediaQuery = "(orientation: landscape) and (min-width: 560px) and (max-width: 1023px) and (max-height: 500px)";
const mobilePortraitMediaQuery = "(orientation: portrait) and (max-width: 639px)";

function isProductSuggestion(value: unknown): value is ProductSuggestion {
  if (typeof value !== "object" || value === null) return false;

  return (
    "id" in value &&
    typeof value.id === "string" &&
    "slug" in value &&
    typeof value.slug === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "category" in value &&
    typeof value.category === "string" &&
    "price" in value &&
    typeof value.price === "number" &&
    Number.isFinite(value.price) &&
    (!("salePrice" in value) ||
      value.salePrice === undefined ||
      (typeof value.salePrice === "number" && Number.isFinite(value.salePrice))) &&
    "image" in value &&
    typeof value.image === "string" &&
    "gallery" in value &&
    Array.isArray(value.gallery) &&
    value.gallery.every((image) => typeof image === "string") &&
    "badge" in value &&
    typeof value.badge === "string" &&
    "stock" in value &&
    typeof value.stock === "number" &&
    "rating" in value &&
    typeof value.rating === "number" &&
    "reviews" in value &&
    typeof value.reviews === "number" &&
    "featured" in value &&
    typeof value.featured === "boolean" &&
    "unit" in value &&
    typeof value.unit === "string" &&
    "description" in value &&
    typeof value.description === "string" &&
    "highlights" in value &&
    Array.isArray(value.highlights) &&
    value.highlights.every((highlight) => typeof highlight === "string") &&
    "tags" in value &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === "string")
  );
}

export function Header() {
  const router = useRouter();
  const { totalItems } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTabletLandscape, setIsTabletLandscape] = useState(false);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [suggestionStatus, setSuggestionStatus] = useState<SuggestionStatus>("idle");
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchFormRef = useRef<HTMLFormElement>(null);
  const suggestionRequestIdRef = useRef(0);
  const isSearchExpanded = isSearchOpen && !isTabletLandscape;
  const isSearchFieldVisible = isSearchOpen || isTabletLandscape || isMobileLandscape || isMobilePortrait;

  useEffect(() => {
    const mediaQuery = window.matchMedia(tabletLandscapeMediaQuery);
    const updateTabletLandscape = () => setIsTabletLandscape(mediaQuery.matches);
    updateTabletLandscape();
    mediaQuery.addEventListener("change", updateTabletLandscape);

    return () => mediaQuery.removeEventListener("change", updateTabletLandscape);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(mobilePortraitMediaQuery);
    const updateMobilePortrait = () => setIsMobilePortrait(mediaQuery.matches);
    updateMobilePortrait();
    mediaQuery.addEventListener("change", updateMobilePortrait);

    return () => mediaQuery.removeEventListener("change", updateMobilePortrait);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(mobileLandscapeMediaQuery);
    const updateMobileLandscape = () => setIsMobileLandscape(mediaQuery.matches);
    updateMobileLandscape();
    mediaQuery.addEventListener("change", updateMobileLandscape);

    return () => mediaQuery.removeEventListener("change", updateMobileLandscape);
  }, []);

  useEffect(() => {
    if (isSearchExpanded) searchInputRef.current?.focus();
  }, [isSearchExpanded]);

  useEffect(() => {
    const requestId = ++suggestionRequestIdRef.current;
    const query = searchQuery.trim();
    if (!isSearchFieldVisible || !query) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query.slice(0, 100))}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Product suggestions request failed with status ${response.status}.`);

        const payload: unknown = await response.json();
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("products" in payload) ||
          !Array.isArray(payload.products) ||
          !payload.products.every(isProductSuggestion)
        ) {
          throw new Error("Product suggestions response has an invalid format.");
        }

        if (controller.signal.aborted || requestId !== suggestionRequestIdRef.current) return;
        setSuggestions(payload.products);
        setSuggestionStatus("ready");
      } catch (error) {
        if (controller.signal.aborted || requestId !== suggestionRequestIdRef.current) return;
        console.error("Unable to load live product search suggestions", error);
        setSuggestions([]);
        setSuggestionStatus("error");
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isSearchFieldVisible, searchQuery]);

  useEffect(() => {
    if (!isSearchExpanded) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !searchFormRef.current?.contains(event.target)) {
        setIsSearchOpen(false);
        setSearchQuery("");
        setSuggestions([]);
        setSuggestionStatus("idle");
        setActiveSuggestionIndex(-1);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [isSearchExpanded]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(24, 0, 0, 0);
      const remainingSeconds = Math.max(0, Math.floor((endOfDay.getTime() - now.getTime()) / 1000));

      setCountdown({
        hours: Math.floor(remainingSeconds / 3600),
        minutes: Math.floor((remainingSeconds % 3600) / 60),
        seconds: remainingSeconds % 60,
      });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (value: number) =>
    new Intl.NumberFormat("en", {
      minimumIntegerDigits: 2,
      useGrouping: false,
    }).format(value);
  const countdownText = countdown
    ? `${formatTime(countdown.hours)}:${formatTime(countdown.minutes)}:${formatTime(countdown.seconds)}`
    : "--:--:--";

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      searchInputRef.current?.focus();
      return;
    }

    router.push(`/search?q=${encodeURIComponent(query.slice(0, 100))}`);
    closeSearch();
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSuggestions([]);
    setSuggestionStatus("idle");
    setActiveSuggestionIndex(-1);
  };

  const selectSuggestion = (product: ProductSuggestion) => {
    closeSearch();
    router.push(`/product/${encodeURIComponent(product.slug)}`);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      closeSearch();
      return;
    }

    if (suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === "Enter" && activeSuggestionIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeSuggestionIndex]);
    }
  };

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
    const preservePortraitTopGap =
      targetId === "home" && window.matchMedia("(orientation: portrait) and (max-width: 639px)").matches;
    const topOffset = preservePortraitTopGap
      ? Number.parseFloat(window.getComputedStyle(target).marginTop) || 0
      : 0;
    scrollToSection(targetId, topOffset);
  };

  const navigateToTrack = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    window.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <>
    <header id="site-header" className="sticky top-0 z-50 border-b border-[#173c2b] bg-[#234b36] text-white shadow-md backdrop-blur">
      <div className={`header-main-row mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4 sm:px-6 lg:flex-wrap lg:gap-4 lg:px-8 xl:max-w-none xl:px-6 ${isSearchExpanded ? "landscape-search-expanded" : ""}`}>
        <div className="header-brand-row relative order-1 flex w-full items-center justify-between lg:contents">
          <Link
            href="/"
            aria-label={storeInfo.name}
            className={`header-brand-link flex shrink-0 items-center gap-3 lg:order-1 lg:mr-0 ${isSearchExpanded ? "hidden lg:flex" : ""}`}
          >
            <span className="logo-mark-backdrop relative block h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white">
              <Image
                src="/img/logo/logo-current.jpg"
                alt={`${storeInfo.name} logo`}
                fill
                sizes="56px"
                priority
                className="object-contain"
              />
            </span>
            <span>
              <span className="block text-base font-black tracking-tight text-white">{storeInfo.name}</span>
              <span className="block whitespace-nowrap text-xs font-semibold leading-tight tracking-normal text-white/90 sm:text-sm">{t(storeInfo.slogan)}</span>
            </span>
          </Link>
          <form
            role="search"
            ref={searchFormRef}
            onSubmit={submitSearch}
            className={`flex h-11 items-center border-b transition-[width,border-color] duration-300 ease-out lg:order-3 ${
              isSearchExpanded
                ? "absolute left-0 right-12 top-1/2 z-[60] w-auto -translate-y-1/2 gap-2 border-white/80 bg-[#234b36] lg:static lg:z-auto lg:order-6 lg:basis-full lg:mx-auto lg:w-full lg:max-w-xl lg:shrink-0 lg:translate-y-0 lg:rounded-full lg:border-white/70 lg:bg-white lg:px-3 lg:shadow-md"
                : "hidden w-11 justify-center border-transparent lg:relative lg:order-6 lg:flex lg:basis-full lg:mx-auto lg:w-full lg:max-w-xl lg:shrink-0 lg:justify-start lg:rounded-full lg:border-white/30 lg:bg-white lg:px-3 lg:shadow-md"
            }`}
          >
            {isSearchFieldVisible ? (
              <>
                <input
                  ref={searchInputRef}
                  id="header-search-input"
                  type="search"
                  name="q"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setSuggestions([]);
                    setActiveSuggestionIndex(-1);
                    setSuggestionStatus(event.target.value.trim() ? "loading" : "idle");
                  }}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => {
                    if (searchQuery.trim()) {
                      setSuggestionStatus("loading");
                    }
                  }}
                  maxLength={100}
                  autoComplete="off"
                  aria-label={t("Search products")}
                  placeholder={t("Search products")}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-haspopup="listbox"
                  aria-controls="header-search-suggestions"
                  aria-expanded={searchQuery.trim().length > 0}
                  aria-activedescendant={
                    activeSuggestionIndex >= 0
                      ? `header-search-suggestion-${activeSuggestionIndex}`
                      : undefined
                  }
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/65 lg:text-slate-900 lg:placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  aria-label={t("Search")}
                  title={t("Search")}
                  className="inline-flex h-12 w-10 shrink-0 items-center justify-center text-white transition hover:text-amber-200 focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-white lg:text-emerald-800 lg:hover:text-emerald-600"
                >
                  <Search aria-hidden="true" size={24} />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label={t("Search products")}
                aria-expanded={false}
                title={t("Search products")}
                className="inline-flex h-11 w-full items-center gap-3 px-2 text-left text-sm font-medium text-slate-500 transition hover:text-emerald-800 focus-visible:rounded-full focus-visible:outline-2 focus-visible:outline-emerald-700"
              >
                <span>{t("Search products")}</span>
                <Search aria-hidden="true" size={20} className="ml-auto shrink-0 text-emerald-800" />
              </button>
            )}
            {isSearchFieldVisible && searchQuery.trim() ? (
              <div
                id="header-search-suggestions"
                role="listbox"
                aria-label={t("Product suggestions")}
                className="absolute right-0 top-full z-[60] mt-2 max-h-[min(70vh,24rem)] w-[min(22rem,calc(100vw-2rem))] max-lg:w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white py-2 text-slate-900 shadow-2xl"
              >
                {suggestionStatus === "loading" ? (
                  <p className="px-4 py-3 text-sm text-slate-500" role="status">
                    {t("Searching products...")}
                  </p>
                ) : suggestionStatus === "error" ? (
                  <p className="px-4 py-3 text-sm text-red-700" role="alert">
                    {t("Unable to search products right now. Please try again.")}
                  </p>
                ) : suggestions.length > 0 ? (
                  <>
                    {suggestions.map((product, index) => {
                      const localizedProduct = localizeProduct(product, language);
                      const price = product.salePrice ?? product.price;
                      const formattedPrice = new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-BD")
                        .format(price);

                      return (
                        <button
                          key={product.id}
                          id={`header-search-suggestion-${index}`}
                          type="button"
                          role="option"
                          aria-selected={activeSuggestionIndex === index}
                          onMouseEnter={() => setActiveSuggestionIndex(index)}
                          onClick={() => selectSuggestion(product)}
                          className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition ${
                            activeSuggestionIndex === index ? "bg-emerald-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-900">
                              {localizedProduct.name}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-slate-500">
                              {t(localizedProduct.category)}
                            </span>
                          </span>
                          <span className="shrink-0 text-sm font-bold text-emerald-800">৳{formattedPrice}</span>
                        </button>
                      );
                    })}
                    <Link
                      href={`/search?q=${encodeURIComponent(searchQuery.trim().slice(0, 100))}`}
                      onClick={closeSearch}
                      className="mt-1 block border-t border-slate-100 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
                    >
                      {t("View all search results")}
                    </Link>
                  </>
                ) : suggestionStatus === "ready" ? (
                  <p className="px-4 py-3 text-sm text-slate-500" role="status">
                    {t("No products found.")}
                  </p>
                ) : null}
              </div>
            ) : null}
          </form>
          <div className="header-mobile-actions ml-auto flex shrink-0 items-center gap-1 lg:hidden">
            {!isSearchOpen ? (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSearchOpen(true);
                }}
                aria-label={t("Search products")}
                aria-expanded={false}
                aria-controls="header-search-input"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-white transition hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{ color: "#fff" }}
              >
                <Search aria-hidden="true" size={25} />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (isSearchOpen) closeSearch();
                setIsMobileMenuOpen((open) => !open);
              }}
              aria-label={t(isMobileMenuOpen ? "Close menu" : "Open menu")}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-site-navigation"
              className="relative z-[61] inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white transition hover:bg-white/10 hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {isMobileMenuOpen ? <X aria-hidden="true" size={25} /> : <Menu aria-hidden="true" size={25} />}
            </button>
          </div>
          {isMobileMenuOpen ? (
            <nav
              id="mobile-site-navigation"
              aria-label={t("Main navigation")}
              className="absolute inset-x-0 top-full z-50 flex flex-col gap-1 rounded-b-xl border border-t-0 border-[#173c2b] bg-[#234b36] p-3 shadow-lg lg:hidden"
            >
              <Link
                href="/#home"
                onClick={(event) => {
                  navigateToHomeSection(event, "home");
                  setIsMobileMenuOpen(false);
                }}
                className="rounded-lg px-4 py-3 font-bold text-white transition hover:bg-white/10 hover:text-amber-200 lg:px-[26px]"
              >
                {t("Home")}
              </Link>
              <Link
                href="/#homepage-products-section"
                onClick={(event) => {
                  navigateToHomeSection(event, "homepage-products-section");
                  setIsMobileMenuOpen(false);
                }}
                className="rounded-lg px-4 py-3 font-bold text-white transition hover:bg-white/10 hover:text-amber-200 lg:px-[26px]"
              >
                {t("Pickle")}
              </Link>
              <Link
                href="/#homepage-balachao-section"
                onClick={(event) => {
                  navigateToHomeSection(event, "homepage-balachao-section");
                  setIsMobileMenuOpen(false);
                }}
                className="rounded-lg px-4 py-3 font-bold text-white transition hover:bg-white/10 hover:text-amber-200 lg:px-[26px]"
              >
                {t("Balachao")}
              </Link>
              <Link
                href="/#homepage-other-products-section"
                onClick={(event) => {
                  navigateToHomeSection(event, "homepage-other-products-section");
                  setIsMobileMenuOpen(false);
                }}
                className="rounded-lg px-4 py-3 font-bold text-white transition hover:bg-white/10 hover:text-amber-200 lg:px-[26px]"
              >
                {t("Other products")}
              </Link>
              <Link
                href="/#homepage-combo-section"
                onClick={(event) => {
                  navigateToHomeSection(event, "homepage-combo-section");
                  setIsMobileMenuOpen(false);
                }}
                className="rounded-lg px-4 py-3 font-bold text-white transition hover:bg-white/10 hover:text-amber-200 lg:px-[26px]"
              >
                {t("Combo Packs")}
              </Link>
            </nav>
          ) : null}
        </div>

        <Link
          href="/flash-sale"
          aria-label={`${t("Flash Sale")}. ${t("Ends in")} ${countdownText}`}
          className="flash-sale-flash relative isolate order-3 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border px-3 py-2 transition hover:!border-[#fecaca] hover:!bg-[#991b1b] sm:order-none sm:w-auto lg:order-2 lg:mx-auto lg:min-w-max lg:flex-none lg:flex-row lg:items-center lg:self-center lg:gap-3 lg:px-5"
          style={{ backgroundColor: "#b91c1c", borderColor: "#fca5a5", color: "#fff" }}
        >
          <span className="relative z-20 inline-flex items-center gap-2 lg:w-auto lg:justify-start">
            <svg
              aria-hidden="true"
              className="flash-sale-fire relative z-20 shrink-0"
              width={22}
              height={22}
              viewBox="0 0 32 32"
              fill="none"
            >
              <path
                className="flash-sale-fire-outer"
                d="M16 30C9.4 30 4.5 25.4 4.5 19.3c0-4.5 2.6-8.1 6.5-12.7-.2 3.3.9 5.1 2.6 6.2C13.8 7.4 18.2 3 22 1.5c-.4 5.4 1.2 7.7 3.2 10.5 1.5 2.2 2.3 4.6 2.3 7.3C27.5 25.3 22.8 30 16 30Z"
                fill="url(#flash-sale-fire-outer-gradient)"
              />
              <path
                className="flash-sale-fire-inner"
                d="M16 27.3c-3.9 0-6.7-2.6-6.7-6.2 0-2.7 1.6-4.8 3.8-7.3.1 2.2 1 3.3 2.1 4.1.3-3.5 2.5-6.2 4.4-7.6.2 3.1 1.1 4.4 2.2 6 .9 1.3 1.4 2.8 1.4 4.5 0 3.9-2.9 6.5-7.2 6.5Z"
                fill="url(#flash-sale-fire-inner-gradient)"
              />
              <path
                className="flash-sale-fire-core"
                d="M16.2 25.4c-2.2 0-3.8-1.4-3.8-3.4 0-1.5.8-2.6 2-4 .2 1.4.8 2.1 1.6 2.6.2-1.8 1.2-3.1 2.2-3.9.1 1.6.6 2.4 1.2 3.2.5.7.8 1.5.8 2.4 0 1.9-1.6 3.1-4 3.1Z"
                fill="url(#flash-sale-fire-core-gradient)"
              />
              <defs>
                <linearGradient id="flash-sale-fire-outer-gradient" x1="8" y1="5" x2="24" y2="29" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFD166" />
                  <stop offset=".48" stopColor="#FF7A1A" />
                  <stop offset="1" stopColor="#D92D20" />
                </linearGradient>
                <linearGradient id="flash-sale-fire-inner-gradient" x1="12" y1="11" x2="22" y2="27" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFF0A6" />
                  <stop offset=".55" stopColor="#FFB21A" />
                  <stop offset="1" stopColor="#F04418" />
                </linearGradient>
                <linearGradient id="flash-sale-fire-core-gradient" x1="14" y1="18" x2="19" y2="25" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFFBE6" />
                  <stop offset="1" stopColor="#FFD45A" />
                </linearGradient>
              </defs>
            </svg>
            <span className="whitespace-nowrap text-sm font-extrabold">{t("Flash Sale")}</span>
          </span>
          <span
            aria-hidden="true"
            className="flash-sale-countdown relative z-20 rounded-lg px-2 py-1 font-mono text-xs font-bold tabular-nums lg:self-center"
            style={{ backgroundColor: "#fff1f2", color: "#9f1239" }}
          >
            {countdownText}
          </span>
        </Link>

        <div className="header-desktop-navigation hidden items-center gap-4 lg:order-4 lg:flex xl:flex-1">
          <nav className="flex items-center justify-start gap-[8px] whitespace-nowrap text-sm font-medium text-white xl:flex-1">
            <Link href="/#home" onClick={(event) => navigateToHomeSection(event, "home")} className="nav-underline-link px-1.5 text-base font-bold text-white hover:!text-amber-200">{t("Home")}</Link>
            <Link href="/#homepage-products-section" onClick={(event) => navigateToHomeSection(event, "homepage-products-section")} className="nav-underline-link px-1.5 text-base font-bold text-white hover:!text-amber-200">{t("Pickle")}</Link>
            <Link href="/#homepage-balachao-section" onClick={(event) => navigateToHomeSection(event, "homepage-balachao-section")} className="nav-underline-link px-1.5 text-base font-bold text-white hover:!text-amber-200">{t("Balachao")}</Link>
            <Link href="/#homepage-other-products-section" onClick={(event) => navigateToHomeSection(event, "homepage-other-products-section")} className="nav-underline-link px-1.5 text-base font-bold text-white hover:!text-amber-200">{t("Other products")}</Link>
            <Link href="/#homepage-combo-section" onClick={(event) => navigateToHomeSection(event, "homepage-combo-section")} className="nav-underline-link px-1.5 text-base font-bold text-white hover:!text-amber-200">{t("Combo Packs")}</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="language-switcher hidden h-[30px] items-center rounded-full border border-white/40 p-1 text-xs font-bold lg:inline-flex" aria-label="Select language">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                aria-pressed={language === "en"}
                className={`rounded-full px-2.5 py-1.5 transition ${language === "en" ? "bg-white text-green-800" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("bn")}
                aria-pressed={language === "bn"}
                className={`rounded-full px-2.5 py-1.5 transition ${language === "bn" ? "bg-white text-green-800" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
              >
                BN
              </button>
            </div>
            <div className="hidden items-center gap-0 lg:flex">
              <button
                type="button"
                onClick={toggleTheme}
                aria-pressed={theme === "dark"}
                aria-label={t(theme === "dark" ? "Switch to light mode" : "Switch to dark mode")}
                title={t(theme === "dark" ? "Switch to light mode" : "Switch to dark mode")}
                className="inline-flex h-12 w-12 items-center justify-center text-white transition hover:text-amber-200 focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {theme === "dark" ? <Sun aria-hidden="true" size={26} /> : <Moon aria-hidden="true" size={26} />}
              </button>
              <Link
                href="/account"
                aria-label={t("Account")}
                title={t("Account")}
                className="inline-flex h-12 w-12 items-center justify-center text-white transition hover:text-amber-200 focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <UserRound aria-hidden="true" size={26} />
              </Link>
              <Link
                href="/track"
                scroll={false}
                onClick={navigateToTrack}
                aria-label={t("Track order")}
                title={t("Track order")}
                className="inline-flex h-12 w-12 items-center justify-center text-white transition hover:text-amber-200 focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Truck aria-hidden="true" size={26} />
              </Link>
              <Link
                href="/cart"
                aria-label={`${t("Cart")}${totalItems > 0 ? `, ${totalItems} ${t("items")}` : ""}`}
                title={t("Cart")}
                className="relative inline-flex h-12 w-12 items-center justify-center text-white transition hover:text-amber-200 focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <ShoppingCart aria-hidden="true" size={26} />
                {totalItems > 0 ? (
                  <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
                    {totalItems}
                  </span>
                ) : null}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
    <nav
      aria-label={t("Quick navigation")}
      className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between border-t border-[#173c2b] bg-[#234b36] px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(15,23,42,0.08)] sm:px-4 lg:hidden"
    >
      <Link
        href="/#home"
        onClick={(event) => navigateToHomeSection(event, "home")}
        aria-label={t("Home")}
        className="inline-flex h-12 w-10 shrink-0 items-center justify-center text-white transition hover:text-amber-200 focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-12"
      >
        <House aria-hidden="true" size={26} />
      </Link>
      <div className="language-switcher inline-flex h-[30px] items-center rounded-full border border-white/50 p-1 text-xs font-bold" aria-label="Select language">
        <button
          type="button"
          onClick={() => setLanguage("en")}
          aria-pressed={language === "en"}
          className={`rounded-full px-2 py-1.5 transition ${language === "en" ? "bg-white text-green-700" : "text-white hover:bg-white/15"}`}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setLanguage("bn")}
          aria-pressed={language === "bn"}
          className={`rounded-full px-2 py-1.5 transition ${language === "bn" ? "bg-white text-green-700" : "text-white hover:bg-white/15"}`}
        >
          BN
        </button>
      </div>
      <button
        type="button"
        onClick={toggleTheme}
        aria-pressed={theme === "dark"}
        aria-label={t(theme === "dark" ? "Switch to light mode" : "Switch to dark mode")}
        className="inline-flex h-12 w-10 shrink-0 items-center justify-center text-white transition hover:text-amber-200 focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-12"
      >
        {theme === "dark" ? <Sun aria-hidden="true" size={26} /> : <Moon aria-hidden="true" size={26} />}
      </button>
      <Link
        href="/account"
        aria-label={t("Account")}
        className="inline-flex h-12 w-10 shrink-0 items-center justify-center text-white transition hover:text-amber-200 focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-12"
      >
        <UserRound aria-hidden="true" size={26} />
      </Link>
      <Link
        href="/track"
        scroll={false}
        onClick={navigateToTrack}
        aria-label={t("Track order")}
        className="inline-flex h-12 w-10 shrink-0 items-center justify-center text-white transition hover:text-amber-200 focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-12"
      >
        <Truck aria-hidden="true" size={26} />
      </Link>
      <Link
        href="/cart"
        aria-label={`${t("Cart")}${totalItems > 0 ? `, ${totalItems} ${t("items")}` : ""}`}
        className="relative inline-flex h-12 w-10 shrink-0 items-center justify-center text-white transition hover:text-amber-200 focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-12"
      >
        <ShoppingCart aria-hidden="true" size={26} />
        {totalItems > 0 ? (
          <span className="absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
            {totalItems}
          </span>
        ) : null}
      </Link>
    </nav>
    </>
  );
}
