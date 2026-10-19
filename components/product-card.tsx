"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Star } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { useLanguage } from "@/components/language-context";
import { localizeProduct } from "@/lib/localization";
import { getProductImageSource } from "@/lib/product-images";
import { storeInfo, type Product } from "@/lib/site-data";
import { getWhatsAppUrl } from "@/lib/whatsapp";

const productNameElements = new Set<HTMLAnchorElement>();
let productNameResizeObserver: ResizeObserver | null = null;
let productNameSizingFrame = 0;

function synchronizeProductNameSizes() {
  const visibleNames = [...productNameElements].filter((element) => element.clientWidth > 0);
  if (visibleNames.length === 0) return;

  const largestSizes = visibleNames.map((element) => {
    element.style.fontSize = "";
    const baseSize = Number.parseFloat(window.getComputedStyle(element).fontSize);
    let smallestFittingSize = 6;
    let largestFittingSize = baseSize;

    if (element.scrollWidth > element.clientWidth) {
      for (let iteration = 0; iteration < 8; iteration += 1) {
        const candidateSize = (smallestFittingSize + largestFittingSize) / 2;
        element.style.fontSize = `${candidateSize}px`;

        if (element.scrollWidth <= element.clientWidth) {
          smallestFittingSize = candidateSize;
        } else {
          largestFittingSize = candidateSize;
        }
      }
    } else {
      smallestFittingSize = baseSize;
    }

    return smallestFittingSize;
  });

  const sharedSize = Math.min(...largestSizes);
  visibleNames.forEach((element) => {
    element.style.fontSize = `${sharedSize}px`;
  });
}

function scheduleProductNameSizing() {
  if (productNameSizingFrame) return;

  productNameSizingFrame = window.requestAnimationFrame(() => {
    productNameSizingFrame = 0;
    synchronizeProductNameSizes();
  });
}

function registerProductName(element: HTMLAnchorElement) {
  productNameElements.add(element);

  if (!productNameResizeObserver) {
    productNameResizeObserver = new ResizeObserver(scheduleProductNameSizing);
  }
  productNameResizeObserver.observe(element);
  scheduleProductNameSizing();
  void document.fonts.ready.then(scheduleProductNameSizing);

  return () => {
    productNameElements.delete(element);
    productNameResizeObserver?.unobserve(element);
    if (productNameElements.size === 0) {
      productNameResizeObserver?.disconnect();
      productNameResizeObserver = null;
    }
    scheduleProductNameSizing();
  };
}

const temporaryProductWeights: Record<string, 250 | 300> = {
  te: 250,
  "ইল-শ-ও-চ-ড-ব-ল-চ-ও-4159e0": 300,
  "mixed-pickle-premium": 300,
  "shrimp-balachao-spicy": 300,
  "dal-mixed-fry": 250,
  "sweet-achar-207dc7": 300,
  "spicy-garlic-pickle-garlic": 250,
  "গর-র-ম-স-র-আচ-র-chalta": 300,
  "sweet-olive-pickle-olive": 300,
  "tangy-jujube-pickle-boroi": 250,
  "sweet-mango-pickle-sweet-": 300,
};

export function ProductCard({
  product,
  variant = "jar",
}: {
  product: Product;
  variant?: "jar" | "standard";
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const { language, t } = useLanguage();
  const localizedProduct = localizeProduct(product, language);
  const temporaryWeight = temporaryProductWeights[product.slug];
  const displayUnit =
    temporaryWeight
      ? `${new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en").format(temporaryWeight)} ${language === "bn" ? "গ্রাম" : "g"}`
      : localizedProduct.unit;
  const imageSources = [...new Set([product.image, ...product.gallery].filter(Boolean).map(getProductImageSource))];
  const [imageIndex, setImageIndex] = useState(0);
  const productNameRef = useRef<HTMLAnchorElement>(null);
  const imageSource = imageSources[imageIndex] ?? "/product-placeholder.svg";
  const whatsappMessage = [
    t("Hello, I would like to order this product:"),
    `${t("Product")}: ${localizedProduct.name}`,
    `${t("Category")}: ${localizedProduct.category}`,
    `${t("Price")}: ৳${product.salePrice ?? product.price} (${localizedProduct.unit})`,
    `${t("Details")}: ${localizedProduct.description}`,
    `${t("Product link")}: https://${storeInfo.website}/product/${product.slug}`,
  ].join("\n");
  const isJar = variant === "jar";

  useEffect(() => {
    const productName = productNameRef.current;
    if (!productName) return;

    return registerProductName(productName);
  }, [localizedProduct.name]);

  return (
    <article
      className={
        isJar
          ? "product-jar-card group relative isolate h-[34.5rem] pt-6 transition hover:-translate-y-1"
          : "group relative h-full transition hover:-translate-y-1"
      }
    >
      {isJar ? (
        <>
          <div aria-hidden="true" className="product-jar-neck" />
          <div aria-hidden="true" className="product-jar-lid" />
        </>
      ) : null}

      <div
        className={
          isJar
            ? "product-jar-body overflow-hidden"
            : "flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow group-hover:shadow-lg"
        }
      >
        <div
          className={
            isJar
              ? "landscape-product-image relative mx-3 mt-4 h-32 shrink-0 overflow-hidden rounded-[1.75rem] sm:h-48"
              : "landscape-product-image relative h-32 shrink-0 overflow-hidden rounded-t-3xl sm:h-48"
          }
        >
          <Image
            src={imageSource}
            alt={localizedProduct.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
            className="object-cover transition duration-500 group-hover:scale-105"
            onError={() => setImageIndex((currentIndex) => Math.min(currentIndex + 1, imageSources.length))}
          />
          {localizedProduct.badge ? (
            <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow">
              {localizedProduct.badge}
            </span>
          ) : null}
        </div>

        <div
          className={`landscape-product-content ${
            isJar
              ? "product-jar-content relative z-10 flex min-w-0 flex-1 flex-col gap-2 pb-6 pt-3"
              : "relative z-10 flex min-w-0 flex-1 flex-col gap-2 pb-6 pt-4"
          }`}
        >
          <Link ref={productNameRef} href={`/product/${product.slug}`} className="landscape-product-name w-full min-w-0 overflow-hidden whitespace-nowrap px-3 text-[clamp(10px,3.4vw,14px)] leading-tight font-bold text-slate-900 hover:text-red-600 sm:px-5 sm:text-lg sm:leading-5">
            {localizedProduct.name}
          </Link>

          <div className="landscape-product-price-row flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1 px-3 sm:px-[25px]">
            <span className="landscape-product-price shrink-0 whitespace-nowrap text-lg font-extrabold text-slate-900 sm:text-xl">৳{product.salePrice ?? product.price}</span>
            {product.salePrice ? (
              <span className="min-w-0 text-sm text-slate-400 line-through">৳{product.price}</span>
            ) : null}
            <span className="landscape-product-unit ml-auto whitespace-nowrap text-right text-xs font-medium text-slate-500 sm:text-sm">{displayUnit}</span>
          </div>

          <div className="landscape-product-rating mb-[5px] flex justify-start px-3 text-xs text-slate-500 sm:px-[25px]">
            <span
              aria-label={`${product.rating} out of 5 stars`}
              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-medium leading-none text-amber-500"
            >
              <span aria-hidden="true" className="inline-flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star key={index} className="h-3 w-3 shrink-0 fill-current" />
                ))}
              </span>
              {product.rating}
            </span>
          </div>

          <div className="landscape-product-actions grid w-full min-w-0 grid-cols-2 gap-1 px-3 sm:gap-2 sm:px-5">
            <button
              type="button"
              onClick={() => {
                addItem(product, 1);
                router.push("/checkout");
              }}
              className="inline-flex h-6 min-w-0 items-center justify-center rounded-full bg-[#16803c] px-0 font-semibold text-white transition hover:bg-[#116b32] sm:h-9 sm:px-2"
            >
              <span
                style={{
                  maxWidth: "100%",
                  overflowWrap: "anywhere",
                  textAlign: "center",
                  fontSize: "clamp(8px, 2.2vw, 14px)",
                  lineHeight: 1.1,
                }}
              >
                {t("Buy Now")}
              </span>
            </button>
            <button
              type="button"
              onClick={() => addItem(product, 1)}
              className="inline-flex h-6 min-w-0 items-center justify-center rounded-full bg-[#b85c00] px-0 font-semibold text-white transition hover:bg-[#984b00] sm:h-9 sm:px-2"
            >
              <span
                style={{
                  maxWidth: "100%",
                  overflowWrap: "anywhere",
                  textAlign: "center",
                  fontSize: "clamp(8px, 2.2vw, 14px)",
                  lineHeight: 1.1,
                }}
              >
                {t("Add to Cart")}
              </span>
            </button>
            <a
              href={getWhatsAppUrl(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 inline-flex h-7 items-center justify-center gap-1 rounded-full bg-[#25D366] px-2 text-[10px] font-semibold text-white transition hover:bg-[#1ebe5d] sm:h-9 sm:gap-2 sm:px-3 sm:text-sm"
            >
              <MessageCircle aria-hidden="true" size={14} className="shrink-0 sm:size-4" />
              <span className="truncate">{t("WhatsApp Order")}</span>
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
