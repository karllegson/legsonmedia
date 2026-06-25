type SectionIntroProps = {
  eyebrow: string;
  title: string;
  lede?: string;
  /** Use on dark backgrounds to flip title/lede colors to light. */
  tone?: "light" | "dark";
};

/** Centered section intro — compact on mobile, full size from sm up. */
export default function SectionIntro({
  eyebrow,
  title,
  lede,
  tone = "light",
}: SectionIntroProps) {
  const onDark = tone === "dark";

  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold sm:text-sm">
        <span className="h-px w-5 bg-brand-gold/60" aria-hidden />
        {eyebrow}
        <span className="h-px w-5 bg-brand-gold/60" aria-hidden />
      </p>
      <h2
        className={`font-display mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl ${
          onDark ? "text-white" : "text-site-text-dark"
        }`}
      >
        {title}
      </h2>
      {lede ? (
        <p
          className={`mt-3 text-sm leading-relaxed sm:text-base ${
            onDark ? "text-white/70" : "text-site-text"
          }`}
        >
          {lede}
        </p>
      ) : null}
    </div>
  );
}
