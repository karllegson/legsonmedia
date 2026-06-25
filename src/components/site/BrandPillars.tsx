import { Camera, Search, Layers } from "lucide-react";
import { brandPillars, brandPillarsHeading, differentiationIntro } from "@/lib/site/messaging";

const pillarIcons = [Search, Camera, Layers] as const;

export default function BrandPillars() {
  return (
    <section className="border-b border-solid border-gray-100 bg-white py-10 sm:py-20">
      <div className="site-container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold sm:text-sm">
            What We Stand For
          </p>
          <h2 className="mt-2 text-xl font-bold leading-snug text-site-text-dark sm:text-3xl">
            {brandPillarsHeading}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-site-text sm:mt-3">
            {differentiationIntro}
          </p>
        </div>

        <div className="relative mx-auto mt-8 max-w-5xl overflow-hidden rounded-2xl border border-solid border-gray-200 bg-black shadow-2xl sm:mt-14">
          <div className="relative grid sm:grid-cols-3">
            {brandPillars.map(({ title, body }, index) => {
              const Icon = pillarIcons[index] ?? Search;
              const isLast = index === brandPillars.length - 1;

              return (
                <article
                  key={title}
                  className={`group relative flex flex-col p-6 transition-colors duration-300 hover:bg-white/[0.03] sm:p-9 ${
                    isLast ? "" : "border-b border-solid border-white/10 sm:border-b-0 sm:border-r"
                  }`}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-gold/15 text-brand-gold transition-colors group-hover:bg-brand-gold group-hover:text-black">
                    <Icon className="size-6" strokeWidth={1.75} aria-hidden />
                  </span>

                  <h3 className="mt-5 text-base font-bold text-white sm:text-lg">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
