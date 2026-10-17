"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, LifeBuoy, RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/language-context";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

type SupportTicket = {
  id: string;
  ticketNumber: string;
  name: string;
  phone: string;
  subject: string;
  category: string;
  message: string;
  status: TicketStatus;
  createdAt: string;
};

type TicketsResponse = {
  tickets?: SupportTicket[];
  error?: string;
};

const ticketStatuses: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED"];

export function AdminSupportTicketManager() {
  const { t } = useLanguage();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  const loadTickets = useCallback(async () => {
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/support-tickets", { cache: "no-store" });
      const result = (await response.json()) as TicketsResponse;
      if (!response.ok || !Array.isArray(result.tickets)) {
        throw new Error(result.error || "Unable to load support tickets.");
      }
      setTickets(result.tickets);
    } catch (loadError) {
      console.error("Unable to load admin support tickets", loadError);
      setError(loadError instanceof Error ? loadError.message : "Unable to load support tickets.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadTickets(), 0);
    return () => window.clearTimeout(timer);
  }, [loadTickets]);

  const updateStatus = async (ticket: SupportTicket, status: TicketStatus) => {
    setError("");
    setUpdatingId(ticket.id);
    try {
      const response = await fetch("/api/admin/support-tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticket.id, status }),
      });
      const result = (await response.json()) as { ticket?: SupportTicket; error?: string };
      const updatedTicket = result.ticket;
      if (!response.ok || !updatedTicket) {
        throw new Error(result.error || "Unable to update this support ticket.");
      }
      setTickets((current) => current.map((item) => item.id === ticket.id ? updatedTicket : item));
    } catch (updateError) {
      console.error("Unable to update admin support ticket", updateError);
      setError(updateError instanceof Error ? updateError.message : "Unable to update this support ticket.");
    } finally {
      setUpdatingId("");
    }
  };

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <section id="support-tickets" className="mt-5 scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <LifeBuoy size={20} />
          </span>
          <div>
            <h2 className="text-lg font-extrabold">{t("Support Tickets")}</h2>
            <p className="mt-1 text-xs text-slate-500">{t("Review customer requests and update their status.")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadTickets()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          {t("Refresh")}
        </button>
      </div>

      {error ? <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{t(error)}</p> : null}

      {isLoading ? (
        <p className="mt-6 text-sm text-slate-500" role="status">{t("Loading support tickets...")}</p>
      ) : tickets.length === 0 ? (
        <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{t("No support tickets yet.")}</p>
      ) : (
        <div className="mt-5 space-y-4">
          {tickets.map((ticket) => {
            const customerPhone = `880${ticket.phone.replace(/\D/g, "").replace(/^0/, "")}`;
            const whatsappMessage = `${t("Hello")} ${ticket.name}, ${t("regarding your support ticket")} ${ticket.ticketNumber}: `;
            const whatsappHref = `https://wa.me/${customerPhone}?text=${encodeURIComponent(whatsappMessage)}`;

            return (
              <article key={ticket.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black tracking-wide text-emerald-800">{ticket.ticketNumber}</p>
                    <h3 className="mt-1 break-words font-bold text-slate-900">{ticket.subject}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {ticket.name} · {ticket.phone} · {t(ticket.category)} · {dateFormatter.format(new Date(ticket.createdAt))}
                    </p>
                  </div>
                  <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-600">
                    {t("Status")}
                    <select
                      value={ticket.status}
                      disabled={updatingId === ticket.id}
                      onChange={(event) => void updateStatus(ticket, event.target.value as TicketStatus)}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 disabled:opacity-60"
                    >
                      {ticketStatuses.map((status) => (
                        <option key={status} value={status}>{t(status)}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{ticket.message}</p>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950"
                >
                  {t("Contact customer on WhatsApp")} <ExternalLink size={13} />
                </a>
              </article>
            );
          })}
        </div>
      )}
      {!isLoading && tickets.length === 100 ? (
        <p className="mt-4 text-xs text-slate-500">{t("Showing the latest 100 support tickets.")}</p>
      ) : null}
    </section>
  );
}
