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

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const area = getRouteArea(pathname);

  if (!area) {
    return NextResponse.next();
  }

  const loginPath = getLoginPath(area);
  const homePath = getHomePath(area);
  const isLoginRoute = pathname === loginPath;

  if (isAuthBypassEnabled()) {
    const optedOut = hasDevBypassOptOut(
      request.cookies.get(ADMIN_DEV_OPT_OUT_COOKIE)?.value,
    );

    if (optedOut) {
      if (!isLoginRoute) {
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
    if (isLoginRoute) {
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

  if (!user && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = loginPath;
    return NextResponse.redirect(url);
  }

  if (user && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = homePath;
    return NextResponse.redirect(url);
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
      const url = request.nextUrl.clone();
      url.pathname = "/work";
      return NextResponse.redirect(url);
    }
  }

  if (user && area === "work" && !isLoginRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && profile.is_active === false) {
      const url = request.nextUrl.clone();
      url.pathname = "/work/login";
      url.searchParams.set("error", "Account inactive");
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
