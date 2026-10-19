import { randomBytes } from "node:crypto";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { isValidBangladeshPhone, normalizeBangladeshPhone } from "@/lib/auth";
import bangladeshLocations from "@/lib/bangladesh-locations.json";
import { districtDeliveryFees } from "@/lib/site-data";
import { prisma } from "@/lib/prisma";

type OrderRequest = {
  customer?: unknown;
  phone?: unknown;
  division?: unknown;
  district?: unknown;
  upazila?: unknown;
  area?: unknown;
  road?: unknown;
  address?: unknown;
  note?: unknown;
  paymentMethod?: unknown;
  transactionId?: unknown;
  payerPhone?: unknown;
  items?: unknown;
  website?: unknown;
};

type RequestedItem = { productId: string; quantity: number };

const MAX_ORDERS_PER_PHONE_WINDOW = 5;
const PHONE_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const orderMethods = ["CASH_ON_DELIVERY", "DIGITAL_WALLET"] as const;

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

function readText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length <= maxLength ? text : null;
}

function parseOrderItems(value: unknown): RequestedItem[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 30) return null;

  const quantities = new Map<string, number>();
  for (const item of value) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) return null;
    const record = item as Record<string, unknown>;
    if (
      typeof record.productId !== "string" ||
      record.productId.length === 0 ||
      record.productId.length > 100 ||
      typeof record.quantity !== "number" ||
      !Number.isInteger(record.quantity) ||
      record.quantity < 1 ||
      record.quantity > 20
    ) {
      return null;
    }
    quantities.set(record.productId, (quantities.get(record.productId) ?? 0) + record.quantity);
  }

  if ([...quantities.values()].some((quantity) => quantity > 20)) return null;
  return [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
}

export async function POST(request: Request) {
  let body: OrderRequest;
  try {
    body = (await request.json()) as OrderRequest;
  } catch {
    return jsonError("Invalid order request.", 400);
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return jsonError("Invalid order request.", 400);
  }
  if (typeof body.website === "string" && body.website.trim()) {
    return jsonError("Unable to place this order.", 400);
  }

  const customer = readText(body.customer, 100);
  const phone = typeof body.phone === "string" ? normalizeBangladeshPhone(body.phone) : "";
  const division = readText(body.division, 80);
  const district = readText(body.district, 80);
  const upazila = readText(body.upazila, 100);
  const area = readText(body.area, 100);
  const road = readText(body.road, 200);
  const address = readText(body.address, 500);
  const note = readText(body.note ?? "", 1000);
  const paymentMethod =
    typeof body.paymentMethod === "string" &&
    (orderMethods as readonly string[]).includes(body.paymentMethod)
      ? body.paymentMethod
      : null;
  const items = parseOrderItems(body.items);

  if (!customer || customer.length < 2) return jsonError("Enter your name (2-100 characters).", 400);
  if (!isValidBangladeshPhone(phone)) return jsonError("Enter a valid 11-digit Bangladesh mobile number.", 400);
  if (!district || !upazila || !address || address.length < 5) {
    return jsonError("Complete your delivery address.", 400);
  }
  const matchingDivisions = division
    ? bangladeshLocations.divisions.filter((entry) => entry.name === division)
    : bangladeshLocations.divisions;
  const divisionEntry = matchingDivisions.find((entry) =>
    entry.districts.some((entry) => entry.name === district && entry.upazilas.includes(upazila)),
  );
  if (!divisionEntry) {
    return jsonError("Choose a valid district and upazila.", 400);
  }
  if (!note) return jsonError("Order note must be 1000 characters or fewer.", 400);
  if (!items) return jsonError("Your cart is empty or contains invalid items.", 400);
  if (!paymentMethod) {
    return jsonError("Choose a valid payment method.", 400);
  }

  const transactionId = paymentMethod === "DIGITAL_WALLET"
    ? readText(body.transactionId, 100)
    : null;
  const payerPhone = paymentMethod === "DIGITAL_WALLET" &&
    typeof body.payerPhone === "string" &&
    body.payerPhone.trim()
    ? normalizeBangladeshPhone(body.payerPhone)
    : null;
  if (
    paymentMethod === "DIGITAL_WALLET" &&
    (!transactionId || transactionId.length < 4 || !payerPhone || !isValidBangladeshPhone(payerPhone))
  ) {
    return jsonError("Enter a valid Nagad transaction ID and payer phone number.", 400);
  }

  try {
    const recentOrders = await prisma.order.count({
      where: {
        phone,
        createdAt: { gte: new Date(Date.now() - PHONE_RATE_LIMIT_WINDOW_MS) },
      },
    });
    if (recentOrders >= MAX_ORDERS_PER_PHONE_WINDOW) {
      return jsonError("Too many orders from this phone number. Please try again later.", 429);
    }

    const products = await prisma.acharProduct.findMany({
      where: { id: { in: items.map((item) => item.productId) }, isActive: true },
      select: { id: true, name: true, price: true, salePrice: true, stock: true, inStock: true },
    });
    if (products.length !== items.length) {
      return jsonError("One or more products are no longer available. Please refresh your cart.", 409);
    }

    const productById = new Map(products.map((product) => [product.id, product]));
    const orderItems = items.map(({ productId, quantity }) => {
      const product = productById.get(productId);
      if (!product || !product.inStock || product.stock < quantity) return null;
      return {
        productId,
        name: product.name,
        quantity,
        unitPrice: product.salePrice ?? product.price,
      };
    });
    if (orderItems.some((item) => item === null)) {
      return jsonError("One or more products do not have enough stock. Please update your cart.", 409);
    }

    const pricedItems = orderItems.filter((item) => item !== null);
    const subtotal = pricedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const deliveryFee = districtDeliveryFees.find((entry) => entry.district === district)?.fee ?? 60;
    const orderNumber = `HBC-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const status = paymentMethod === "DIGITAL_WALLET"
      ? OrderStatus.PENDING_VERIFICATION
      : OrderStatus.PENDING;
    const paymentStatus = paymentMethod === "DIGITAL_WALLET"
      ? PaymentStatus.PENDING_VERIFICATION
      : PaymentStatus.UNPAID;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customer,
        phone,
        division: divisionEntry.name,
        district,
        upazila,
        area,
        road,
        address,
        customerNote: note || null,
        subtotal,
        discount: 0,
        deliveryFee,
        total: subtotal + deliveryFee,
        status,
        paymentStatus,
        paymentMethod,
        transactionId,
        payerPhone,
        orderItems: { create: pricedItems },
        trackingHistory: {
          create: {
            status,
            message: "Order received from customer.",
          },
        },
      },
      select: {
        orderNumber: true,
        customer: true,
        phone: true,
        division: true,
        district: true,
        upazila: true,
        road: true,
        address: true,
        subtotal: true,
        discount: true,
        deliveryFee: true,
        total: true,
        createdAt: true,
        orderItems: { select: { id: true, name: true, quantity: true, unitPrice: true } },
      },
    });

    return Response.json(
      { order: { ...order, createdAt: order.createdAt.toISOString() } },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Unable to create customer order", error);
    return jsonError("Unable to place your order right now. Please try again.", 503);
  }
}
