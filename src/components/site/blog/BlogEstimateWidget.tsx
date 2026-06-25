import Link from "next/link";
import { Phone } from "lucide-react";
import { business } from "@/lib/site/config";

export function BlogEstimateWidget() {
  return (
    <aside className="blog-widget blog-estimate-widget">
      <div className="blog-estimate-widget-header">Book a Free Consultation</div>
      <div className="blog-estimate-widget-body">
        <p className="blog-estimate-widget-copy">
          Ready to rank higher, launch a new site, or level up your media? Tell us your goals and
          we&apos;ll follow up within one business day.
        </p>
        <Link href="/contact" className="blog-estimate-widget-primary">
          Book a Free Consultation
        </Link>
        <a href={business.phoneHref} className="blog-estimate-widget-phone">
          <Phone size={18} strokeWidth={2} aria-hidden />
          {business.phone}
        </a>
      </div>
    </aside>
  );
}
