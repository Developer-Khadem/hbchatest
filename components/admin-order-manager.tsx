"use client";

import { useCallback, useEffect, useState } from "react";
import { Clipboard, Download, RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/language-context";

type AdminOrder = {
  id: string;
  orderNumber: string | null;
  customer: string;
  phone: string;
  division: string | null;
  district: string | null;
  upazila: string | null;
  area: string | null;
  road: string | null;
  address: string;
  customerNote: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  transactionId: string | null;
  payerPhone: string | null;
  createdAt: string;
  orderItems: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
};

const orderStatuses = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "PENDING_VERIFICATION",
] as const;

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function isAdminOrder(value: unknown): value is AdminOrder {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const order = value as Record<string, unknown>;
  return (
    typeof order.id === "string" &&
    (typeof order.orderNumber === "string" || order.orderNumber === null) &&
    typeof order.customer === "string" &&
    typeof order.phone === "string" &&
    (typeof order.division === "string" || order.division === null) &&
    (typeof order.district === "string" || order.district === null) &&
    (typeof order.upazila === "string" || order.upazila === null) &&
    (typeof order.area === "string" || order.area === null) &&
    (typeof order.road === "string" || order.road === null) &&
    typeof order.address === "string" &&
    (typeof order.customerNote === "string" || order.customerNote === null) &&
    typeof order.subtotal === "number" &&
    typeof order.deliveryFee === "number" &&
    typeof order.total === "number" &&
    typeof order.status === "string" &&
    typeof order.paymentStatus === "string" &&
    typeof order.paymentMethod === "string" &&
    (typeof order.transactionId === "string" || order.transactionId === null) &&
    (typeof order.payerPhone === "string" || order.payerPhone === null) &&
    typeof order.createdAt === "string" &&
    Array.isArray(order.orderItems) &&
    order.orderItems.every((item: unknown) => {
      if (typeof item !== "object" || item === null || Array.isArray(item)) return false;
      const orderItem = item as Record<string, unknown>;
      return (
        typeof orderItem.id === "string" &&
        typeof orderItem.name === "string" &&
        typeof orderItem.quantity === "number" &&
        typeof orderItem.unitPrice === "number"
      );
    })
  );
}

export function AdminOrderManager() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const response = await fetch("/api/admin/orders", { cache: "no-store" });
    const result: unknown = await response.json();
    if (
      !response.ok ||
      typeof result !== "object" ||
      result === null ||
      !("orders" in result) ||
      !Array.isArray(result.orders) ||
      !result.orders.every(isAdminOrder)
    ) {
      const message =
        typeof result === "object" &&
        result !== null &&
        "error" in result &&
        typeof result.error === "string"
          ? result.error
          : "Unable to load orders.";
      throw new Error(message);
    }
    return result.orders;
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      setOrders(await fetchOrders());
    } catch (loadError) {
      console.error("Unable to load admin orders", loadError);
      setError(loadError instanceof Error ? loadError.message : "Unable to load orders.");
    } finally {
      setIsLoading(false);
    }
  }, [fetchOrders]);

  useEffect(() => {
    let active = true;
    fetchOrders()
      .then((loadedOrders) => {
        if (active) setOrders(loadedOrders);
      })
      .catch((loadError: unknown) => {
        console.error("Unable to load admin orders", loadError);
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load orders.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchOrders]);

  const updateStatus = async (order: AdminOrder, status: string) => {
    setError("");
    setUpdatingOrderId(order.id);
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, status }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Unable to update this order.";
        throw new Error(message);
      }
      await loadOrders();
    } catch (updateError) {
      console.error("Unable to update admin order status", updateError);
      setError(updateError instanceof Error ? updateError.message : "Unable to update this order.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const copyCourierSlip = async (order: AdminOrder) => {
    const deliveryAddress = [
      order.road,
      order.area,
      order.upazila,
      order.district,
      order.division,
      order.address,
    ].filter(Boolean).join(", ");
    const slip = [
      `Order: ${order.orderNumber ?? order.id}`,
      `Customer: ${order.customer}`,
      `Phone: ${order.phone}`,
      `Address: ${deliveryAddress}`,
      `Items: ${order.orderItems.map((item) => `${item.name} x ${item.quantity}`).join(", ")}`,
      `Payment: ${order.paymentMethod} (${order.paymentStatus})`,
      ...(order.paymentMethod === "CASH_ON_DELIVERY" ? [`COD collect: BDT ${order.total}`] : []),
      `Total: BDT ${order.total}`,
      ...(order.customerNote ? [`Note: ${order.customerNote}`] : []),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(slip);
      setCopiedOrderId(order.id);
      window.setTimeout(() => setCopiedOrderId((current) => current === order.id ? null : current), 2000);
    } catch (copyError) {
      console.error("Unable to copy courier order details", copyError);
      setError("Unable to copy courier details. Please select and copy the order information.");
    }
  };

  const exportOrders = () => {
    const rows = [
      ["Order", "Customer", "Phone", "Address", "Items", "Subtotal", "Delivery fee", "Total", "Payment", "Payment status", "Order status"],
      ...orders.map((order) => [
        order.orderNumber ?? order.id,
        order.customer,
        order.phone,
        [order.road, order.area, order.upazila, order.district, order.division, order.address].filter(Boolean).join(", "),
        order.orderItems.map((item) => `${item.name} x ${item.quantity}`).join("; "),
        order.subtotal,
        order.deliveryFee,
        order.total,
        order.paymentMethod,
        order.paymentStatus,
        order.status,
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "hbca-customer-orders.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="orders" className="mt-5 scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">{t("Customer orders")}</h2>
          <p className="mt-1 text-xs text-slate-500">{t("Courier-ready customer, delivery, item, and payment details.")}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { setError(""); setIsLoading(true); void loadOrders(); }} disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            <RefreshCw size={15} /> {t("Refresh")}
          </button>
          <button type="button" onClick={exportOrders} disabled={orders.length === 0} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            <Download size={15} /> {t("Export CSV")}
          </button>
        </div>
      </div>

      {error ? <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{t(error)}</p> : null}
      {isLoading ? <p className="mt-5 text-sm text-slate-500">{t("Loading orders...")}</p> : null}
      {!isLoading && !error && orders.length === 0 ? <p className="mt-5 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">{t("No customer orders yet.")}</p> : null}

      <div className="mt-4 space-y-4">
        {orders.map((order) => {
          const orderNumber = order.orderNumber ?? order.id;
          const deliveryAddress = [
            order.road,
            order.area,
            order.upazila,
            order.district,
            order.division,
            order.address,
          ].filter(Boolean).join(", ");

          return (
            <article key={order.id} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-black text-slate-900">{orderNumber}</h3>
                  <p className="mt-1 text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  {t("Order status")}
                  <select
                    aria-label={`${t("Order status")} ${orderNumber}`}
                    value={order.status}
                    disabled={updatingOrderId === order.id}
                    onChange={(event) => void updateStatus(order, event.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-800"
                  >
                    {orderStatuses.map((status) => <option key={status} value={status}>{t(status)}</option>)}
                  </select>
                </label>
              </div>

              <div className="mt-4 grid gap-5 lg:grid-cols-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("Customer and delivery")}</h4>
                  <p className="mt-2 font-bold text-slate-900">{order.customer}</p>
                  <a href={`tel:${order.phone}`} className="mt-1 inline-block text-sm font-semibold text-emerald-800 underline">{order.phone}</a>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{deliveryAddress}</p>
                  {order.customerNote ? <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><strong>{t("Order Note")}:</strong> {order.customerNote}</p> : null}
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("Items and payment")}</h4>
                  <ul className="mt-2 space-y-2">
                    {order.orderItems.map((item) => (
                      <li key={item.id} className="flex justify-between gap-3 text-sm">
                        <span>{item.name} × {item.quantity}</span>
                        <span className="shrink-0 font-semibold">৳{item.unitPrice * item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
                    <p className="flex justify-between"><span>{t("Subtotal")}</span><span>৳{order.subtotal}</span></p>
                    <p className="flex justify-between"><span>{t("Delivery fee")}</span><span>৳{order.deliveryFee}</span></p>
                    <p className="flex justify-between font-black"><span>{t("Total")}</span><span>৳{order.total}</span></p>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">{t(order.paymentMethod)} · {t(order.paymentStatus)}</p>
                  {order.transactionId ? <p className="mt-1 text-xs text-slate-600">{t("Transaction ID")}: {order.transactionId} · {t("Payer mobile number")}: {order.payerPhone}</p> : null}
                  {order.paymentMethod === "CASH_ON_DELIVERY" ? <p className="mt-1 text-sm font-bold text-emerald-800">{t("COD collect")}: ৳{order.total}</p> : null}
                </div>
              </div>

              <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
                <button type="button" onClick={() => void copyCourierSlip(order)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">
                  <Clipboard size={16} /> {t(copiedOrderId === order.id ? "Copied" : "Copy courier details")}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {!isLoading && orders.length > 0 ? <p className="mt-4 text-xs text-slate-500">{t("Showing the latest 200 customer orders.")}</p> : null}
    </section>
  );
}
