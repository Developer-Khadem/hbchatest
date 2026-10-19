import { Prisma } from "@prisma/client";
import { authorizeAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

const orderStatuses = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "PENDING_VERIFICATION",
] as const;

export async function GET(request: Request) {
  const authorizationError = await authorizeAdminApi(request);
  if (authorizationError) return authorizationError;

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { orderItems: true },
    });
    return Response.json(
      { orders },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Unable to load admin orders", error);
    return Response.json({ error: "Unable to load orders." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const authorizationError = await authorizeAdminApi(request);
  if (authorizationError) return authorizationError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid order update." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "Invalid order update." }, { status: 400 });
  }
  const record = body as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    record.id.length > 100 ||
    typeof record.status !== "string" ||
    !(orderStatuses as readonly string[]).includes(record.status)
  ) {
    return Response.json({ error: "Choose a valid order status." }, { status: 400 });
  }

  try {
    const status = record.status as (typeof orderStatuses)[number];
    const order = await prisma.order.update({
      where: { id: record.id },
      data: {
        status,
        trackingHistory: {
          create: {
            status,
            message: `Order status updated to ${status}.`,
          },
        },
      },
      include: { orderItems: true },
    });
    return Response.json({ order });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }
    console.error("Unable to update admin order", error);
    return Response.json({ error: "Unable to update this order." }, { status: 503 });
  }
}
