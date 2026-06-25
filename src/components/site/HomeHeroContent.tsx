"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { business } from "@/lib/site/config";
import { heroIntro } from "@/lib/site/messaging";
import { readRuntimeSiteConfig } from "@/lib/site/runtimeSiteConfig";
import { SITE_CONFIG_UPDATED_EVENT } from "@/lib/admin/siteConfigSettings";

const HIGHLIGHT_WORDS = new Set(["found", "chosen"]);

const HERO_TAGS = ["Websites", "SEO", "Photo & Video", "Social", "Real Estate"];

function HeroHeadline({ text }: { text: string }) {
  return (
    <h1 className="font-display mt-4 text-[2rem] font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
      {text.split(" ").map((word, i) => {
        const bare = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
        const isHighlight = HIGHLIGHT_WORDS.has(bare);
        return (
          <span key={i} className={isHighlight ? "text-brand-gold" : undefined}>
            {word}
            {i < text.split(" ").length - 1 ? " " : ""}
          </span>
        );
      })}
    </h1>
  );
}

export default function HomeHeroContent() {
  const [heroLocationLine, setHeroLocationLine] = useState<string>(business.heroLocationLine);
  const [heroHeadline, setHeroHeadline] = useState<string>(business.heroHeadline);
  const [primaryCtaText, setPrimaryCtaText] = useState("Free Consultation");
  const [primaryCtaHref, setPrimaryCtaHref] = useState("/contact");

  useEffect(() => {
    const applyRuntime = () => {
      const runtime = readRuntimeSiteConfig();
      setHeroLocationLine(runtime.heroLocationLine || business.heroLocationLine);
      setHeroHeadline(runtime.heroHeadline || business.heroHeadline);
      setPrimaryCtaText(runtime.homepagePrimaryCtaText || "Free Consultation");
      setPrimaryCtaHref(runtime.homepagePrimaryCtaLink || "/contact");
    };

    applyRuntime();
    window.addEventListener(SITE_CONFIG_UPDATED_EVENT, applyRuntime);
    return () => window.removeEventListener(SITE_CONFIG_UPDATED_EVENT, applyRuntime);
  }, []);

  return (
    <div className="max-w-2xl">
      <p className="inline-flex items-center gap-2 rounded-full border border-solid border-brand-gold/30 bg-brand-gold/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-gold sm:text-sm">
        <Sparkles size={14} aria-hidden className="shrink-0" />
        {heroLocationLine}
      </p>

      <HeroHeadline text={heroHeadline} />

      <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
        {heroIntro}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href={primaryCtaHref}
          className="group inline-flex items-center gap-2 rounded-lg bg-brand-gold px-6 py-3.5 text-sm font-bold text-black transition-colors hover:bg-brand-gold-dark sm:text-base"
        >
          {primaryCtaText}
          <ArrowRight
            size={18}
            aria-hidden
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>
        <Link
          href="/#services"
          className="rounded-lg border border-solid border-white/20 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:border-brand-gold/60 hover:text-brand-gold sm:text-base"
        >
          Explore Services
        </Link>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-solid border-white/10 pt-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
          We do
        </span>
        {HERO_TAGS.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-solid border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-white/70"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
