import type { Metadata } from "next";
import { business } from "./config";

export const SITE_URL = business.domain;
export const SITE_NAME = business.name;
export const SITE_BRAND = business.displayName;

/** Stable public logo URL — used in schema, OG, and brand metadata. */
export const SITE_LOGO = {
  path: "/logo.png",
  url: `${SITE_URL}/logo.png`,
  width: 1024,
  height: 1024,
  alt: `${SITE_NAME} logo`,
} as const;

/** Stable favicon/icon paths in `/public` (no Next.js cache-busting query strings). */
export const siteIcons: NonNullable<Metadata["icons"]> = {
  icon: [
    { url: "/favicon.ico", sizes: "any" },
    { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
    { url: "/icon-96.png", sizes: "96x96", type: "image/png" },
    { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
  ],
  apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  shortcut: "/favicon.ico",
};

const DEFAULT_DESCRIPTION =
  "Legson Media — marketing agency specializing in website creation, SEO, photo & video production, social media, content creation, and real estate media.";

export const defaultOgImage = {
  url: SITE_LOGO.path,
  width: SITE_LOGO.width,
  height: SITE_LOGO.height,
  alt: SITE_LOGO.alt,
};

export const homepageOgImage = {
  url: SITE_LOGO.path,
  width: SITE_LOGO.width,
  height: SITE_LOGO.height,
  alt: SITE_LOGO.alt,
};

/** Site-wide defaults merged into every public page via `(site)/layout.tsx`. */
export const siteDefaultMetadata: Metadata = {
  title: {
    default: `${SITE_BRAND} | Marketing, SEO & Media`,
    template: `%s | ${SITE_BRAND}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_BRAND, url: SITE_URL }],
  creator: SITE_BRAND,
  publisher: SITE_NAME,
  icons: siteIcons,
  manifest: "/manifest.webmanifest",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    images: [defaultOgImage.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

type PageSeoInput = {
  title: string;
  description: string;
  path: string;
  ogImage?: { url: string; width?: number; height?: number; alt: string };
  noIndex?: boolean;
};

function resolveUrl(path: string) {
  if (path === "/") {
    return SITE_URL;
  }
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function normalizeTitle(title: string) {
  const trimmed = title.trim();
  const brandSuffix = ` | ${SITE_BRAND}`;
  const legalSuffix = ` | ${SITE_NAME}`;

  if (trimmed.endsWith(brandSuffix)) {
    return trimmed.slice(0, -brandSuffix.length);
  }

  if (trimmed.endsWith(legalSuffix)) {
    return trimmed.slice(0, -legalSuffix.length);
  }

  return trimmed;
}

function fullTitle(title: string) {
  return `${normalizeTitle(title)} | ${SITE_BRAND}`;
}

/** Consistent metadata for interior pages (title, description, canonical, OG, Twitter). */
export function buildPageMetadata(input: PageSeoInput): Metadata {
  const url = resolveUrl(input.path);
  const ogImage = input.ogImage ?? defaultOgImage;
  const title = normalizeTitle(input.title);
  const ogTitle = fullTitle(title);

  return {
    title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: ogTitle,
      description: input.description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: input.description,
      images: [ogImage.url],
    },
    ...(input.noIndex
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}

export const homepageMetadata: Metadata = {
  title: {
    absolute: `${SITE_BRAND} | Marketing, SEO & Media Production`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "Legson Media",
    "marketing agency",
    "SEO services",
    "website creation",
    "real estate photography",
    "real estate video",
    "social media management",
    "content creation",
    "video production",
  ],
  alternates: { canonical: SITE_URL },
  icons: siteIcons,
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: `${SITE_BRAND} | Marketing, SEO & Media Production`,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    images: [defaultOgImage, homepageOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_BRAND} | Marketing, SEO & Media Production`,
    description: DEFAULT_DESCRIPTION,
    images: [SITE_LOGO.path, homepageOgImage.url],
  },
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  alternateName: SITE_BRAND,
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: SITE_LOGO.url,
    width: SITE_LOGO.width,
    height: SITE_LOGO.height,
    caption: SITE_LOGO.alt,
  },
  image: SITE_LOGO.url,
  telephone: business.phone,
  email: business.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: business.address.street,
    addressLocality: business.address.city,
    addressRegion: business.address.state,
    postalCode: business.address.zip,
    addressCountry: "US",
  },
};

export const logoSchemaImage = {
  "@type": "ImageObject" as const,
  url: SITE_LOGO.url,
  width: SITE_LOGO.width,
  height: SITE_LOGO.height,
  caption: SITE_LOGO.alt,
};
