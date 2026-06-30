import { Building2, Home, Wrench, type LucideIcon } from "lucide-react";

type AudienceCard = {
  title: string;
  body: string;
};

/** Icons paired by position to the homepage audiences list. */
const cardIcons: LucideIcon[] = [Building2, Home, Wrench];

export default function WhoWeServeCards({ items }: { items: readonly AudienceCard[] }) {
  return (
    <div className="mx-auto mt-8 grid max-w-5xl gap-5 sm:mt-14 md:grid-cols-3">
      {items.map(({ title, body }, index) => {
        const Icon = cardIcons[index % cardIcons.length];

        return (
          <article
            key={title}
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-solid border-black/10 bg-white p-7 transition-all hover:-translate-y-1 hover:border-brand-gold hover:shadow-[0_20px_50px_-25px_rgba(0,0,0,0.25)]"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-gold/15 transition-transform duration-300 group-hover:scale-150"
            />

            <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-brand-gold transition-colors group-hover:bg-brand-gold group-hover:text-ink">
              <Icon className="size-6" strokeWidth={1.75} aria-hidden />
            </span>

            <h3 className="font-display relative mt-5 text-lg font-bold leading-snug text-site-text-dark">
              {title}
            </h3>
            <p className="relative mt-2 text-sm leading-relaxed text-site-text">{body}</p>
          </article>
        );
      })}
    </div>
  );
}
