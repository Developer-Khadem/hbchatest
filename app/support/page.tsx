import type { Metadata } from "next";
import { SupportTicketForm } from "@/components/support-ticket-form";

export const metadata: Metadata = {
  title: "Support Ticket | H B C Achar Shop",
  description: "Contact H B C Achar Shop customer support by submitting a support ticket.",
};

export default function SupportPage() {
  return (
    <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">H B C Achar Shop</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">Support Ticket</h1>
        <p className="mt-3 text-slate-600">
          Tell us how we can help. Submit your request and keep the ticket number for reference.
        </p>
        <SupportTicketForm />
      </div>
    </main>
  );
}
