import type { PostRecordDTO } from "@/lib/admin/posts.dto";
import { homeImages } from "@/lib/site/images";
import type { SidebarPostItem } from "@/lib/site/serviceAreaSidebar";
import { getServiceAreaSidebarReview } from "@/lib/site/serviceAreaSidebar";

export const blogEstimateDescription =
  "Tell us about your project and our team will follow up within one business day.";

export const blogSidebarReview = (() => {
  const review = getServiceAreaSidebarReview();
  return {
    initial: review.reviewerName.charAt(0),
    name: review.reviewerName,
    quote: review.excerpt,
    reviewsHref: review.href,
  };
})();

const FALLBACK_SIDEBAR_IMAGES = [
  homeImages.residentialRoofFraming,
  homeImages.customHomeFramingCrew,
  homeImages.twoStoryHomeFramingExterior,
] as const;

export function mapPostsToSidebarItems(posts: PostRecordDTO[]): SidebarPostItem[] {
  return posts.map((post, index) => {
    const image = FALLBACK_SIDEBAR_IMAGES[index % FALLBACK_SIDEBAR_IMAGES.length];

    return {
      id: post.id,
      title: post.title,
      href: `/blog/${post.slug}`,
      imageSrc: image.src,
      imageAlt: image.alt,
    };
  });
}
