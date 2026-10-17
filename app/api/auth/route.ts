import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_MAX_AGE,
  assertAuthConfiguration,
  createSessionToken,
  getAuthenticatedUser,
  hashPassword,
  isValidBangladeshPhone,
  normalizeBangladeshPhone,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AuthRequest = {
  action?: unknown;
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  password?: unknown;
};

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function setSessionCookie(token: string) {
  return cookies().then((cookieStore) => {
    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_SESSION_MAX_AGE,
    });
  });
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    return Response.json({ user });
  } catch (error) {
    console.error("Unable to read account session", error);
    return jsonError("Unable to load account. Please try again.", 500);
  }
}

export async function POST(request: Request) {
  let body: AuthRequest;
  try {
    body = (await request.json()) as AuthRequest;
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  if (body.action === "signout") {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);
    return Response.json({ user: null });
  }

  if (body.action !== "signup" && body.action !== "signin") {
    return jsonError("Choose sign in or sign up.", 400);
  }
  if (typeof body.phone !== "string" || typeof body.password !== "string") {
    return jsonError("Enter your phone number and password.", 400);
  }

  const phone = normalizeBangladeshPhone(body.phone);
  if (!isValidBangladeshPhone(phone)) {
    return jsonError("Enter a valid 11-digit Bangladesh mobile number.", 400);
  }
  if (body.password.length < 8 || body.password.length > 128) {
    return jsonError("Password must be between 8 and 128 characters.", 400);
  }

  try {
    assertAuthConfiguration();
    if (body.action === "signin") {
      const user = await prisma.user.findUnique({
        where: { phone },
        select: { id: true, name: true, phone: true, email: true, passwordHash: true },
      });
      if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
        return jsonError("Phone number or password is incorrect.", 401);
      }

      await setSessionCookie(createSessionToken(user.id));
      return Response.json({
        user: { id: user.id, name: user.name, phone: user.phone, email: user.email },
      });
    }

    if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 100) {
      return jsonError("Name must be between 2 and 100 characters.", 400);
    }
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return jsonError("Enter a valid email address.", 400);
    }

    const user = await prisma.user.create({
      data: {
        name: body.name.trim(),
        phone,
        email: email || null,
        passwordHash: await hashPassword(body.password),
      },
      select: { id: true, name: true, phone: true, email: true },
    });
    await setSessionCookie(createSessionToken(user.id));
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("An account already exists with that phone number or email.", 409);
    }
    console.error("Unable to process account request", error);
    return jsonError("Unable to process account request. Please try again.", 500);
  }
}
