import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Globe,
  Home,
  PenLine,
  Search,
  Share2,
} from "lucide-react";
import HomeHeroContent from "@/components/site/HomeHeroContent";
import HomeHeroSection from "@/components/site/HomeHeroSection";
import BrandPillars from "@/components/site/BrandPillars";
import WhoWeServeCards from "@/components/site/WhoWeServeCards";
import SectionIntro from "@/components/site/SectionIntro";
import WhyChooseUsSection from "@/components/site/WhyChooseUsSection";
import { business, marketingServices } from "@/lib/site/config";
import {
  audiences,
  homepageFaqs,
  processSteps,
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

function ServiceCard({ service }: { service: MarketingService }) {
  const Icon = serviceIcons[service.icon];

  return (
    <Link
      href={service.href}
      className="group flex flex-col rounded-2xl border border-solid border-gray-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-brand-gold/50 hover:shadow-lg sm:p-8"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-brand-gold transition-colors group-hover:bg-brand-gold group-hover:text-black">
        <Icon className="size-6" strokeWidth={1.75} aria-hidden />
      </span>
      <h3 className="mt-5 text-lg font-bold text-site-text-dark">{service.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">
        {service.shortDescription}
      </p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-black group-hover:text-brand-gold-dark">
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

export default function HomePage() {
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

      {/* Services */}
      <section id="services" className="scroll-mt-24 bg-gray-50 py-12 sm:py-24">
        <div className="site-container">
          <SectionIntro
            eyebrow="What We Do"
            title="Full-Service Marketing — With SEO at the Core"
            lede="Websites, search rankings, photo & video, social media, and content — one team, one strategy, built to grow your business."
          />

          <div className="mt-8 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {marketingServices.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
        </div>
      </section>

      {/* Real estate highlight */}
      <section
        id="real-estate"
        className="scroll-mt-24 border-y border-solid border-gray-100 bg-black py-12 text-white sm:py-24"
      >
        <div className="site-container">
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
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-gold px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-brand-gold-dark sm:text-base"
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
                  className="rounded-xl border border-solid border-white/10 bg-white/5 p-5 text-center sm:p-6"
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
      </section>

      {/* Who we serve */}
      <section className="bg-white py-12 sm:py-24">
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
      <section className="border-t border-solid border-gray-100 bg-gray-50 py-12 sm:py-24">
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
                className="rounded-2xl border border-solid border-gray-200 bg-white p-6 sm:p-7"
              >
                <span className="font-display text-3xl font-extrabold text-brand-gold/80">
                  {step}
                </span>
                <h3 className="mt-3 text-base font-bold text-site-text-dark sm:text-lg">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <WhyChooseUsSection
        items={[...whyChooseUs]}
        lede="SEO expertise meets creative production — that's the Legson Media difference."
      />

      {/* FAQ */}
      <section className="bg-white py-12 sm:py-24">
        <div className="site-container">
          <div className="mx-auto max-w-3xl">
            <SectionIntro
              eyebrow="FAQ"
              title="Common Questions"
              lede="Straight answers about what we do and how we help businesses grow online."
            />

            <div className="mt-6 space-y-2.5 sm:mt-12 sm:space-y-4">
              {homepageFaqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-xl border border-solid border-gray-200 bg-white px-5 py-4 transition-colors open:border-brand-gold/40 sm:px-6 sm:py-5"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-bold text-site-text-dark sm:text-base">
                    {faq.question}
                    <span className="shrink-0 text-brand-gold transition-transform group-open:rotate-90">
                      <ArrowRight className="size-4 sm:size-[18px]" aria-hidden />
                    </span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500 sm:mt-3">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section
        id="contact"
        className="scroll-mt-24 border-t border-solid border-gray-100 bg-black py-12 sm:py-24"
      >
        <div className="site-container">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                Get Started
              </p>
              <h2 className="font-display mt-3 text-2xl font-extrabold text-white sm:text-4xl">
                Ready to Rank, Create & Grow?
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/75">
                Tell us your goals — more leads, better Google rankings, stronger brand
                presence, or stunning listing media. We&apos;ll respond within one business day
                with a clear plan.
              </p>
              <p className="mt-6 text-sm text-white/60">
                Prefer to talk?{" "}
                <a
                  href={business.phoneHref}
                  className="font-bold text-brand-gold hover:text-brand-gold-dark"
                >
                  {business.phone}
                </a>{" "}
                ·{" "}
                <a
                  href={`mailto:${business.email}`}
                  className="font-bold text-brand-gold hover:text-brand-gold-dark"
                >
                  {business.email}
                </a>
              </p>
            </div>

            <div className="rounded-2xl border border-solid border-white/10 bg-white p-6 sm:p-8">
              <ContactForm formType="contact" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
