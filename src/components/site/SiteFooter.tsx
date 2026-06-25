import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import SiteLogo from "@/components/site/SiteLogo";
import { business, marketingServices } from "@/lib/site/config";
import { framingFirstTagline } from "@/lib/site/messaging";

export default function SiteFooter() {
  return (
    <footer className="bg-black text-white">
      <div className="h-1 bg-brand-gold" aria-hidden />

      <div className="site-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <SiteLogo variant="footer" linked={false} />
          <p className="mt-4 text-sm leading-relaxed text-white/70">{business.companyStory}</p>
          <p className="mt-3 text-xs font-semibold leading-relaxed text-brand-gold">
            {framingFirstTagline}
          </p>
        </div>

        <nav aria-label="Footer services">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">Services</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {marketingServices.map((service) => (
              <li key={service.slug}>
                <Link href={service.href} className="text-white/80 hover:text-brand-gold">
                  {service.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Footer company">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">Company</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/about" className="text-white/80 hover:text-brand-gold">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/projects" className="text-white/80 hover:text-brand-gold">
                Our Work
              </Link>
            </li>
            <li>
              <Link href="/blog" className="text-white/80 hover:text-brand-gold">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-white/80 hover:text-brand-gold">
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">Contact</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a
                href={business.phoneHref}
                className="flex items-center gap-2.5 text-white/80 hover:text-brand-gold"
              >
                <Phone size={16} aria-hidden className="shrink-0 text-brand-gold" />
                {business.phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${business.email}`}
                className="flex items-center gap-2.5 text-white/80 hover:text-brand-gold"
              >
                <Mail size={16} aria-hidden className="shrink-0 text-brand-gold" />
                {business.email}
              </a>
            </li>
          </ul>
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-lg bg-brand-gold px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-brand-gold-dark"
          >
            Free Consultation
          </Link>
        </div>
      </div>

      <div className="border-t border-solid border-white/10">
        <div className="site-container flex flex-col items-center justify-between gap-3 py-5 text-xs text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} {business.name}. All rights reserved.</p>
          <p className="text-center">Marketing · SEO · Photo · Video · Social · Content</p>
        </div>
      </div>
    </footer>
  );
}
