"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  DropletOff,
  FlaskConicalOff,
  Heart,
  Leaf,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useCart } from "@/components/cart-context";
import { useLanguage } from "@/components/language-context";
import { ProductCard } from "@/components/product-card";
import { scrollToSection } from "@/lib/scroll-to-section";
import { categories, testimonials } from "@/lib/site-data";
import type { Product } from "@/lib/site-data";

const acharCategoryName = categories.find((category) => category.id === "achar")?.name;
const balachaoCategory = categories.find((category) => category.id === "balachao");
const balachaoCategoryName = balachaoCategory?.name;
const otherProductsCategory = categories.find((category) => category.id === "snacks");
const otherProductsCategoryName = otherProductsCategory?.name;
const comboCategoryName = categories.find((category) => category.id === "combo")?.name;

function getProductClassification(product: Product) {
  const badge = product.badge.trim().toLocaleLowerCase();
  if (badge === "নতুন" || badge === "new") return "new";
  if (badge === "বেস্ট সেলার" || badge === "best seller" || badge === "best sellers") return "bestseller";
  if (product.featured || badge === "জনপ্রিয়" || badge === "popular") return "popular";
  return null;
}

function matchesProductFilter(
  product: Product,
  filter: ProductFilter,
) {
  return (
    filter === "all" ||
    getProductClassification(product) === filter
  );
}

const productFilters = [
  { id: "all", label: "All pickles", jarLabel: "All" },
  { id: "popular", label: "Popular", jarLabel: "Popular" },
  { id: "new", label: "New arrivals", jarLabel: "New Arrivals" },
  { id: "bestseller", label: "Best sellers", jarLabel: "Best Sellers" },
] as const;

type ProductFilter = (typeof productFilters)[number]["id"];

function CategoryJar({
  image,
  label,
  brandLabel,
  selected,
}: {
  image: string;
  label: string;
  brandLabel?: string;
  selected: boolean;
}) {
  return (
    <span className="relative flex h-52 w-full max-w-40 shrink-0 flex-col items-center transition duration-200 group-hover:-translate-y-1 sm:h-64 sm:w-48">
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-[2px] z-30 h-[16px] w-[58px] -translate-x-1/2 rounded-[5px_5px_7px_7px] border border-amber-950/35 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 shadow-[0_2px_4px_rgba(15,23,42,0.2)] after:absolute after:inset-x-1 after:top-[3px] after:h-px after:bg-amber-100/75"
      />
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-[10px] z-20 h-[13px] w-[70px] -translate-x-1/2 rounded-b-md border-x border-b border-amber-900/25 bg-gradient-to-r from-amber-100 via-amber-300 to-amber-100 shadow-sm"
      />
      <span
        className={`absolute inset-x-1 bottom-0 top-[17px] z-10 isolate overflow-hidden rounded-[25px_25px_12px_12px] border-2 bg-gradient-to-br from-white/80 via-amber-50/30 to-amber-100/55 shadow-[inset_-5px_0_10px_rgba(120,53,15,0.12),0_12px_18px_rgba(15,23,42,0.2)] transition duration-200 ${
          selected ? "border-red-500 ring-2 ring-red-500/30 ring-offset-2" : "border-white/90"
        }`}
      >
        <Image src={image} alt="" fill sizes="(min-width: 640px) 192px, 176px" unoptimized={image.startsWith("/")} className="object-cover" />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-slate-950/60" />
        <span aria-hidden="true" className="absolute inset-y-2 right-2 w-2 rounded-full bg-white/15 blur-[2px]" />
        <span className="landscape-category-label holographic-category-label absolute inset-x-2 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center px-1.5 py-2 text-center">
          {brandLabel ? (
            <span className="holographic-brand mb-1 text-xs font-black uppercase tracking-[0.16em] text-white sm:text-sm">
              {brandLabel}
            </span>
          ) : null}
          <span className="holographic-category-text text-base font-extrabold leading-tight text-white sm:text-lg">{label}</span>
        </span>
      </span>
    </span>
  );
}

const heroSlides = [
  {
    title: "Heritage in every bite",
    image: "/img/sliderimages/1.jpg",
  },
  {
    title: "A little something for every meal",
    image: "/img/sliderimages/2.jpg",
  },
  {
    title: "Your favorites, right at your door",
    image: "/img/sliderimages/3.jpg",
  },
];

const productBenefits = [
  { label: "Chemical-free", Icon: Leaf },
  { label: "Preservative-free", Icon: FlaskConicalOff },
  { label: "Artificial color-free", Icon: DropletOff },
  { label: "Delivery across Bangladesh", Icon: Truck },
  { label: "100% pure ingredients", Icon: ShieldCheck },
  { label: "Homemade taste", Icon: Heart },
];

const HERO_SLIDE_INTERVAL_MS = 8500;

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [pendingSlide, setPendingSlide] = useState<number | null>(null);
  const [outgoingSlide, setOutgoingSlide] = useState<number | null>(null);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const slideTransitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeProductFilter, setActiveProductFilter] = useState<ProductFilter>("all");
  const [activeBalachaoFilter, setActiveBalachaoFilter] = useState<ProductFilter>("all");
  const [activeOtherProductsFilter, setActiveOtherProductsFilter] = useState<ProductFilter>("all");
  const { t } = useLanguage();
  const { products: catalogProducts, isProductsLoading, productsError } = useCart();

  const startSlideTransition = useCallback(
    (nextSlide: number) => {
      if (pendingSlide !== nextSlide || outgoingSlide !== null) return;

      setPendingSlide(null);
      setOutgoingSlide(activeSlide);
      setActiveSlide(nextSlide);
      slideTransitionTimer.current = setTimeout(() => {
        setOutgoingSlide(null);
        slideTransitionTimer.current = null;
      }, 1400);
    },
    [activeSlide, outgoingSlide, pendingSlide],
  );

  const changeSlideTo = useCallback(
    (nextSlide: number) => {
      if (nextSlide === activeSlide || pendingSlide !== null || outgoingSlide !== null) return;

      if (slideTransitionTimer.current) clearTimeout(slideTransitionTimer.current);
      setPendingSlide(nextSlide);
    },
    [activeSlide, outgoingSlide, pendingSlide],
  );

  useEffect(() => {
    if (isSliderPaused) return;

    const timer = setInterval(() => {
      changeSlideTo((activeSlide + 1) % heroSlides.length);
    }, HERO_SLIDE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [activeSlide, changeSlideTo, isSliderPaused]);

  useEffect(
    () => () => {
      if (slideTransitionTimer.current) clearTimeout(slideTransitionTimer.current);
    },
    [],
  );

  useEffect(() => {
    const targetId = window.location.hash.slice(1);
    const sectionId = targetId === "category-showcase-tab-combo"
      ? "homepage-combo-section"
      : targetId;
    if (
      sectionId !== "homepage-products-section" &&
      sectionId !== "homepage-balachao-section" &&
      sectionId !== "homepage-other-products-section" &&
      sectionId !== "homepage-combo-section"
    ) return;

    window.requestAnimationFrame(() => {
      scrollToSection(sectionId);
    });
  }, []);

  const changeSlide = (direction: number) => {
    changeSlideTo((activeSlide + direction + heroSlides.length) % heroSlides.length);
  };
  const handlePendingSlideError = (slideIndex: number) => {
    if (pendingSlide !== slideIndex) return;
    console.error(`Unable to load hero slide image: ${heroSlides[slideIndex].image}`);
    setPendingSlide(null);
  };
  const currentSlide = heroSlides[activeSlide];
  const catalogAcharProducts = catalogProducts.filter((product) =>
    product.category === acharCategoryName,
  );
  const visibleProducts = catalogAcharProducts.filter((product) =>
    matchesProductFilter(product, activeProductFilter),
  );
  const catalogBalachaoProducts = catalogProducts.filter(
    (product) => product.category === balachaoCategoryName,
  );
  const balachaoProducts = catalogBalachaoProducts.filter((product) =>
    matchesProductFilter(product, activeBalachaoFilter),
  );
  const catalogOtherProducts = catalogProducts.filter(
    (product) => product.category === otherProductsCategoryName,
  );
  const otherProducts = catalogOtherProducts.filter((product) =>
    matchesProductFilter(product, activeOtherProductsFilter),
  );
  const catalogComboProducts = catalogProducts.filter(
    (product) => product.category === comboCategoryName,
  );
  const comboProducts = catalogComboProducts;

  return (
    <main className="min-h-screen bg-transparent text-slate-900">
      <section
        id="home"
        aria-label={t("Featured offers")}
        aria-roledescription={t("carousel")}
        className="relative isolate aspect-[1500/636] h-auto min-h-0 w-full scroll-mt-24 overflow-hidden bg-slate-950 sm:aspect-auto sm:h-[min(56vh,520px)] sm:min-h-[420px] lg:h-[calc(min(56vh,520px)+50px)] lg:min-h-[470px]"
        onMouseEnter={() => setIsSliderPaused(true)}
        onMouseLeave={() => setIsSliderPaused(false)}
        onFocusCapture={() => setIsSliderPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setIsSliderPaused(false);
        }}
      >
        {pendingSlide !== null ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0">
            <Image
              src={heroSlides[pendingSlide].image}
              alt=""
              fill
              sizes="100vw"
              loading="eager"
              onLoad={() => startSlideTransition(pendingSlide)}
              onError={() => handlePendingSlideError(pendingSlide)}
            />
          </div>
        ) : null}
        {outgoingSlide !== null ? (
          <div aria-hidden="true" className="hero-slide-out pointer-events-none absolute inset-0 z-[1]">
            <Image
              src={heroSlides[outgoingSlide].image}
              alt=""
              fill
              sizes="100vw"
              className="hero-slide-zoom object-cover"
              style={{ animationDuration: `${HERO_SLIDE_INTERVAL_MS}ms` }}
            />
          </div>
        ) : null}
        <div
          key={currentSlide.image}
          className={`pointer-events-none absolute inset-0 z-[2] ${outgoingSlide !== null ? "hero-slide-in" : ""}`}
        >
          <Image
            src={currentSlide.image}
            alt={t(currentSlide.title)}
            fill
            sizes="100vw"
            loading="eager"
            className="hero-slide-zoom object-cover"
            style={{ animationDuration: `${HERO_SLIDE_INTERVAL_MS}ms` }}
          />
        </div>

        <div className="absolute inset-0">
          <div className="landscape-hero-pagination-wrap absolute inset-x-5 bottom-6 z-10 flex items-center justify-center sm:inset-x-8 lg:inset-x-12">
            <div className="landscape-hero-pagination hidden items-center gap-2 rounded-full border border-white/20 bg-slate-950/35 px-4 py-3 shadow-lg backdrop-blur-md sm:flex" role="group" aria-label={t("Slide navigation")}>
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.title}
                  type="button"
                  aria-label={`${t("Go to slide")} ${index + 1}: ${t(slide.title)}`}
                  aria-pressed={index === activeSlide}
                  onClick={() => changeSlideTo(index)}
                  className={`size-2.5 rounded-full transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${
                    index === activeSlide ? "bg-amber-300" : "bg-white/65 hover:bg-white"
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            aria-label={t("Previous slide")}
            onClick={() => changeSlide(-1)}
            className="landscape-hero-control absolute left-4 top-1/2 z-10 hidden size-11 -translate-y-1/2 max-[639px]:translate-y-0 place-items-center rounded-full border border-white/35 bg-slate-950/35 text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-white hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:left-8 sm:grid sm:size-12 lg:left-12"
          >
            <ChevronLeft aria-hidden="true" size={23} />
          </button>
          <button
            type="button"
            aria-label={t("Next slide")}
            onClick={() => changeSlide(1)}
            className="landscape-hero-control absolute right-6 top-1/2 z-10 hidden size-11 -translate-y-1/2 max-[639px]:translate-y-0 place-items-center rounded-full border border-white/35 bg-slate-950/35 text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-white hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:right-10 sm:grid sm:size-12 lg:right-14"
          >
            <ChevronRight aria-hidden="true" size={23} />
          </button>
        </div>
      </section>

      <div
        role="region"
        aria-label={t("Product quality and delivery benefits")}
        className="my-4 overflow-hidden border-y border-amber-300/70 bg-gradient-to-r from-[#9f2b17] via-[#c43d20] to-[#9f2b17] py-0.5 text-white shadow-lg shadow-red-950/15"
      >
        <div className="benefit-marquee-track flex w-max">
          {[false, true].map((isDuplicate) => (
            <div
              key={String(isDuplicate)}
              aria-hidden={isDuplicate}
              className="flex shrink-0 items-center"
            >
              {productBenefits.map(({ label, Icon }) => (
                <div
                  key={label}
                  className={`group flex min-h-10 shrink-0 items-center justify-center gap-2 px-2 text-center text-xs font-bold leading-snug sm:min-h-11 sm:gap-3 sm:px-3 sm:text-sm ${
                    label === "Delivery across Bangladesh" ? "w-[320px] sm:w-[360px]" : "w-[240px] sm:w-[280px]"
                  }`}
                >
                  <Icon
                    aria-hidden="true"
                    className="size-5 shrink-0 text-amber-200 transition-transform duration-300 group-hover:scale-125 sm:size-6"
                  />
                  <span>{t(label)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section id="homepage-products-section" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="mb-7 whitespace-nowrap text-[clamp(1.125rem,5vw,1.875rem)] font-black text-slate-900 sm:text-4xl">{t("Explore our pickles")}</h2>

          <div className="landscape-category-filter mb-8 grid grid-cols-2 justify-items-center gap-x-3 gap-y-4 sm:flex sm:flex-wrap sm:justify-center sm:gap-7" role="tablist" aria-label={t("Product collections")}>
            {productFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                role="tab"
                id={`homepage-products-tab-${filter.id}`}
                aria-controls="homepage-products-panel"
                aria-selected={activeProductFilter === filter.id}
                onClick={() => setActiveProductFilter(filter.id)}
                className="group flex w-full cursor-pointer flex-col items-center pt-3 text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-600 sm:w-48"
              >
                <CategoryJar
                  image="/img/achar.jpg"
                  label={t(filter.jarLabel)}
                  brandLabel="HBC"
                  selected={activeProductFilter === filter.id}
                />
              </button>
            ))}
          </div>

          <div
            id="homepage-products-panel"
            role="tabpanel"
            aria-labelledby={`homepage-products-tab-${activeProductFilter}`}
            className="outline-none"
          >
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
              <h3 className="text-2xl font-black text-slate-900">{t(productFilters.find((filter) => filter.id === activeProductFilter)?.label ?? "All pickles")}</h3>
            </div>

            {isProductsLoading ? (
              <p className="rounded-2xl bg-slate-50 px-5 py-8 text-center text-slate-600">{t("Loading products...")}</p>
            ) : productsError ? (
              <p role="alert" className="rounded-2xl bg-red-50 px-5 py-8 text-center text-red-700">{t(productsError)}</p>
            ) : visibleProducts.length > 0 ? (
              <div className="landscape-product-grid grid grid-cols-2 gap-x-3 gap-y-1.5 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} variant="standard" />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-slate-50 px-5 py-8 text-center text-slate-600">{t("No products found in this collection.")}</p>
            )}
          </div>
        </div>
      </section>

      <section id="homepage-balachao-section" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="mb-7 whitespace-nowrap text-[clamp(1.125rem,5vw,1.875rem)] font-black text-slate-900 sm:text-4xl">{t("Explore our Balachao")}</h2>

          <div className="landscape-category-filter mb-8 grid grid-cols-2 justify-items-center gap-x-3 gap-y-4 sm:flex sm:flex-wrap sm:justify-center sm:gap-7" role="tablist" aria-label={t("Balachao collections")}>
            {productFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                role="tab"
                id={`homepage-balachao-tab-${filter.id}`}
                aria-controls="homepage-balachao-panel"
                aria-selected={activeBalachaoFilter === filter.id}
                onClick={() => setActiveBalachaoFilter(filter.id)}
                className="group flex w-full scroll-mt-24 cursor-pointer flex-col items-center pt-3 text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-600 sm:w-48"
              >
                <CategoryJar
                  image={balachaoCategory?.image ?? "/img/balachao.jpg"}
                  label={t(filter.jarLabel)}
                  brandLabel="HBC"
                  selected={activeBalachaoFilter === filter.id}
                />
              </button>
            ))}
          </div>

          <div id="homepage-balachao-panel" role="tabpanel" aria-labelledby={`homepage-balachao-tab-${activeBalachaoFilter}`} className="outline-none">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
              <h3 className="text-2xl font-black text-slate-900">{t(productFilters.find((filter) => filter.id === activeBalachaoFilter)?.jarLabel ?? "All")}</h3>
            </div>

            {isProductsLoading ? (
              <p className="rounded-2xl bg-slate-50 px-5 py-8 text-center text-slate-600">{t("Loading products...")}</p>
            ) : productsError ? (
              <p role="alert" className="rounded-2xl bg-red-50 px-5 py-8 text-center text-red-700">{t(productsError)}</p>
            ) : balachaoProducts.length > 0 ? (
              <div className="landscape-product-grid grid grid-cols-2 gap-x-3 gap-y-1.5 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {balachaoProducts.map((product) => (
                  <ProductCard key={product.id} product={product} variant="standard" />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-slate-50 px-5 py-8 text-center text-slate-600">{t("No products found in this collection.")}</p>
            )}
          </div>
        </div>
      </section>

      <section id="homepage-other-products-section" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="mb-7 whitespace-nowrap text-[clamp(1.125rem,5vw,1.875rem)] font-black text-slate-900 sm:text-4xl">{t("Explore our other products")}</h2>

          <div className="landscape-category-filter mb-8 grid grid-cols-2 justify-items-center gap-x-3 gap-y-4 sm:flex sm:flex-wrap sm:justify-center sm:gap-7" role="tablist" aria-label={t("Other product collections")}>
            {productFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                role="tab"
                id={`homepage-other-products-tab-${filter.id}`}
                aria-controls="homepage-other-products-panel"
                aria-selected={activeOtherProductsFilter === filter.id}
                onClick={() => setActiveOtherProductsFilter(filter.id)}
                className="group flex w-full scroll-mt-24 cursor-pointer flex-col items-center pt-3 text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-600 sm:w-48"
              >
                <CategoryJar
                  image="/img/achar.jpg"
                  label={t(filter.jarLabel)}
                  brandLabel="HBC"
                  selected={activeOtherProductsFilter === filter.id}
                />
              </button>
            ))}
          </div>

          <div id="homepage-other-products-panel" role="tabpanel" aria-labelledby={`homepage-other-products-tab-${activeOtherProductsFilter}`} className="outline-none">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
              <h3 className="text-2xl font-black text-slate-900">{t(productFilters.find((filter) => filter.id === activeOtherProductsFilter)?.jarLabel ?? "All")}</h3>
            </div>

            {isProductsLoading ? (
              <p className="rounded-2xl bg-slate-50 px-5 py-8 text-center text-slate-600">{t("Loading products...")}</p>
            ) : productsError ? (
              <p role="alert" className="rounded-2xl bg-red-50 px-5 py-8 text-center text-red-700">{t(productsError)}</p>
            ) : otherProducts.length > 0 ? (
              <div className="landscape-product-grid grid grid-cols-2 gap-x-3 gap-y-1.5 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {otherProducts.map((product) => (
                  <ProductCard key={product.id} product={product} variant="standard" />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-slate-50 px-5 py-8 text-center text-slate-600">{t("No products found in this collection.")}</p>
            )}
          </div>
        </div>
      </section>

      <section id="homepage-combo-section" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="mb-7 whitespace-nowrap text-[clamp(1.125rem,5vw,1.875rem)] font-black text-slate-900 sm:text-4xl">{t("Explore our Combo Packs")}</h2>

          {isProductsLoading ? (
            <p className="rounded-2xl bg-slate-50 px-5 py-8 text-center text-slate-600">{t("Loading products...")}</p>
          ) : productsError ? (
            <p role="alert" className="rounded-2xl bg-red-50 px-5 py-8 text-center text-red-700">{t(productsError)}</p>
          ) : comboProducts.length > 0 ? (
            <div className="landscape-product-grid grid grid-cols-2 gap-x-3 gap-y-1.5 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {comboProducts.map((product) => (
                <ProductCard key={product.id} product={product} variant="standard" />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-slate-50 px-5 py-8 text-center text-slate-600">{t("No products found in this collection.")}</p>
          )}
        </div>
      </section>

      <section className="w-full !bg-transparent py-16">
        <div className="mb-8 w-full px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mt-3 whitespace-nowrap text-[clamp(1.125rem,5vw,1.875rem)] font-black text-slate-900 sm:text-4xl">{t("What Customers Say About Us")}</h2>
        </div>

        <div className="w-full overflow-hidden motion-reduce:overflow-x-auto" aria-label={t("Customer reviews")}>
          <div className="flex w-max animate-[testimonial-marquee_48s_linear_infinite] motion-reduce:animate-none motion-reduce:will-change-auto">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex flex-none gap-6 pr-6" aria-hidden={copy === 1}>
                {testimonials.map((review) => (
                  <article
                    key={`${copy}-${review.name}`}
                    className="landscape-review-card h-[170px] w-[min(82vw,22rem)] shrink-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:h-auto sm:min-h-56 sm:p-6"
                  >
                    <div className="flex items-center gap-3">
                      <Image
                        src={review.image}
                        alt={`${t(review.name)}'s photo`}
                        width={64}
                        height={64}
                        sizes="64px"
                        className="h-16 w-16 shrink-0 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-1 text-amber-500" aria-label={`${review.rating} stars`}>
                          {Array.from({ length: review.rating }).map((_, index) => (
                            <span key={index} aria-hidden="true">★</span>
                          ))}
                        </div>
                        <div className="truncate font-bold text-slate-900">{t(review.name)}</div>
                        <div className="truncate text-sm text-slate-500">{t(review.title)}</div>
                      </div>
                    </div>
                    <p className="mt-5 text-base leading-6 sm:leading-7 text-slate-700">“{t(review.review)}”</p>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
