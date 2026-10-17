import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSession,
  isLocalAdminHost,
  isValidAdminSession,
  verifyAdminPassword,
} from "@/lib/admin-auth";

function isLocalRequest(request: Request) {
  return isLocalAdminHost(request.headers.get("host"), request.headers.get("x-forwarded-host"));
}

function localOnlyResponse() {
  return Response.json({ error: "Admin is available from localhost only." }, { status: 404 });
}

export async function GET(request: Request) {
  if (!isLocalRequest(request)) return localOnlyResponse();

  const cookieStore = await cookies();
  return Response.json({
    authenticated: isValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value),
  });
}

export async function POST(request: Request) {
  if (!isLocalRequest(request)) return localOnlyResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("password" in body) ||
    typeof body.password !== "string" ||
    body.password.length > 128
  ) {
    return Response.json({ error: "Enter the admin password." }, { status: 400 });
  }

  if (!process.env.ADMIN_PASSWORD) {
    return Response.json({ error: "Admin password is not configured." }, { status: 503 });
  }

  try {
    if (!verifyAdminPassword(body.password)) {
      return Response.json({ error: "The admin password is incorrect." }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, createAdminSession(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    });
    return Response.json({ authenticated: true });
  } catch (error) {
    console.error("Unable to create admin session", error);
    return Response.json({ error: "Unable to process admin login." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isLocalRequest(request)) return localOnlyResponse();

  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  return Response.json({ authenticated: false });
}
