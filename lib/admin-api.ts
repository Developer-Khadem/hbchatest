import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isLocalAdminHost, isValidAdminSession } from "@/lib/admin-auth";

export async function authorizeAdminApi(request: Request) {
  if (!isLocalAdminHost(request.headers.get("host"), request.headers.get("x-forwarded-host"))) {
    return Response.json({ error: "Admin is available from localhost only." }, { status: 404 });
  }

  const cookieStore = await cookies();
  if (!isValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    return Response.json({ error: "Admin sign-in required." }, { status: 401 });
  }

  return null;
}
