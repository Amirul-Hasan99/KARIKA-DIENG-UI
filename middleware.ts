import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isAdminSessionValid } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isLoginPage = path === "/admin/login";
  const isLoginApi = path === "/api/admin/login" || path === "/api/admin/logout";
  const isPublicApi =
    path === "/api/orders/checkout" ||
    path === "/api/orders/upload-payment-proof";

  // Strictly exclude sensitive endpoints from public order regex matching
  const isExcludedFromPublicOrder =
    path === "/api/orders/kitchen" ||
    path === "/api/orders/checkout" ||
    path === "/api/orders/search" ||
    path === "/api/orders/confirm-cash" ||
    path === "/api/orders/cancel" ||
    path === "/api/orders/upload-payment-proof";

  // Only single order lookup (e.g. /api/orders/ORD-xxx or /api/orders/GC-xxx) is readable by public customer
  const isIndividualOrderLookup =
    !isExcludedFromPublicOrder &&
    /^\/api\/orders\/[a-zA-Z0-9_-]+$/.test(path) &&
    request.method === "GET";

  const publicRead =
    (path === "/api/seed" && request.method === "GET") ||
    (path === "/api/products" && request.method === "GET") ||
    (path === "/api/settings" && request.method === "GET") ||
    isIndividualOrderLookup ||
    (path === "/api/orders/search" && request.method === "GET");

  const protectedPage = path === "/admin" || path.startsWith("/admin/");
  const protectedApi = path.startsWith("/api/") && !isLoginApi && !isPublicApi && !publicRead;

  const sessionToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isSessionValid = await isAdminSessionValid(sessionToken);

  // Non-admin public pages (/, /catalog, /orders): always clear any active admin session cookie
  // so returning to /admin after visiting landing page or buyer panel forces a fresh login.
  const isNonAdminPublicPage = !path.startsWith("/admin") && !path.startsWith("/api/");
  if (isNonAdminPublicPage) {
    const response = NextResponse.next();
    if (request.cookies.has(ADMIN_COOKIE_NAME)) {
      response.cookies.set(ADMIN_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });
    }
    addSecurityHeaders(response);
    return response;
  }

  // Always require explicit login when visiting /admin/login (clear any leftover session cookie)
  if (isLoginPage) {
    const response = NextResponse.next();
    if (request.cookies.has(ADMIN_COOKIE_NAME)) {
      response.cookies.set(ADMIN_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });
    }
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    addSecurityHeaders(response);
    return response;
  }

  // Not a protected route
  if (isLoginPage || isLoginApi || (!protectedPage && !protectedApi)) {
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }

  // Protected route with valid session
  if (isSessionValid) {
    const response = NextResponse.next();
    // Anti-caching & anti-bfcache headers for admin pages & apis
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    addSecurityHeaders(response);
    return response;
  }

  // Unauthorized API call
  if (protectedApi) {
    const errorResponse = NextResponse.json({ error: "Autentikasi admin diperlukan." }, { status: 401 });
    errorResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    addSecurityHeaders(errorResponse);
    return errorResponse;
  }

  // Unauthorized page view - redirect to login with anti-cache headers
  const redirectResponse = NextResponse.redirect(new URL("/admin/login", request.url));
  redirectResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  redirectResponse.headers.set("Pragma", "no-cache");
  redirectResponse.headers.set("Expires", "0");
  addSecurityHeaders(redirectResponse);
  return redirectResponse;
}

function addSecurityHeaders(response: NextResponse) {
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  
  // Clickjacking protection
  response.headers.set("X-Frame-Options", "DENY");
  
  // XSS protection (legacy, but still useful)
  response.headers.set("X-XSS-Protection", "1; mode=block");
  
  // HSTS (tell browsers to always use HTTPS)
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  
  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Permissions policy
  response.headers.set("Permissions-Policy", "geolocation=(self), camera=(self), microphone=()");
}

export const config = { matcher: ["/", "/catalog", "/orders/:path*", "/admin/:path*", "/api/:path*"] };
