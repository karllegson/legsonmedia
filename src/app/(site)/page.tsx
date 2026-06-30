import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  Globe,
  Home,
  PenLine,
  Quote,
  Search,
  Share2,
} from "lucide-react";
import HomeHeroContent from "@/components/site/HomeHeroContent";
import HomeHeroSection from "@/components/site/HomeHeroSection";
import BrandPillars from "@/components/site/BrandPillars";
import WhoWeServeCards from "@/components/site/WhoWeServeCards";
import SectionIntro from "@/components/site/SectionIntro";
import WhyChooseUsSection from "@/components/site/WhyChooseUsSection";
import { fetchRecentPostsForSite } from "@/app/admin/(shell)/posts/actions";
import { business, marketingServices } from "@/lib/site/config";
import {
  audiences,
  homepageFaqs,
  processSteps,
  testimonials,
  whyChooseUs,
} from "@/lib/site/messaging";
import { homepageMetadata, logoSchemaImage, organizationSchema } from "@/lib/site/seo";
import type { MarketingService } from "@/lib/site/config";

const ContactForm = dynamic(() => import("@/components/site/ContactForm"));

export const metadata: Metadata = homepageMetadata;

const serviceIcons = {
  globe: Globe,
  search: Search,
  camera: Camera,
  share: Share2,
  pen: PenLine,
  home: Home,
} as const;

function ServiceCard({
  service,
  featured = false,
}: {
  service: MarketingService;
  featured?: boolean;
}) {
  const Icon = serviceIcons[service.icon];

  if (featured) {
    return (
      <Link
        href={service.href}
        className="group flex flex-col rounded-3xl bg-ink p-7 text-white transition-all hover:-translate-y-1 sm:p-8"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold text-ink">
          <Icon className="size-6" strokeWidth={1.75} aria-hidden />
        </span>
        <h3 className="mt-5 text-lg font-bold text-white">{service.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70">
          {service.shortDescription}
        </p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-gold">
          Learn more
          <ArrowRight
            size={15}
            aria-hidden
            className="transition-transform group-hover:translate-x-1"
          />
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={service.href}
      className="group flex flex-col rounded-3xl border border-solid border-black/10 bg-white p-7 transition-all hover:-translate-y-1 hover:border-brand-gold sm:p-8"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/20 text-brand-gold-dark transition-colors group-hover:bg-brand-gold group-hover:text-ink">
        <Icon className="size-6" strokeWidth={1.75} aria-hidden />
      </span>
      <h3 className="mt-5 text-lg font-bold text-site-text-dark">{service.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-site-text">
        {service.shortDescription}
      </p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-site-text-dark group-hover:text-brand-gold-dark">
        Learn more
        <ArrowRight
          size={15}
          aria-hidden
          className="transition-transform group-hover:translate-x-1"
        />
      </span>
    </Link>
  );
}

const professionalServiceSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: business.name,
  url: business.domain,
  telephone: business.phone,
  email: business.email,
  logo: logoSchemaImage,
  image: logoSchemaImage.url,
  description: business.companyStory,
  areaServed: { "@type": "Country", name: "United States" },
  serviceType: marketingServices.map((s) => s.title),
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: homepageFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

const BLOG_CARD_THEMES = [
  "bg-[radial-gradient(circle_at_30%_30%,#ffe066,#ffcc00)] text-ink",
  "bg-ink text-white",
  "bg-cream-deep text-ink",
] as const;

export default async function HomePage() {
  const recentPosts = await fetchRecentPostsForSite({ limit: 3 });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <HomeHeroSection>
        <HomeHeroContent />
      </HomeHeroSection>

      <BrandPillars />

      {/* Services — two-column MLab layout */}
      <section id="services" className="scroll-mt-24 bg-cream-deep py-12 sm:py-24">
        <div className="site-container">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-dark sm:text-sm">
                What We Do
              </p>
              <h2 className="font-display mt-3 text-3xl font-extrabold leading-tight tracking-tight text-site-text-dark sm:text-5xl">
                Our services
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-site-text sm:text-base">
                We focus on the work that actually moves the needle — websites that convert, search
                rankings that last, and content that gets you found. One team, one strategy, built
                around SEO.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-black"
              >
                Get Started
                <ArrowUpRight size={16} strokeWidth={2.5} aria-hidden />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
              {marketingServices.map((service, index) => (
                <ServiceCard
                  key={service.slug}
                  service={service}
                  featured={index === 0}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Real estate highlight — black feature card on cream */}
      <section id="real-estate" className="scroll-mt-24 bg-cream py-12 sm:py-24">
        <div className="site-container">
          <div className="overflow-hidden rounded-[2rem] bg-ink p-7 text-white sm:p-12 lg:p-16">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                  Specialty Service
                </p>
                <h2 className="font-display mt-3 text-2xl font-extrabold leading-tight text-white sm:text-4xl">
                  Real Estate Photo & Video That Sells Listings
                </h2>
                <p className="mt-4 text-base leading-relaxed text-white/75">
                  One of our strongest offerings. We deliver cinematic listing walkthroughs,
                  professional photography, drone footage, and social-ready clips — everything
                  agents and brokers need to generate more showings and close faster.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-white/80">
                  {[
                    "HDR listing photography",
                    "Cinematic property walkthroughs",
                    "Drone aerial footage",
                    "Social media reels & clips",
                    "Agent brand websites & SEO",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-gold px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-brand-gold-dark sm:text-base"
                >
                  Book Real Estate Media
                  <ArrowRight size={18} aria-hidden />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[
                  { label: "Listings Shot", value: "500+" },
                  { label: "Avg. Turnaround", value: "24hr" },
                  { label: "Video + Photo", value: "In-House" },
                  { label: "Markets Served", value: "CA+" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-solid border-white/10 bg-white/5 p-5 text-center sm:p-6"
                  >
                    <p className="font-display text-2xl font-extrabold text-brand-gold sm:text-3xl">
                      {value}
                    </p>
                    <p className="mt-1 text-xs text-white/60 sm:text-sm">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who we serve */}
      <section className="bg-cream py-12 sm:py-24">
        <div className="site-container">
          <SectionIntro
            eyebrow="Who We Serve"
            title="Built for Businesses That Want to Grow"
            lede="Whether you're a local service company, a real estate pro, or a growing brand — we have the SEO and creative firepower to get you there."
          />
          <WhoWeServeCards items={[...audiences]} />
        </div>
      </section>

      {/* Process */}
      <section className="bg-cream-deep py-12 sm:py-24">
        <div className="site-container">
          <SectionIntro
            eyebrow="How It Works"
            title="From Strategy to Rankings in Four Steps"
            lede="A clear process — no guesswork, no endless revisions without results."
          />

          <div className="mt-8 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map(({ step, title, body }) => (
              <article
                key={step}
                className="rounded-3xl border border-solid border-black/10 bg-white p-6 sm:p-7"
              >
                <span className="font-display text-3xl font-extrabold text-brand-gold-dark">
                  {step}
                </span>
                <h3 className="mt-3 text-base font-bold text-site-text-dark sm:text-lg">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-site-text">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <WhyChooseUsSection
        items={[...whyChooseUs]}
        lede="SEO expertise meets creative production — that's the Legson Media difference."
      />

      {/* Testimonials */}
      <section className="bg-cream py-12 sm:py-24">
        <div className="site-container">
          <div className="grid gap-10 md:grid-cols-2 md:gap-8 lg:gap-16">
            {testimonials.map((t) => (
              <figure key={t.author} className="flex flex-col">
                <Quote
                  size={40}
                  aria-hidden
                  className="text-brand-gold"
                  fill="currentColor"
                  strokeWidth={0}
                />
                <blockquote className="font-display mt-4 text-xl font-bold leading-snug text-site-text-dark sm:text-2xl">
                  {t.quote}
                </blockquote>
                <p className="mt-4 text-sm leading-relaxed text-site-text">{t.body}</p>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold/25 text-sm font-bold text-brand-gold-dark">
                    {t.author.charAt(0)}
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-site-text-dark">{t.author}</span>
                    <span className="block text-xs text-site-text-muted">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — two-column with highlighted accordion */}
      <section className="bg-cream-deep py-12 sm:py-24">
        <div className="site-container">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <h2 className="font-display text-4xl font-extrabold tracking-tight text-site-text-dark sm:text-5xl">
                FAQ
              </h2>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-site-text">
                Can&apos;t find the answer you&apos;re looking for? Ask your question and get an
                answer within 24 hours.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-black"
              >
                Ask a question
                <ArrowUpRight size={16} strokeWidth={2.5} aria-hidden />
              </Link>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {homepageFaqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-2xl border border-solid border-black/10 bg-white px-5 py-4 transition-colors open:border-brand-gold open:bg-brand-gold/15 sm:px-7 sm:py-5"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-site-text-dark sm:text-base">
                    {faq.question}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-transform group-open:rotate-45">
                      <span className="text-lg leading-none">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-site-text">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog teaser */}
      {recentPosts.length > 0 ? (
        <section className="bg-cream py-12 sm:py-24">
          <div className="site-container">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <h2 className="font-display text-4xl font-extrabold tracking-tight text-site-text-dark sm:text-5xl">
                Blog
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-site-text">
                Insights on marketing, SEO, and media production — written by the team that does the
                work.
              </p>
            </div>

            <div className="mt-8 grid gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
              {recentPosts.map((post, index) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-solid border-black/10 bg-white transition-all hover:-translate-y-1 hover:border-brand-gold"
                >
                  <div
                    className={`flex aspect-[16/10] items-center justify-center ${
                      BLOG_CARD_THEMES[index % BLOG_CARD_THEMES.length]
                    }`}
                  >
                    <PenLine size={48} aria-hidden strokeWidth={1.25} />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-base font-bold leading-snug text-site-text-dark sm:text-lg">
                      {post.title}
                    </h3>
                    {post.excerpt || post.metaDescription ? (
                      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-site-text">
                        {post.excerpt || post.metaDescription}
                      </p>
                    ) : null}
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-site-text-dark group-hover:text-brand-gold-dark">
                      Read article
                      <ArrowRight
                        size={15}
                        aria-hidden
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-full border border-solid border-black/15 px-6 py-3 text-sm font-bold text-site-text-dark transition-colors hover:border-brand-gold hover:text-brand-gold-dark"
              >
                View all articles
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Contact CTA */}
      <section id="contact" className="scroll-mt-24 bg-cream-deep py-12 sm:py-24">
        <div className="site-container">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-dark">
                Get Started
              </p>
              <h2 className="font-display mt-3 text-3xl font-extrabold text-site-text-dark sm:text-5xl">
                Ready to Rank, Create &amp; Grow?
              </h2>
              <p className="mt-4 text-base leading-relaxed text-site-text">
                Tell us your goals — more leads, better Google rankings, stronger brand presence, or
                stunning listing media. We&apos;ll respond within one business day with a clear plan.
              </p>
              <p className="mt-6 text-sm text-site-text">
                Prefer to talk?{" "}
                <a
                  href={business.phoneHref}
                  className="font-bold text-brand-gold-dark hover:text-ink"
                >
                  {business.phone}
                </a>{" "}
                ·{" "}
                <a
                  href={`mailto:${business.email}`}
                  className="font-bold text-brand-gold-dark hover:text-ink"
                >
                  {business.email}
                </a>
              </p>
            </div>

            <div className="rounded-3xl border border-solid border-black/10 bg-white p-6 sm:p-8">
              <ContactForm formType="contact" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
