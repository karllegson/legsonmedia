import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import SiteLogo from "@/components/site/SiteLogo";
import { business, marketingServices } from "@/lib/site/config";
import { brandTagline } from "@/lib/site/messaging";

export default function SiteFooter() {
  return (
    <footer className="bg-cream-deep text-site-text">
      <div className="h-1 bg-brand-gold" aria-hidden />

      <div className="site-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <SiteLogo variant="footer" linked={false} />
          <p className="mt-4 text-sm leading-relaxed text-site-text">{business.companyStory}</p>
          <p className="mt-3 text-xs font-semibold leading-relaxed text-brand-gold-dark">
            {brandTagline}
          </p>
        </div>

        <nav aria-label="Footer services">
          <h2 className="text-sm font-bold uppercase tracking-widest text-site-text-dark">Services</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {marketingServices.map((service) => (
              <li key={service.slug}>
                <Link href={service.href} className="text-site-text hover:text-brand-gold-dark">
                  {service.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Footer company">
          <h2 className="text-sm font-bold uppercase tracking-widest text-site-text-dark">Company</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/about" className="text-site-text hover:text-brand-gold-dark">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/blog" className="text-site-text hover:text-brand-gold-dark">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-site-text hover:text-brand-gold-dark">
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-site-text-dark">Contact</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a
                href={business.phoneHref}
                className="flex items-center gap-2.5 text-site-text hover:text-brand-gold-dark"
              >
                <Phone size={16} aria-hidden className="shrink-0 text-brand-gold-dark" />
                {business.phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${business.email}`}
                className="flex items-center gap-2.5 text-site-text hover:text-brand-gold-dark"
              >
                <Mail size={16} aria-hidden className="shrink-0 text-brand-gold-dark" />
                {business.email}
              </a>
            </li>
          </ul>
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-black"
          >
            Talk to Us
          </Link>
        </div>
      </div>

      <div className="border-t border-solid border-black/10">
        <div className="site-container flex flex-col items-center justify-between gap-3 py-5 text-xs text-site-text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} {business.name}. All rights reserved.</p>
          <p className="text-center">Marketing · SEO · Photo · Video · Social · Content</p>
        </div>
      </div>
    </footer>
  );
}
