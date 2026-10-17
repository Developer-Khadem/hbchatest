import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { ADMIN_SESSION_COOKIE, isLocalAdminHost, isValidAdminSession } from "@/lib/admin-auth";

export const instant = false;

export default async function AdminPage() {
  const requestHeaders = await headers();
  if (!isLocalAdminHost(requestHeaders.get("host"), requestHeaders.get("x-forwarded-host"))) notFound();

  const cookieStore = await cookies();
  if (!isValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) redirect("/admin/login");

  return <AdminDashboard />;
}
