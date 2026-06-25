import { SITE_LOGO } from "@/lib/site/seo";

export type SidebarPostItem = {
  id: string;
  title: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
};

export type SidebarReviewItem = {
  reviewerName: string;
  rating: number;
  excerpt: string;
  href: string;
};

const SIDEBAR_POSTS: SidebarPostItem[] = [
  {
    id: "post-1",
    title: "Local SEO Basics for Service Businesses",
    href: "/blog",
    imageSrc: SITE_LOGO.path,
    imageAlt: SITE_LOGO.alt,
  },
  {
    id: "post-2",
    title: "What Makes a Website Actually Convert Visitors",
    href: "/blog",
    imageSrc: SITE_LOGO.path,
    imageAlt: SITE_LOGO.alt,
  },
  {
    id: "post-3",
    title: "Real Estate Media That Helps Listings Stand Out",
    href: "/blog",
    imageSrc: SITE_LOGO.path,
    imageAlt: SITE_LOGO.alt,
  },
];

const SIDEBAR_REVIEW: SidebarReviewItem = {
  reviewerName: "Maureen L.",
  rating: 5,
  excerpt:
    "Legson Media rebuilt our site and improved our local rankings within months. Clear communication and real results.",
  href: "/contact",
};

export function getServiceAreaSidebarPosts(): SidebarPostItem[] {
  return SIDEBAR_POSTS;
}

export function getServiceAreaSidebarReview(): SidebarReviewItem {
  return SIDEBAR_REVIEW;
}
