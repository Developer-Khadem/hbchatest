"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ArrowUp } from "lucide-react";
import { useLanguage } from "@/components/language-context";
import { getWhatsAppUrl } from "@/lib/whatsapp";

export function FloatingActions() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [whatsAppPosition, setWhatsAppPosition] = useState<{ left: number; top: number } | null>(null);
  const [isDraggingWhatsApp, setIsDraggingWhatsApp] = useState(false);
  const dragStart = useRef<{
    pointerId: number;
    pointerX: number;
    pointerY: number;
    left: number;
    top: number;
    width: number;
    height: number;
    nextLeft: number;
    nextTop: number;
    moved: boolean;
    element: HTMLAnchorElement;
  } | null>(null);
  const suppressWhatsAppClick = useRef(false);
  const { t } = useLanguage();

  useEffect(() => {
    const updateVisibility = () => setShowBackToTop(window.scrollY > 300);

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  const handleWhatsAppPointerDown = (event: PointerEvent<HTMLAnchorElement>) => {
    if (event.button !== 0) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    dragStart.current = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
      nextLeft: bounds.left,
      nextTop: bounds.top,
      moved: false,
      element: event.currentTarget,
    };
    event.currentTarget.style.position = "fixed";
    event.currentTarget.style.left = `${bounds.left}px`;
    event.currentTarget.style.top = `${bounds.top}px`;
    event.currentTarget.style.right = "auto";
    event.currentTarget.style.bottom = "auto";
    setWhatsAppPosition({ left: bounds.left, top: bounds.top });
    setIsDraggingWhatsApp(true);
  };

  useEffect(() => {
    const handlePointerMove = (event: globalThis.PointerEvent) => {
      const start = dragStart.current;
      if (!start || event.pointerId !== start.pointerId) return;

      const deltaX = event.clientX - start.pointerX;
      const deltaY = event.clientY - start.pointerY;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 4) start.moved = true;

      if (start.moved) {
        start.nextLeft = Math.max(0, Math.min(window.innerWidth - start.width, start.left + deltaX));
        start.nextTop = Math.max(0, Math.min(window.innerHeight - start.height, start.top + deltaY));
        start.element.style.transform = `translate3d(${start.nextLeft - start.left}px, ${start.nextTop - start.top}px, 0)`;
      }
    };

    const finishDrag = (event: globalThis.PointerEvent) => {
      const start = dragStart.current;
      if (!start || event.pointerId !== start.pointerId) return;

      start.element.style.left = `${start.nextLeft}px`;
      start.element.style.top = `${start.nextTop}px`;
      start.element.style.transform = "";
      setWhatsAppPosition({ left: start.nextLeft, top: start.nextTop });
      if (start.moved) suppressWhatsAppClick.current = true;
      dragStart.current = null;
      setIsDraggingWhatsApp(false);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
    };
  }, []);

  return (
    <div className="landscape-floating-actions fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-50 flex flex-col-reverse items-center gap-3 sm:bottom-7 sm:right-7">
      {showBackToTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label={t("Back to top")}
          title={t("Back to top")}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:-translate-y-1 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          <ArrowUp aria-hidden="true" size={21} />
        </button>
      ) : null}

      <a
        href={getWhatsAppUrl()}
        target="_blank"
        rel="noopener noreferrer"
        draggable={false}
        aria-label={t("WhatsApp chat")}
        title={t("WhatsApp chat")}
        style={whatsAppPosition ? { left: whatsAppPosition.left, top: whatsAppPosition.top } : undefined}
        onPointerDown={handleWhatsAppPointerDown}
        onDragStart={(event) => event.preventDefault()}
        onClick={(event) => {
          if (suppressWhatsAppClick.current) {
            event.preventDefault();
            suppressWhatsAppClick.current = false;
          }
        }}
        className={`whatsapp-pulse inline-flex h-12 w-12 touch-none items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-colors hover:bg-[#1ebe5d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#128C7E] ${
          whatsAppPosition ? "fixed bottom-auto right-auto" : ""
        } ${isDraggingWhatsApp ? "will-change-transform cursor-grabbing" : "cursor-grab"}`}
      >
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className="h-6 w-6">
          <path
            d="M16 3.2a12.5 12.5 0 0 0-10.7 19L3.7 28l6-1.6A12.5 12.5 0 1 0 16 3.2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M12.1 10.5c-.4-.8-.8-.8-1.2-.8h-1c-.4 0-.9.2-1.2.7-.4.5-1.6 1.5-1.6 3.7s1.6 4.2 1.8 4.5c.2.3 3.1 5 7.6 6.8 3.8 1.5 4.6 1.2 5.4 1.1.8-.1 2.7-1.1 3.1-2.1.4-1 .4-1.9.3-2.1-.1-.2-.4-.3-.9-.6s-2.7-1.3-3.1-1.4c-.4-.2-.7-.3-1 .3-.3.5-1.2 1.4-1.5 1.7-.3.3-.6.4-1.1.1-.5-.2-2-.7-3.8-2.3-1.4-1.2-2.3-2.7-2.6-3.2-.3-.5 0-.8.2-1 .2-.2.5-.6.7-.8.2-.3.3-.5.5-.8.2-.3.1-.6 0-.8-.1-.2-1-2.4-1.4-3.2Z"
            fill="currentColor"
            transform="translate(4 0) scale(.78)"
          />
        </svg>
      </a>
    </div>
  );
}
