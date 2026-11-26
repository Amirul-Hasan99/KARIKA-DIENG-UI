"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BrandLogoIcon } from "@/components/ui/BrandLogo";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [isVerifying, setIsVerifying] = useState(!isLoginPage);

  useEffect(() => {
    if (isLoginPage) return;

    const forceLogoutAndRedirect = async (reason?: string) => {
      try {
        sessionStorage.removeItem("dioleh2_tab_auth");
      } catch {}
      try {
        await fetch("/api/admin/logout", { method: "POST", keepalive: true });
      } catch {}
      window.location.replace(reason ? `/admin/login?reason=${reason}` : "/admin/login");
    };

    // 1. Strict Refresh Detection: Refresh (F5 / Ctrl+R) MUST require re-login
    const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    const navType = navEntries?.[0]?.type;
    if (navType === "reload") {
      void forceLogoutAndRedirect("refresh");
      return;
    }

    // 2. Strict Tab/Browser Session Detection: New tab or reopened browser MUST require re-login
    try {
      if (sessionStorage.getItem("dioleh2_tab_auth") !== "1") {
        void forceLogoutAndRedirect();
        return;
      }
    } catch {
      void forceLogoutAndRedirect();
      return;
    }

    // 3. Anti-bfcache (Back-Forward Cache): If restored from cache, force re-login
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void forceLogoutAndRedirect();
      }
    };
    window.addEventListener("pageshow", handlePageShow);

    // 4. Close tab / Close browser / Refresh / External navigation beacon logout
    const handleBeforeUnload = () => {
      try {
        sessionStorage.removeItem("dioleh2_tab_auth");
      } catch {}
      try {
        navigator.sendBeacon("/api/admin/logout");
      } catch {}
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);

    // 5. Validate session on mount
    let isMounted = true;
    const verifySession = async () => {
      try {
        const res = await fetch("/api/admin/orders", {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
          cache: "no-store",
        });

        if (!res.ok) {
          await forceLogoutAndRedirect();
          return;
        }

        if (isMounted) {
          setIsVerifying(false);
        }
      } catch {
        await forceLogoutAndRedirect();
      }
    };

    void verifySession();

    // 6. Browser Back/Forward (Undo/Redo) history guard
    const handlePopState = () => {
      void verifySession();
    };
    window.addEventListener("popstate", handlePopState);

    // 7. Inactivity auto-lock (60 minutes)
    let timeoutId: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        void forceLogoutAndRedirect("timeout");
      }, 60 * 60 * 1000);
    };

    const userEvents = ["mousedown", "keydown", "scroll", "touchstart"];
    userEvents.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      userEvents.forEach((ev) => window.removeEventListener(ev, resetTimer));

      // 8. If navigating away from /admin/* (e.g. to Landing Page / or Buyer /catalog, /orders), immediately invalidate admin session
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin")) {
        try {
          sessionStorage.removeItem("dioleh2_tab_auth");
        } catch {}
        try {
          navigator.sendBeacon("/api/admin/logout");
        } catch {}
      }
    };
  }, [isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f8f7f2] text-[#292a23]">
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-14 w-20 items-center justify-center shrink-0 rounded-2xl overflow-hidden shadow-md border border-[#1b3d2b]/25 bg-[#163826] animate-pulse">
            <img src="/images/logo-d-oleh2.webp" alt="D OLEH-OLEH" className="h-full w-full object-cover rounded-2xl" />
          </span>
          <p className="text-sm font-semibold text-slate-700">
            Memverifikasi keamanan sesi admin D OLEH - OLEH...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

