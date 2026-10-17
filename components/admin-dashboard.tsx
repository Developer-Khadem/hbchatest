"use client";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Boxes,
  ChartNoAxesCombined,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Download,
  LifeBuoy,
  Menu,
  MessageSquareText,
  Package,
  PackageCheck,
  Printer,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminProductManager } from "@/components/admin-product-manager";
import { AdminSupportTicketManager } from "@/components/admin-support-ticket-manager";
import { useLanguage } from "@/components/language-context";
import { products, recentOrders, storeInfo } from "@/lib/site-data";

const salesSeries = {
  day: {
    title: "Today",
    total: "৳ 18,450",
    change: "+12.8%",
    values: [28, 38, 32, 52, 45, 65, 58, 78, 68, 88, 74, 96],
    labels: ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM"],
  },
  week: {
    title: "This week",
    total: "৳ 1,24,800",
    change: "+8.4%",
    values: [34, 47, 41, 69, 56, 78, 64, 92, 73, 84, 69, 96],
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  month: {
    title: "This month",
    total: "৳ 4,82,350",
    change: "+16.2%",
    values: [24, 40, 35, 55, 48, 67, 59, 76, 68, 88, 74, 96],
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
  },
} as const;

const orderStatuses = [
  { label: "Pending", count: 18, icon: ClipboardList, tone: "amber" },
  { label: "Processing", count: 24, icon: Package, tone: "blue" },
  { label: "Delivered", count: 128, icon: CheckCircle2, tone: "emerald" },
  { label: "Returned", count: 6, icon: RotateCcw, tone: "rose" },
] as const;

const topSellingProducts = [
  { slug: "mango-achar-classic", sold: 248, revenue: "৳ 44,640" },
  { slug: "shrimp-balachao-spicy", sold: 186, revenue: "৳ 66,960" },
  { slug: "mixed-pickle-premium", sold: 152, revenue: "৳ 39,520" },
  { slug: "combo-pack-family", sold: 94, revenue: "৳ 77,080" },
];

const navItems = [
  { label: "Overview", href: "#overview", icon: ChartNoAxesCombined },
  { label: "Orders", href: "#orders", icon: ShoppingBag, badge: "12" },
  { label: "Products", href: "#product-management", icon: Boxes },
  { label: "Inventory", href: "#inventory", icon: PackageCheck, badge: "2" },
  { label: "Payments", href: "#payments", icon: Wallet },
  { label: "Customers & Reviews", href: "#customers", icon: UsersRound },
  { label: "Marketing", href: "#marketing", icon: MessageSquareText },
  { label: "Support Tickets", href: "#support-tickets", icon: LifeBuoy },
  { label: "Team & Security", href: "#security", icon: ShieldCheck },
] as const;

const managementAreas = [
  {
    title: "Products & Catalog",
    description: "Edit pickle details, jar sizes, prices, photos and offers.",
    icon: Boxes,
    href: "#product-management",
    color: "bg-orange-50 text-orange-700",
  },
  {
    title: "Orders & Delivery",
    description: "Review orders, update statuses and prepare delivery slips.",
    icon: Truck,
    href: "#orders",
    color: "bg-sky-50 text-sky-700",
  },
  {
    title: "Payments & Reports",
    description: "Track COD, digital payments and export sales reports.",
    icon: CircleDollarSign,
    href: "#payments",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Customers & Reviews",
    description: "Customer history, special notes and review moderation.",
    icon: Star,
    href: "#customers",
    color: "bg-violet-50 text-violet-700",
  },
  {
    title: "Marketing & Offers",
    description: "Coupons, bundles and abandoned-cart follow-up.",
    icon: MessageSquareText,
    href: "#marketing",
    color: "bg-pink-50 text-pink-700",
  },
  {
    title: "Team & Permissions",
    description: "Admin, manager and delivery staff access overview.",
    icon: ShieldCheck,
    href: "#security",
    color: "bg-slate-100 text-slate-700",
  },
] as const;

function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

function downloadOrdersCsv() {
  const rows = [
    ["Order", "Customer", "Total (BDT)", "Status"],
    ...recentOrders.map((order) => [order.orderId, order.customer, String(order.total), order.status]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "hbca-orders-demo.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function SalesChart({ values, labels }: { values: readonly number[]; labels: readonly string[] }) {
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 600},${180 - value * 1.55}`).join(" ");

  return (
    <div className="mt-5">
      <div className="flex h-52 gap-3">
        <div className="flex flex-col justify-between pb-1 text-[11px] font-medium text-slate-400">
          <span>৳ 20k</span>
          <span>৳ 15k</span>
          <span>৳ 10k</span>
          <span>৳ 5k</span>
          <span>৳ 0</span>
        </div>
        <div className="min-w-0 flex-1">
          <svg
            role="img"
            aria-label="Demo sales chart"
            viewBox="0 0 600 190"
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible"
          >
            <defs>
              <linearGradient id="sales-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#16a34a" stopOpacity=".2" />
                <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[25, 63, 101, 139, 177].map((y) => (
              <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 6" />
            ))}
            <polygon points={`0,190 ${points} 600,190`} fill="url(#sales-fill)" />
            <polyline points={points} fill="none" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            {values.map((value, index) => (
              <circle
                key={`${value}-${index}`}
                cx={(index / (values.length - 1)) * 600}
                cy={180 - value * 1.55}
                r={index === values.length - 1 ? 5 : 0}
                fill="#16a34a"
                stroke="white"
                strokeWidth="3"
              />
            ))}
          </svg>
          <div className="mt-2 flex justify-between gap-1 text-[10px] font-medium text-slate-400 sm:text-xs">
            {labels.map((label) => <span key={label}>{label}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const { t } = useLanguage();
  const router = useRouter();
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<keyof typeof salesSeries>("week");
  const [orderFilter, setOrderFilter] = useState("All statuses");
  const [orderSearch, setOrderSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<(typeof recentOrders)[number] | null>(null);

  const filteredOrders = useMemo(
    () =>
      recentOrders.filter((order) => {
        const matchesStatus = orderFilter === "All statuses" || order.status === orderFilter;
        const search = orderSearch.trim().toLowerCase();
        const matchesSearch = !search || `${order.orderId} ${order.customer}`.toLowerCase().includes(search);
        return matchesStatus && matchesSearch;
      }),
    [orderFilter, orderSearch],
  );
  const currentSales = salesSeries[period];
  const lowStockProducts = products.filter((product) => product.stock <= 20);

  const signOut = async () => {
    setError("");
    try {
      const response = await fetch("/api/admin/session", { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to sign out from admin dashboard.");
      router.replace("/admin/login");
    } catch {
      setError(t("Unable to sign out. Please try again."));
    }
  };

  return (
    <main id="overview" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-[1600px] flex-col lg:mx-0 lg:max-w-none lg:flex-row">
        <aside className="border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:h-screen lg:w-64 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between px-5 py-4 lg:px-6 lg:py-7">
            <a href="#overview" className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-emerald-700 text-lg font-black text-white">H</span>
              <span>
                <span className="block text-sm font-black tracking-wide">HBCA</span>
                <span className="block text-xs text-slate-500">{t("Store Admin")}</span>
              </span>
            </a>
            <button
              type="button"
              aria-label={mobileNavOpen ? t("Close menu") : t("Open menu")}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((open) => !open)}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <nav className={`${mobileNavOpen ? "flex" : "hidden"} gap-1 overflow-x-auto px-3 pb-4 lg:flex lg:flex-col lg:overflow-visible lg:px-4`}>
            {navItems.map(({ label, href, icon: Icon, ...item }) => (
              <a
                key={label}
                href={href}
                onClick={() => setMobileNavOpen(false)}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition lg:w-full ${
                  label === "Overview" ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon size={18} />
                <span className="whitespace-nowrap">{t(label)}</span>
                {"badge" in item ? (
                  <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">{item.badge}</span>
                ) : null}
              </a>
            ))}
          </nav>

          <div className="mx-5 mb-5 hidden rounded-2xl bg-emerald-900 p-4 text-white lg:mt-8 lg:block">
            <p className="text-sm font-bold">{t("Need a hand?")}</p>
            <p className="mt-1 text-xs leading-5 text-emerald-100">{t("Visit the help center for store operations.")}</p>
            <a href="#security" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-white">
              {t("Help center")} <ArrowRight size={14} />
            </a>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:ml-64 lg:px-9 lg:py-8">
          <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">{t("Good morning")}, {t("Admin")} 👋</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{t("Business Overview")}</h1>
              <p className="mt-1 text-sm text-slate-500">{t("Here is what is happening with your store today.")}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 sm:flex">
                <span className="size-2 rounded-full bg-amber-500" />
                {t("Demo analytics")}
              </span>
              <button type="button" aria-label={t("Notifications")} className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50">
                <Bell size={19} />
                <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500" />
              </button>
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 hover:border-rose-200 hover:text-rose-600 sm:px-4"
              >
                {t("Sign out")}
              </button>
            </div>
          </header>
          {error ? <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{t(error)}</p> : null}

          <section aria-label={t("Key metrics")} className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {[
              { label: "Total sales", value: "৳ 4,82,350", change: "+16.2%", icon: CircleDollarSign, tone: "emerald", trend: "up" },
              { label: "Total orders", value: "176", change: "+8.4%", icon: ShoppingBag, tone: "blue", trend: "up" },
              { label: "Average order value", value: "৳ 1,145", change: "+3.1%", icon: ChartNoAxesCombined, tone: "violet", trend: "up" },
              { label: "Pending orders", value: "18", change: "Needs attention", icon: ClipboardList, tone: "amber", trend: "down" },
            ].map(({ label, value, change, icon: Icon, tone, trend }) => (
              <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02]">
                <div className="flex items-start justify-between">
                  <span className={`grid size-11 place-items-center rounded-xl ${
                    tone === "emerald" ? "bg-emerald-50 text-emerald-700" :
                    tone === "blue" ? "bg-sky-50 text-sky-700" :
                    tone === "violet" ? "bg-violet-50 text-violet-700" : "bg-amber-50 text-amber-700"
                  }`}><Icon size={20} /></span>
                  <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-bold ${
                    trend === "up" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
                  }`}>
                    {trend === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {t(change)}
                  </span>
                </div>
                <p className="mt-4 text-sm font-medium text-slate-500">{t(label)}</p>
                <p className="mt-1 text-2xl font-black tracking-tight">{value}</p>
              </article>
            ))}
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold">{t("Sales overview")}</h2>
                  <p className="mt-1 text-xs text-slate-500">{t("Sales performance")} · {t("Demo analytics")}</p>
                  <p className="mt-3 text-3xl font-black">{currentSales.total}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><ArrowUpRight size={14} /> {currentSales.change} {t("vs. previous period")}</p>
                </div>
                <div className="flex rounded-xl bg-slate-100 p-1" aria-label={t("Sales period")}>
                  {(["day", "week", "month"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={period === value}
                      onClick={() => setPeriod(value)}
                      className={`rounded-lg px-3 py-2 text-xs font-bold transition ${period === value ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      {t(salesSeries[value].title)}
                    </button>
                  ))}
                </div>
              </div>
              <SalesChart values={currentSales.values} labels={currentSales.labels.map((label) => t(label))} />
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-extrabold">{t("Order overview")}</h2>
                  <p className="mt-1 text-xs text-slate-500">{t("176 orders this month")}</p>
                </div>
                <a href="#orders" className="text-xs font-bold text-emerald-700 hover:text-emerald-900">{t("View orders")}</a>
              </div>
              <div className="mt-5 space-y-4">
                {orderStatuses.map(({ label, count, icon: Icon, tone }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                      tone === "amber" ? "bg-amber-50 text-amber-700" :
                      tone === "blue" ? "bg-sky-50 text-sky-700" :
                      tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}><Icon size={17} /></span>
                    <span className="min-w-0 flex-1 text-sm font-semibold text-slate-700">{t(label)}</span>
                    <span className="text-sm font-black">{count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                <span className="font-bold">{t("Attention")}:</span> {t("18 orders are waiting to be confirmed.")}
              </div>
            </article>
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-2">
            <article id="products" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold">{t("Top selling products")}</h2>
                  <p className="mt-1 text-xs text-slate-500">{t("Best performers this month")}</p>
                </div>
                <a href="#product-management" className="text-xs font-bold text-emerald-700 hover:text-emerald-900">{t("Manage products")}</a>
              </div>
              <div className="mt-4 divide-y divide-slate-100">
                {topSellingProducts.map((item, index) => {
                  const product = getProduct(item.slug);
                  if (!product) return null;
                  return (
                    <div key={item.slug} className="flex items-center gap-3 py-3">
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-black text-slate-500">{index + 1}</span>
                      <Image src={product.image} alt="" width={44} height={44} unoptimized className="size-11 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{t(product.name)}</p>
                        <p className="text-xs text-slate-500">{item.sold} {t("units sold")}</p>
                      </div>
                      <span className="text-right text-xs font-extrabold sm:text-sm">{item.revenue}</span>
                    </div>
                  );
                })}
              </div>
            </article>

            <article id="inventory" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold">{t("Low stock alerts")}</h2>
                  <p className="mt-1 text-xs text-slate-500">{t("Products with 20 units or fewer")}</p>
                </div>
                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">{lowStockProducts.length} {t("alerts")}</span>
              </div>
              <div className="mt-4 space-y-3">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/50 p-3">
                    <Image src={product.image} alt="" width={44} height={44} unoptimized className="size-11 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{t(product.name)}</p>
                      <p className="text-xs text-slate-500">{t(product.unit)}</p>
                    </div>
                    <span className="text-right">
                      <span className="block text-lg font-black text-rose-700">{product.stock}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-rose-600">{t("left")}</span>
                    </span>
                  </div>
                ))}
              </div>
              <a href="#product-management" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                {t("Update inventory")} <ArrowRight size={14} />
              </a>
            </article>
          </section>

          <AdminProductManager />

          <AdminSupportTicketManager />

          <section id="orders" className="mt-5 scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold">{t("Recent orders")}</h2>
                <p className="mt-1 text-xs text-slate-500">{t("Review order status and customer details.")}</p>
              </div>
              <button type="button" onClick={downloadOrdersCsv} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                <Download size={15} /> {t("Export CSV")}
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={orderSearch}
                  onChange={(event) => setOrderSearch(event.target.value)}
                  placeholder={t("Search order or customer")}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
                />
              </label>
              <select value={orderFilter} onChange={(event) => setOrderFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-500">
                <option value="All statuses">{t("All statuses")}</option>
                {recentOrders.map((order) => <option key={order.orderId} value={order.status}>{t(order.status)}</option>)}
              </select>
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-[620px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-bold">{t("Order")}</th>
                    <th className="px-4 py-3 font-bold">{t("Customer")}</th>
                    <th className="px-4 py-3 font-bold">{t("Amount")}</th>
                    <th className="px-4 py-3 font-bold">{t("Status")}</th>
                    <th className="px-4 py-3 text-right font-bold">{t("Invoice")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.orderId} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-bold text-slate-800">{order.orderId}</td>
                      <td className="px-4 py-3">{t(order.customer)}</td>
                      <td className="px-4 py-3 font-semibold">৳{order.total}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{t(order.status)}</span></td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" aria-label={`${t("Print invoice")} ${order.orderId}`} onClick={() => setInvoiceOrder(order)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100">
                          <Printer size={14} /> {t("Print")}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">{t("No matching orders found.")}</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section id="management" className="mt-7 scroll-mt-6">
            <div className="mb-4">
              <h2 className="text-lg font-extrabold">{t("Store management")}</h2>
              <p className="mt-1 text-sm text-slate-500">{t("Quick access to the tools for running your achar shop.")}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {managementAreas.map(({ title, description, icon: Icon, href, color }) => (
                <a key={title} href={href} className="group flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${color}`}><Icon size={20} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold">{t(title)}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{t(description)}</span>
                  </span>
                  <ArrowRight size={16} className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" />
                </a>
              ))}
            </div>
          </section>

          <section className="mt-5 grid gap-4 sm:grid-cols-2">
            <article id="payments" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Wallet size={19} /></span>
                <div><h3 className="font-extrabold">{t("Payment snapshot")}</h3><p className="text-xs text-slate-500">{t("Demo figures for this month")}</p></div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{t("COD collected")}</p><p className="mt-1 font-black">৳ 2,84,500</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{t("Digital payments")}</p><p className="mt-1 font-black">৳ 1,97,850</p></div>
              </div>
            </article>
            <article id="customers" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><Star size={19} /></span>
                <div><h3 className="font-extrabold">{t("Customer & review pulse")}</h3><p className="text-xs text-slate-500">{t("Customer experience at a glance")}</p></div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                <p className="text-sm"><strong className="text-lg">4.8</strong> <span className="text-amber-500">★★★★★</span></p>
                <p className="text-sm text-slate-600"><strong className="text-slate-900">12</strong> {t("reviews to review")}</p>
                <p className="text-sm text-slate-600"><strong className="text-slate-900">8</strong> {t("customer notes")}</p>
              </div>
            </article>
            <article id="marketing" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-pink-50 text-pink-700"><MessageSquareText size={19} /></span>
                <div><h3 className="font-extrabold">{t("Offers & follow-ups")}</h3><p className="text-xs text-slate-500">{t("Promotions, bundles and cart reminders")}</p></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">HBCA10 · 10%</span>
                <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">FREESHIP</span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">7 {t("abandoned carts")}</span>
              </div>
            </article>
            <article id="security" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><ShieldCheck size={19} /></span>
                <div><h3 className="font-extrabold">{t("Team access")}</h3><p className="text-xs text-slate-500">{t("Role-based access overview")}</p></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-lg border border-slate-200 px-2.5 py-1.5">{t("Admin")} · 1</span>
                <span className="rounded-lg border border-slate-200 px-2.5 py-1.5">{t("Manager")} · 2</span>
                <span className="rounded-lg border border-slate-200 px-2.5 py-1.5">{t("Delivery staff")} · 4</span>
              </div>
            </article>
          </section>

          <footer className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-500">
            <span>{t("Demo dashboard · Data is illustrative and not connected to live services.")}</span>
            <span>{t("Local admin session protected")}</span>
          </footer>
        </section>
      </div>

      {invoiceOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="invoice-title" className="admin-invoice-print my-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl sm:p-9">
            <div className="mb-6 flex items-start justify-between gap-3 print:hidden">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">{t("Print preview")}</p>
                <h2 id="invoice-title" className="mt-1 text-xl font-black">{t("Customer invoice")}</h2>
              </div>
              <button type="button" aria-label={t("Close")} onClick={() => setInvoiceOrder(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button>
            </div>
            <div className="border-b border-slate-200 pb-5">
              <p className="text-xl font-black">{storeInfo.name}</p>
              <p className="mt-1 text-sm text-slate-500">{storeInfo.address}</p>
              <p className="text-sm text-slate-500">{t("Phone number")}: {storeInfo.phone}</p>
            </div>
            <div className="flex flex-wrap justify-between gap-4 py-5 text-sm">
              <div><p className="text-slate-500">{t("Invoice")}</p><p className="font-extrabold">{invoiceOrder.orderId}</p></div>
              <div><p className="text-slate-500">{t("Customer")}</p><p className="font-extrabold">{t(invoiceOrder.customer)}</p></div>
              <div><p className="text-slate-500">{t("Status")}</p><p className="font-extrabold">{t(invoiceOrder.status)}</p></div>
            </div>
            <div className="rounded-xl border border-slate-200">
              <div className="flex justify-between gap-3 border-b border-slate-200 px-4 py-3 text-sm font-bold">
                <span>{t("Order summary")}</span><span>{t("Amount")}</span>
              </div>
              <div className="flex justify-between gap-3 px-4 py-4 text-sm">
                <span>{t("Demo order items")}</span><span>৳{invoiceOrder.total}</span>
              </div>
              <div className="flex justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black">
                <span>{t("Total")}</span><span>৳{invoiceOrder.total}</span>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">{t("Demo invoice: itemized product data is not connected yet.")}</p>
            <div className="mt-6 flex justify-end gap-2 print:hidden">
              <button type="button" onClick={() => setInvoiceOrder(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">{t("Close")}</button>
              <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white"><Printer size={16} /> {t("Print invoice")}</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
