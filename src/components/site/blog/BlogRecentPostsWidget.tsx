import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { PostRecordDTO } from "@/lib/admin/posts.dto";

const PLACEHOLDER_POSTS = [
  "Local SEO Basics for Service Businesses",
  "What Makes a Website Actually Convert Visitors",
  "Real Estate Media That Helps Listings Stand Out",
] as const;

type BlogRecentPostsWidgetProps = {
  posts: PostRecordDTO[];
};

export function BlogRecentPostsWidget({ posts }: BlogRecentPostsWidgetProps) {
  const items =
    posts.length > 0
      ? posts.map((post) => ({
          key: post.id,
          href: `/blog/${post.slug}`,
          title: post.title,
        }))
      : PLACEHOLDER_POSTS.map((title, index) => ({
          key: `placeholder-${index}`,
          href: "/blog",
          title,
        }));

  return (
    <aside className="blog-widget blog-recent-posts-widget">
      <h2 className="blog-recent-posts-heading">Recent Posts</h2>
      <ul className="blog-recent-posts-list">
        {items.map((item) => (
          <li key={item.key}>
            <Link href={item.href} className="blog-recent-posts-item">
              <span className="blog-recent-posts-thumb-placeholder" aria-hidden />
              <span className="blog-recent-posts-title">{item.title}</span>
              <ChevronRight
                size={18}
                strokeWidth={2.5}
                aria-hidden
                className="blog-recent-posts-chevron"
              />
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
