import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  isAdminPassword
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function safeNext(value: FormDataEntryValue | null) {
  const candidate = String(value ?? "/admin");

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/admin";
  }

  return candidate;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!isAdminPassword(password)) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("error", "1");
    url.searchParams.set("next", next);

    return NextResponse.redirect(url, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(next, request.url), {
    status: 303
  });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: await createAdminSessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });

  return response;
}
