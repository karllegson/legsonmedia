"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { business } from "@/lib/site/config";
import { SITE_CONFIG_UPDATED_EVENT } from "@/lib/admin/siteConfigSettings";
import { readRuntimeSiteConfig } from "@/lib/site/runtimeSiteConfig";

const DEFAULT_MARK = "/logo.png";

type SiteLogoProps = {
  variant?: "header" | "footer";
  linked?: boolean;
};

/**
 * Horizontal brand lockup: the LM mark + typeset "LEGSON MEDIA".
 * The mark asset has uniform dark padding, so we crop it with an
 * overflow-hidden box + scale to make it sit tight next to the wordmark.
 * Used only on dark surfaces (header / footer).
 */
export default function SiteLogo({ variant = "header", linked = true }: SiteLogoProps) {
  const isFooter = variant === "footer";
  const [markSrc, setMarkSrc] = useState<string>(DEFAULT_MARK);

  useEffect(() => {
    const applyRuntime = () => {
      const runtime = readRuntimeSiteConfig();
      setMarkSrc(runtime.logoImage || DEFAULT_MARK);
    };

    applyRuntime();
    window.addEventListener(SITE_CONFIG_UPDATED_EVENT, applyRuntime);
    return () => window.removeEventListener(SITE_CONFIG_UPDATED_EVENT, applyRuntime);
  }, []);

  const markBox = isFooter ? "h-12 w-12" : "h-11 w-11";
  const legson = isFooter ? "text-xl" : "text-lg sm:text-xl";

  const lockup = (
    <>
      <span className={`relative block shrink-0 overflow-hidden ${markBox}`}>
        <Image
          src={markSrc}
          alt=""
          fill
          priority={variant === "header"}
          quality={95}
          sizes="48px"
          className="scale-[1.9] object-contain"
          unoptimized={markSrc.startsWith("blob:")}
        />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`font-display font-extrabold tracking-tight text-site-text-dark ${legson}`}
        >
          LEGSON
        </span>
        <span className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.38em] text-brand-gold-dark">
          Media
        </span>
      </span>
    </>
  );

  const className = "flex items-center gap-2.5";

  if (!linked) {
    return <div className={className}>{lockup}</div>;
  }

  return (
    <Link href="/" aria-label={`${business.displayName} — home`} className={className}>
      {lockup}
    </Link>
  );
}
