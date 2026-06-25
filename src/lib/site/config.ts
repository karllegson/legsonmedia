export const business = {
  name: "Legson Media",
  legalName: "Legson Media",
  displayName: "Legson Media",
  slogan: "Rank. Create. Grow.",
  heroLocationLine: "Marketing · SEO · Media Production",
  heroHeadline: "We Build Brands That Get Found — and Get Chosen.",
  companyStory:
    "Legson Media is a full-service marketing agency with a deep SEO background. We design websites that convert, create photo and video that sells, and build content strategies that rank — so your business shows up when it matters most.",
  phone: "(209) 555-0100",
  phoneHref: "tel:+12095550100",
  email: "hello@legsonmedia.com",
  foundedYear: 2020,
  address: {
    street: "123 Main Street",
    city: "Modesto",
    state: "CA",
    zip: "95354",
    region: "Central California",
    full: "Modesto, CA — serving clients nationwide",
  },
  license: "",
  licenseNumber: "",
  domain: "https://www.legsonmedia.com",
} as const;

export type MarketingService = {
  title: string;
  slug: string;
  href: string;
  shortDescription: string;
  icon: "globe" | "search" | "camera" | "share" | "pen" | "home";
  featured?: boolean;
};

export const marketingServices: MarketingService[] = [
  {
    title: "Website Creation",
    slug: "websites",
    href: "/contact",
    shortDescription:
      "Custom, fast, mobile-first websites built to convert visitors into leads — not just look good in a portfolio.",
    icon: "globe",
    featured: true,
  },
  {
    title: "SEO & Rankings",
    slug: "seo",
    href: "/contact",
    shortDescription:
      "Our core strength. Technical SEO, local search, and content strategy that gets your site on page one — and keeps it there.",
    icon: "search",
    featured: true,
  },
  {
    title: "Photo & Video",
    slug: "photo-video",
    href: "/contact",
    shortDescription:
      "Professional photography and video production for brands, campaigns, and digital platforms.",
    icon: "camera",
    featured: true,
  },
  {
    title: "Real Estate Media",
    slug: "real-estate",
    href: "/contact",
    shortDescription:
      "Listing photography, cinematic walkthroughs, and drone footage that make properties stand out and sell faster.",
    icon: "home",
    featured: true,
  },
  {
    title: "Social Media Management",
    slug: "social-media",
    href: "/contact",
    shortDescription:
      "Strategy, posting, and community management across the platforms your audience actually uses.",
    icon: "share",
  },
  {
    title: "Content Creation",
    slug: "content",
    href: "/contact",
    shortDescription:
      "Blog posts, landing pages, ad copy, and brand storytelling — written and designed to rank and convert.",
    icon: "pen",
  },
];

export type TeamMemberProfile = {
  experience?: string;
  jobsDone?: string;
  bio: string;
  testimonial?: { quote: string; author: string };
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  initials: string;
  imageSrc?: string;
  isPlaceholder?: boolean;
  profile?: TeamMemberProfile;
};

export const teamMembers: TeamMember[] = [];

export const utilityNavLinks = [
  { label: "Services", href: "/#services" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

export const serviceMenuGroups = [
  {
    title: "Digital",
    description: "Websites and search visibility that drive real business.",
    href: "/#services",
    links: [
      { label: "Website Creation", href: "/contact" },
      { label: "SEO & Rankings", href: "/contact" },
      { label: "Content Creation", href: "/contact" },
    ],
  },
  {
    title: "Creative",
    description: "Visual content that captures attention and builds trust.",
    href: "/#services",
    links: [
      { label: "Photo & Video", href: "/contact" },
      { label: "Real Estate Media", href: "/contact" },
      { label: "Social Media Management", href: "/contact" },
    ],
  },
  {
    title: "Get Started",
    description: "Tell us your goals — we'll map the right mix of services.",
    href: "/contact",
    links: [
      { label: "Free Consultation", href: "/contact" },
      { label: "About Us", href: "/about" },
      { label: "Read the Blog", href: "/blog" },
    ],
  },
] as const;

export const whyUsNavLinks = [
  { label: "Why Legson Media", href: "/#why-us" },
  { label: "Our SEO Edge", href: "/#services" },
  { label: "Real Estate Media", href: "/#real-estate" },
  { label: "Get Started", href: "/contact" },
] as const;

export const aboutNavLinks = [
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;
