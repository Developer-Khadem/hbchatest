import { Prisma } from "@prisma/client";
import { authorizeAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

const ticketStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;

export async function GET(request: Request) {
  const authorizationError = await authorizeAdminApi(request);
  if (authorizationError) return authorizationError;

  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return Response.json({ tickets }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to load admin support tickets", error);
    return Response.json({ error: "Unable to load support tickets." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const authorizationError = await authorizeAdminApi(request);
  if (authorizationError) return authorizationError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid support ticket update." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "Invalid support ticket update." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    record.id.length > 100 ||
    typeof record.status !== "string" ||
    !(ticketStatuses as readonly string[]).includes(record.status)
  ) {
    return Response.json({ error: "Choose a valid support ticket status." }, { status: 400 });
  }

  try {
    const ticket = await prisma.supportTicket.update({
      where: { id: record.id },
      data: { status: record.status as (typeof ticketStatuses)[number] },
    });
    return Response.json({ ticket });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return Response.json({ error: "Support ticket not found." }, { status: 404 });
    }
    console.error("Unable to update admin support ticket", error);
    return Response.json({ error: "Unable to update this support ticket." }, { status: 503 });
  }
}
