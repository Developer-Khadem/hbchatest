"use client";

import { Suspense } from "react";
import { usePathname as useCurrentPathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { Header } from "@/components/header";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen">{children}</div>}>
      <RouteAwareShell>{children}</RouteAwareShell>
    </Suspense>
  );
}

function RouteAwareShell({ children }: { children: ReactNode }) {
  const pathname = useCurrentPathname();
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || isAdminRoute || !("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | undefined;
    const handlePageHide = (event: PageTransitionEvent) => {
      if (event.persisted) return;
      const worker = registration?.active ?? navigator.serviceWorker.controller;
      worker?.postMessage({ type: "END_BROWSING_SESSION" });
    };

    window.addEventListener("pagehide", handlePageHide);
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((value) => {
        registration = value;
      })
      .catch((error: unknown) => {
        console.error("Unable to register the session asset cache", error);
      });

    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [isAdminRoute]);

  return (
    <div className={isAdminRoute ? "min-h-screen" : "site-shell min-h-screen"}>
      {!isAdminRoute ? <Header /> : null}
      {children}
      {!isAdminRoute ? <Footer /> : null}
      {!isAdminRoute ? <FloatingActions /> : null}
      {!isAdminRoute ? <MobileScrollIndicator /> : null}
    </div>
  );
}

function MobileScrollIndicator() {
  const indicatorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;

    const updateIndicator = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const indicator = indicatorRef.current;
        if (!indicator || !window.matchMedia("(max-width: 640px)").matches) return;

        const viewportHeight = window.innerHeight;
        const scrollHeight = Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
        );
        const scrollRange = Math.max(0, scrollHeight - viewportHeight);
        const indicatorHeight = Math.max(1, (viewportHeight * viewportHeight) / scrollHeight / 2);
        const indicatorTop =
          scrollRange > 0
            ? (window.scrollY / scrollRange) * (viewportHeight - indicatorHeight)
            : 0;

        indicator.style.height = `${indicatorHeight}px`;
        indicator.style.top = `${indicatorTop}px`;
      });
    };

    const observer = new ResizeObserver(updateIndicator);
    observer.observe(document.documentElement);
    observer.observe(document.body);
    window.addEventListener("scroll", updateIndicator, { passive: true });
    window.addEventListener("resize", updateIndicator);
    updateIndicator();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", updateIndicator);
      window.removeEventListener("resize", updateIndicator);
    };
  }, []);

  return <span ref={indicatorRef} aria-hidden="true" className="mobile-scroll-indicator" />;
}
