import { randomBytes } from "node:crypto";
import { isValidBangladeshPhone, normalizeBangladeshPhone } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ticketCategories = ["Order", "Delivery", "Payment", "Product", "Return or refund", "Other"] as const;
const MAX_TICKETS_PER_PHONE_WINDOW = 3;
const PHONE_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

type TicketSubmission = {
  name?: unknown;
  phone?: unknown;
  subject?: unknown;
  category?: unknown;
  message?: unknown;
  website?: unknown;
};

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  let body: TicketSubmission;
  try {
    body = (await request.json()) as TicketSubmission;
  } catch {
    return jsonError("Invalid support ticket request.", 400);
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return jsonError("Invalid support ticket request.", 400);
  }
  if (typeof body.website === "string" && body.website.trim()) {
    return jsonError("Unable to submit this support ticket.", 400);
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? normalizeBangladeshPhone(body.phone) : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const category = typeof body.category === "string" ? body.category : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (name.length < 2 || name.length > 100) {
    return jsonError("Name must be between 2 and 100 characters.", 400);
  }
  if (!isValidBangladeshPhone(phone)) {
    return jsonError("Enter a valid 11-digit Bangladesh mobile number.", 400);
  }
  if (subject.length < 3 || subject.length > 120) {
    return jsonError("Subject must be between 3 and 120 characters.", 400);
  }
  if (!(ticketCategories as readonly string[]).includes(category)) {
    return jsonError("Choose a valid ticket category.", 400);
  }
  if (message.length < 10 || message.length > 3000) {
    return jsonError("Message must be between 10 and 3000 characters.", 400);
  }

  try {
    const recentTicketCount = await prisma.supportTicket.count({
      where: {
        phone,
        createdAt: { gte: new Date(Date.now() - PHONE_RATE_LIMIT_WINDOW_MS) },
      },
    });
    if (recentTicketCount >= MAX_TICKETS_PER_PHONE_WINDOW) {
      return jsonError("Too many tickets from this phone number. Please try again later.", 429);
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: `HBCA-${randomBytes(5).toString("hex").toUpperCase()}`,
        name,
        phone,
        subject,
        category,
        message,
      },
      select: { ticketNumber: true, createdAt: true },
    });

    return Response.json(
      { ticketNumber: ticket.ticketNumber, createdAt: ticket.createdAt },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Unable to create support ticket", error);
    return jsonError("Unable to submit your support ticket. Please try again.", 503);
  }
}
