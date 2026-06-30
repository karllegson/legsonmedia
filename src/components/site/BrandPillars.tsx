import { Camera, Search, Layers } from "lucide-react";
import { brandPillars, brandPillarsHeading, differentiationIntro } from "@/lib/site/messaging";

const pillarIcons = [Search, Camera, Layers] as const;

export default function BrandPillars() {
  return (
    <section className="bg-cream py-10 sm:py-20">
      <div className="site-container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-dark sm:text-sm">
            What We Stand For
          </p>
          <h2 className="mt-2 text-xl font-bold leading-snug text-site-text-dark sm:text-3xl">
            {brandPillarsHeading}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-site-text sm:mt-3">
            {differentiationIntro}
          </p>
        </div>

        <div className="relative mx-auto mt-8 grid max-w-5xl gap-4 sm:mt-14 sm:grid-cols-3 sm:gap-6">
          {brandPillars.map(({ title, body }, index) => {
            const Icon = pillarIcons[index] ?? Search;

            return (
              <article
                key={title}
                className="group flex flex-col rounded-3xl border border-solid border-black/10 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-gold sm:p-8"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/20 text-brand-gold-dark transition-colors group-hover:bg-brand-gold group-hover:text-ink">
                  <Icon className="size-6" strokeWidth={1.75} aria-hidden />
                </span>

                <h3 className="mt-5 text-base font-bold text-site-text-dark sm:text-lg">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-site-text">{body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
