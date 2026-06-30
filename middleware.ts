import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isValidAdminSession } from "@/lib/admin-auth";

function isAdminPath(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

function isAuthPath(pathname: string) {
  return (
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout"
  );
}

function hasCronAccess(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret || request.nextUrl.pathname !== "/api/admin/scores/sync") {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isAdminPath(pathname) || isAuthPath(pathname)) {
    return NextResponse.next();
  }

  // Regras de seguranca do admin: rotas administrativas exigem cookie de
  // sessao; o endpoint de sync tambem aceita CRON_SECRET para Vercel Cron.
  if (hasCronAccess(request)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (await isValidAdminSession(token)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json(
      { error: "Admin bloqueado. Faca login para continuar." },
      { status: 401 }
    );
  }

  const url = new URL("/admin/login", request.url);
  url.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};
