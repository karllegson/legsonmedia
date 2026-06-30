"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  Heart,
  Megaphone,
  Share2,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { business } from "@/lib/site/config";

const HIGHLIGHT_WORDS = new Set(["found", "chosen", "loud", "voice", "grow", "rank"]);

function HeroHeadline({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <h1 className="font-display mx-auto max-w-5xl text-center text-[2.5rem] font-extrabold leading-[1.02] tracking-tight text-site-text-dark sm:text-6xl lg:text-7xl">
      {words.map((word, i) => {
        const bare = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
        const isHighlight = HIGHLIGHT_WORDS.has(bare);
        return (
          <span key={i} className={isHighlight ? "text-brand-gold-dark" : undefined}>
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </h1>
  );
}

export default function HomeHeroContent() {
  const [heroHeadline, setHeroHeadline] = useState<string>(business.heroHeadline);
  const [heroIntroLine, setHeroIntroLine] = useState<string>(business.companyStory);

  useEffect(() => {
    // Headline + supporting copy fall back to static config; runtime overrides optional.
    setHeroHeadline(business.heroHeadline);
    setHeroIntroLine(
      "We help your business show up in more places — and turn that attention into real customers.",
    );
  }, []);

  return (
    <div>
      <p className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-solid border-black/10 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold-dark">
        <Sparkles size={14} aria-hidden className="shrink-0" />
        {business.heroLocationLine}
      </p>

      <HeroHeadline text={heroHeadline} />

      {/* Illustration */}
      <div className="relative mx-auto mt-10 flex h-64 w-full max-w-xl items-center justify-center sm:mt-12 sm:h-80">
        {/* Sparkle star */}
        <Sparkles
          size={56}
          aria-hidden
          className="absolute left-[12%] top-2 text-ink sm:left-[18%]"
          strokeWidth={1.5}
        />
        {/* Outline + filled dots */}
        <span
          aria-hidden
          className="absolute bottom-8 left-[20%] h-4 w-4 rounded-full border-2 border-solid border-ink"
        />
        <span
          aria-hidden
          className="absolute bottom-3 left-[26%] h-5 w-5 rounded-full bg-ink"
        />

        {/* Main yellow circle with megaphone */}
        <div className="relative flex h-52 w-52 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#ffe066,#ffcc00)] shadow-[0_30px_60px_-25px_rgba(255,204,0,0.7)] sm:h-64 sm:w-64">
          <Megaphone
            size={120}
            aria-hidden
            className="-rotate-[18deg] text-ink"
            strokeWidth={1.5}
          />
        </div>

        {/* Floating social badges */}
        <span
          aria-hidden
          className="absolute right-[16%] top-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink shadow-md"
        >
          <Share2 size={22} />
        </span>
        <span
          aria-hidden
          className="absolute right-[10%] top-1/2 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold text-ink shadow-md"
        >
          <Heart size={24} />
        </span>
        <span
          aria-hidden
          className="absolute bottom-10 right-[22%] inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white shadow-md"
        >
          <ThumbsUp size={22} />
        </span>
      </div>

      {/* Bottom row: supporting copy + explore */}
      <div className="mt-10 flex flex-col items-start justify-between gap-6 sm:mt-12 sm:flex-row sm:items-end">
        <p className="max-w-xs text-sm leading-relaxed text-site-text">{heroIntroLine}</p>

        <Link
          href="/#services"
          className="group inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-site-text-dark transition-colors hover:text-brand-gold-dark"
        >
          Explore
          <ArrowDownRight
            size={18}
            aria-hidden
            className="transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5"
          />
        </Link>
      </div>
    </div>
  );
}
