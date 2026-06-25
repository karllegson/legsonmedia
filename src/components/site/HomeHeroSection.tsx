import type { ReactNode } from "react";

type HomeHeroSectionProps = {
  children: ReactNode;
};

export default function HomeHeroSection({ children }: HomeHeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-black">
      {/* Layered background — angular accents echo the LM logo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_75%_30%,rgba(255,204,0,0.10),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-10 hidden h-[130%] w-[45%] skew-x-[-12deg] bg-brand-gold/[0.06] lg:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 bottom-0 h-2/3 w-1/3 skew-x-[-12deg] bg-white/[0.02]"
      />
      {/* Fine grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="site-container relative z-10 flex min-h-[78dvh] items-center py-16 sm:min-h-[86dvh] sm:py-24">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          {children}

          {/* Decorative brand mark */}
          <div className="relative hidden justify-center lg:flex">
            <div
              aria-hidden
              className="absolute inset-0 m-auto h-72 w-72 rounded-full bg-brand-gold/15 blur-3xl"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt=""
              className="relative h-64 w-64 object-contain drop-shadow-[0_0_60px_rgba(255,204,0,0.25)] xl:h-72 xl:w-72"
              width={288}
              height={288}
            />
          </div>
        </div>
      </div>

      {/* Bottom edge */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent"
      />
    </section>
  );
}
