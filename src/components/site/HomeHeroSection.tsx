import type { ReactNode } from "react";

type HomeHeroSectionProps = {
  children: ReactNode;
};

export default function HomeHeroSection({ children }: HomeHeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-cream">
      {/* Soft yellow corner glows — echo MLab's tinted edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,rgba(255,204,0,0.28),transparent_65%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -left-40 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(255,204,0,0.18),transparent_65%)]"
      />

      <div className="site-container relative z-10 py-12 sm:py-16">{children}</div>
    </section>
  );
}
