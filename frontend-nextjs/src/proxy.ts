import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["en", "zh-CN"];
const defaultLocale = "en";

export function proxy(request: NextRequest) {
  const { pathname, host } = request.nextUrl;

  // Check if there is any supported locale in the pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Domain detection logic
  let locale = defaultLocale;
  if (host.endsWith(".cn")) {
    locale = "zh-CN";
  }

  // Redirect to the locale path (e.g. /about -> /zh-CN/about)
  request.nextUrl.pathname = `/${locale}${pathname}`;
  
  const response = NextResponse.rewrite(request.nextUrl);

  // Inject the current pathname into a header for server-side access
  response.headers.set("x-pathname", request.nextUrl.pathname);

  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    "/((?!_next|api|favicon.ico|placeholder.svg).*)",
  ],
};