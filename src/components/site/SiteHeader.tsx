"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Mail,
  Menu,
  Phone,
  X,
} from "lucide-react";
import SiteLogo from "@/components/site/SiteLogo";
import {
  aboutNavLinks,
  business,
  serviceMenuGroups,
  utilityNavLinks,
  whyUsNavLinks,
} from "@/lib/site/config";
import { phoneToHref, readRuntimeSiteConfig } from "@/lib/site/runtimeSiteConfig";
import { SITE_CONFIG_UPDATED_EVENT } from "@/lib/admin/siteConfigSettings";

type OpenMenu = "services" | "why-us" | "about" | null;

type SiteHeaderProps = {
  hasAdminBar?: boolean;
};

export default function SiteHeader({ hasAdminBar = false }: SiteHeaderProps) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [mobileSection, setMobileSection] = useState<OpenMenu>(null);
  const [runtimePhone, setRuntimePhone] = useState<string>(business.phone);
  const [runtimePhoneHref, setRuntimePhoneHref] = useState<string>(business.phoneHref);
  const [runtimePrimaryCtaText, setRuntimePrimaryCtaText] = useState("Talk to Us");
  const [runtimePrimaryCtaHref, setRuntimePrimaryCtaHref] = useState("/contact");

  useEffect(() => {
    const applyRuntime = () => {
      const runtime = readRuntimeSiteConfig();
      setRuntimePhone(runtime.phoneMain || business.phone);
      setRuntimePhoneHref(phoneToHref(runtime.phoneMain || business.phone));
      setRuntimePrimaryCtaText(runtime.homepagePrimaryCtaText || "Talk to Us");
      setRuntimePrimaryCtaHref(runtime.homepagePrimaryCtaLink || "/contact");
    };

    applyRuntime();
    window.addEventListener(SITE_CONFIG_UPDATED_EVENT, applyRuntime);
    return () => window.removeEventListener(SITE_CONFIG_UPDATED_EVENT, applyRuntime);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled((current) => {
        if (!current && y > 48) return true;
        if (current && y < 8) return false;
        return current;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenus = useCallback(() => {
    setOpenMenu(null);
    setMenuOpen(false);
    setMobileSection(null);
  }, []);

  useEffect(() => {
    closeMenus();
  }, [pathname, closeMenus]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!headerRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeMenus]);

  function toggleMenu(menu: OpenMenu) {
    setOpenMenu((current) => (current === menu ? null : menu));
  }

  function navLinkClass(active: boolean) {
    return active
      ? "flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold text-brand-gold-dark transition-colors"
      : "flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold text-site-text-dark/80 transition-colors hover:text-site-text-dark";
  }

  return (
    <header
      ref={headerRef}
      className={`sticky z-50 bg-cream/85 backdrop-blur-md transition-shadow duration-300 ${
        hasAdminBar ? "top-[var(--site-admin-bar-height,32px)]" : "top-0"
      } ${scrolled ? "shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]" : ""}`}
    >
      {/* Top utility bar — collapses on scroll */}
      <div
        className={`overflow-hidden border-b border-solid transition-[height,border-color,opacity] duration-300 ease-in-out ${
          scrolled ? "h-0 border-transparent opacity-0" : "h-10 border-black/5 opacity-100"
        }`}
      >
        <div className="site-container flex h-10 items-center justify-between gap-4 text-[12px] font-medium text-site-text-muted">
          <div className="flex items-center gap-5">
            <a
              href={runtimePhoneHref}
              className="flex items-center gap-1.5 transition-colors hover:text-brand-gold-dark"
            >
              <Phone size={13} strokeWidth={2} aria-hidden className="text-brand-gold-dark" />
              {runtimePhone}
            </a>
            <a
              href={`mailto:${business.email}`}
              className="hidden items-center gap-1.5 transition-colors hover:text-brand-gold-dark sm:flex"
            >
              <Mail size={13} strokeWidth={2} aria-hidden className="text-brand-gold-dark" />
              {business.email}
            </a>
          </div>
          <p className="hidden tracking-wide sm:block">
            Marketing · SEO · Photo · Video · Social
          </p>
        </div>
      </div>

      {/* Main navigation */}
      <div className="relative">
        <div className="site-container flex min-h-[68px] items-center justify-between gap-6 py-2 lg:min-h-[80px] lg:py-0">
          <SiteLogo />

          {/* Centered nav */}
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-0.5 lg:absolute lg:left-1/2 lg:top-1/2 lg:flex lg:-translate-x-1/2 lg:-translate-y-1/2"
          >
            <Link href="/" className={navLinkClass(pathname === "/")}>
              Home
            </Link>

            <button
              type="button"
              className={navLinkClass(openMenu === "services")}
              aria-expanded={openMenu === "services"}
              onClick={() => toggleMenu("services")}
            >
              Services
              <ChevronDown
                size={15}
                aria-hidden
                className={`transition-transform ${openMenu === "services" ? "rotate-180" : ""}`}
              />
            </button>

            <div className="relative">
              <button
                type="button"
                className={navLinkClass(openMenu === "why-us")}
                aria-expanded={openMenu === "why-us"}
                onClick={() => toggleMenu("why-us")}
              >
                Why Us
                <ChevronDown
                  size={15}
                  aria-hidden
                  className={`transition-transform ${openMenu === "why-us" ? "rotate-180" : ""}`}
                />
              </button>

              {openMenu === "why-us" && (
                <div className="absolute left-1/2 top-full z-50 mt-3 w-72 -translate-x-1/2 overflow-hidden rounded-2xl border border-solid border-black/10 bg-white py-2 shadow-xl">
                  <ul>
                    {whyUsNavLinks.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="block px-5 py-2.5 text-sm font-medium text-site-text transition-colors hover:bg-cream hover:text-brand-gold-dark"
                          onClick={closeMenus}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                className={navLinkClass(openMenu === "about")}
                aria-expanded={openMenu === "about"}
                onClick={() => toggleMenu("about")}
              >
                About
                <ChevronDown
                  size={15}
                  aria-hidden
                  className={`transition-transform ${openMenu === "about" ? "rotate-180" : ""}`}
                />
              </button>

              {openMenu === "about" && (
                <div className="absolute left-1/2 top-full z-50 mt-3 w-64 -translate-x-1/2 overflow-hidden rounded-2xl border border-solid border-black/10 bg-white py-2 shadow-xl">
                  <ul>
                    {aboutNavLinks.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="block px-5 py-2.5 text-sm font-medium text-site-text transition-colors hover:bg-cream hover:text-brand-gold-dark"
                          onClick={closeMenus}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Link href="/blog" className={navLinkClass(pathname.startsWith("/blog"))}>
              Blog
            </Link>
          </nav>

          <div className="flex items-center gap-2 lg:gap-3">
            <Link
              href={runtimePrimaryCtaHref}
              className="group hidden items-center gap-1.5 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-black sm:inline-flex"
            >
              {runtimePrimaryCtaText || "Talk to Us"}
              <ArrowUpRight
                size={16}
                strokeWidth={2.5}
                aria-hidden
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
            <button
              type="button"
              className="p-2 text-site-text-dark lg:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={26} aria-hidden /> : <Menu size={26} aria-hidden />}
            </button>
          </div>
        </div>

        {/* Services mega menu */}
        {openMenu === "services" && (
          <div className="absolute inset-x-0 top-full z-50 hidden border-t border-solid border-black/10 bg-white shadow-xl lg:block">
            <div className="site-container grid gap-10 py-10 lg:grid-cols-3">
              {serviceMenuGroups.map((group) => (
                <div key={group.title}>
                  <Link
                    href={group.href}
                    className="text-base font-bold text-brand-gold-dark transition-colors hover:text-ink"
                    onClick={closeMenus}
                  >
                    {group.title}
                  </Link>
                  <p className="mt-2 text-sm leading-relaxed text-site-text-muted">
                    {group.description}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {group.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="group flex items-center gap-1 text-sm font-medium text-site-text transition-colors hover:text-site-text-dark"
                          onClick={closeMenus}
                        >
                          {link.label}
                          <ChevronRight
                            size={14}
                            aria-hidden
                            className="text-brand-gold-dark opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-solid border-black/10 bg-cream lg:hidden"
        >
          <ul className="px-4 py-2">
            <li>
              <Link
                href="/"
                className="block border-b border-solid border-black/10 py-3 font-medium text-site-text-dark"
                onClick={closeMenus}
              >
                Home
              </Link>
            </li>

            {(
              [
                { id: "services" as const, label: "Services" },
                { id: "why-us" as const, label: "Why Us" },
                { id: "about" as const, label: "About" },
              ] as const
            ).map(({ id, label }) => (
              <li key={id} className="border-b border-solid border-black/10">
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-3 font-medium text-site-text-dark"
                  aria-expanded={mobileSection === id}
                  onClick={() => setMobileSection((current) => (current === id ? null : id))}
                >
                  {label}
                  <ChevronDown
                    size={18}
                    aria-hidden
                    className={`text-brand-gold-dark transition-transform ${
                      mobileSection === id ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {mobileSection === id && id === "services" && (
                  <ul className="pb-3 pl-3">
                    {serviceMenuGroups.map((group) => (
                      <li key={group.title} className="mt-2">
                        <Link
                          href={group.href}
                          className="block py-1.5 text-sm font-bold text-brand-gold-dark"
                          onClick={closeMenus}
                        >
                          {group.title}
                        </Link>
                        <ul className="mt-1 space-y-1 pl-3">
                          {group.links.map((link) => (
                            <li key={link.label}>
                              <Link
                                href={link.href}
                                className="block py-1 text-sm text-site-text"
                                onClick={closeMenus}
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
                {mobileSection === id && id === "why-us" && (
                  <ul className="space-y-1 pb-3 pl-3">
                    {whyUsNavLinks.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="block py-1.5 text-sm text-site-text"
                          onClick={closeMenus}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {mobileSection === id && id === "about" && (
                  <ul className="space-y-1 pb-3 pl-3">
                    {aboutNavLinks.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="block py-1.5 text-sm text-site-text"
                          onClick={closeMenus}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}

            {utilityNavLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block border-b border-solid border-black/10 py-3 font-medium text-site-text-dark"
                  onClick={closeMenus}
                >
                  {item.label}
                </Link>
              </li>
            ))}

            <li>
              <Link
                href={runtimePrimaryCtaHref}
                className="my-3 flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-bold text-white"
                onClick={closeMenus}
              >
                {runtimePrimaryCtaText || "Talk to Us"}
                <ArrowUpRight size={16} strokeWidth={2.5} aria-hidden />
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
