import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_DEV_OPT_OUT_COOKIE,
  hasDevBypassOptOut,
  isAuthBypassEnabled,
} from "@/lib/admin/auth";
import { getSupabaseEnv, isSupabaseConfigured } from "./env";

type RouteArea = "admin" | "work";

function getRouteArea(pathname: string): RouteArea | null {
  if (pathname.startsWith("/admin")) {
    return "admin";
  }
  if (pathname.startsWith("/work")) {
    return "work";
  }
  return null;
}

function getLoginPath(area: RouteArea): string {
  return area === "admin" ? "/admin/login" : "/work/login";
}

function getHomePath(area: RouteArea): string {
  return area === "admin" ? "/admin" : "/work";
}

function isWorkPublicAuthPath(pathname: string) {
  return (
    pathname === "/work/login" ||
    pathname === "/work/forgot-password" ||
    pathname === "/work/auth/callback" ||
    pathname.startsWith("/work/auth/callback/")
  );
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const area = getRouteArea(pathname);

  if (!area) {
    return NextResponse.next();
  }

  const loginPath = getLoginPath(area);
  const homePath = getHomePath(area);
  const isLoginRoute = pathname === loginPath;
  const isPublicAuthRoute =
    area === "admin" ? isLoginRoute : isWorkPublicAuthPath(pathname);
  const isResetPasswordRoute = pathname === "/work/reset-password";

  if (isAuthBypassEnabled()) {
    const optedOut = hasDevBypassOptOut(
      request.cookies.get(ADMIN_DEV_OPT_OUT_COOKIE)?.value,
    );

    if (optedOut) {
      if (!isPublicAuthRoute && !isResetPasswordRoute) {
        const url = request.nextUrl.clone();
        url.pathname = loginPath;
        return NextResponse.redirect(url);
      }

      return NextResponse.next();
    }

    if (isLoginRoute) {
      const url = request.nextUrl.clone();
      url.pathname = homePath;
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  if (!isSupabaseConfigured()) {
    if (isPublicAuthRoute) {
      return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.pathname = loginPath;
    url.searchParams.set("setup", "1");
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });

  const { url, key } = getSupabaseEnv();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    if (isResetPasswordRoute) {
      redirectUrl.pathname = "/work/forgot-password";
      redirectUrl.searchParams.set(
        "error",
        "Reset link expired. Request a new one.",
      );
    } else {
      redirectUrl.pathname = loginPath;
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (user && area === "admin" && !isLoginRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role ?? "specialist";
    const isActive = profile?.is_active ?? true;

    if (!isActive || role !== "owner") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/work";
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (
    user &&
    area === "work" &&
    !isPublicAuthRoute &&
    !isResetPasswordRoute
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && profile.is_active === false) {
      // Sign out so login ↔ /work cannot bounce forever while the session remains.
      await supabase.auth.signOut();
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/work/login";
      redirectUrl.searchParams.set("error", "Account inactive");
      const redirectResponse = NextResponse.redirect(redirectUrl);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    }
  }

  if (user && isLoginRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = homePath;
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
