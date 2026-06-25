export type PageStatus = "published" | "draft";

export type PageListView = "all" | "published" | "draft" | "hidden" | "default";

export type PageTreeItem = {
  id: string;
  title: string;
  status: PageStatus;
  href?: string;
  adminHref?: string;
  suffix?: string;
  hidden?: boolean;
  isDefault?: boolean;
  children?: PageTreeItem[];
};

export type FlatPageRow = {
  id: string;
  title: string;
  status: PageStatus;
  href?: string;
  adminHref?: string;
  suffix?: string;
  hidden?: boolean;
  isDefault?: boolean;
  depth: number;
  hasChildren: boolean;
  parentId: string | null;
  isFirstSibling: boolean;
  isLastSibling: boolean;
};

export type PageRowMoreMenuAction =
  | "add-child-link"
  | "add-child-page"
  | "insert-before"
  | "insert-after"
  | "push-top"
  | "push-bottom"
  | "clone";

export type PageRowMoreMenuItem = {
  id: PageRowMoreMenuAction;
  label: string;
  disabled?: (row: FlatPageRow) => boolean;
};

export const PAGE_ROW_MORE_MENU_ITEMS: PageRowMoreMenuItem[] = [
  { id: "add-child-link", label: "Add Child Link" },
  { id: "add-child-page", label: "Add Child Page" },
  { id: "insert-before", label: "Insert Page Before" },
  { id: "insert-after", label: "Insert Page After" },
  {
    id: "push-top",
    label: "Push to Top",
    disabled: (row) => row.isFirstSibling,
  },
  {
    id: "push-bottom",
    label: "Push to Bottom",
    disabled: (row) => row.isLastSibling,
  },
  { id: "clone", label: "Clone" },
];

export const PAGE_LIST_VIEWS: { value: PageListView; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "hidden", label: "Show Hidden" },
  { value: "default", label: "Default Pages" },
];

/** Live Next.js routes — read-only until a pages CMS is connected. */
export function getSitePages(): PageTreeItem[] {
  return [
    {
      id: "home",
      title: "Home",
      status: "published",
      href: "/",
      suffix: "Front Page",
      isDefault: true,
    },
    {
      id: "blog",
      title: "Blog",
      status: "published",
      href: "/blog",
      suffix: "Posts Page",
      isDefault: true,
    },
    { id: "about", title: "About", status: "published", href: "/about" },
    { id: "contact", title: "Contact", status: "published", href: "/contact" },
  ];
}

/** @deprecated Use getSitePages — kept for imports during transition. */
export function getPlaceholderPages(): PageTreeItem[] {
  return getSitePages();
}

function collectParentIds(items: PageTreeItem[]): string[] {
  const ids: string[] = [];

  for (const item of items) {
    if (item.children?.length) {
      ids.push(item.id, ...collectParentIds(item.children));
    }
  }

  return ids;
}

export function getDefaultExpandedPageIds(items: PageTreeItem[]): string[] {
  return collectParentIds(items);
}

function flattenItems(
  items: PageTreeItem[],
  expandedIds: Set<string>,
  depth = 0,
  parentId: string | null = null,
): FlatPageRow[] {
  const rows: FlatPageRow[] = [];

  items.forEach((item, index) => {
    const hasChildren = Boolean(item.children?.length);
    const siblings = items;

    rows.push({
      id: item.id,
      title: item.title,
      status: item.status,
      href: item.href,
      adminHref: item.adminHref,
      suffix: item.suffix,
      hidden: item.hidden,
      isDefault: item.isDefault,
      depth,
      hasChildren,
      parentId,
      isFirstSibling: index === 0,
      isLastSibling: index === siblings.length - 1,
    });

    if (hasChildren && expandedIds.has(item.id)) {
      rows.push(...flattenItems(item.children!, expandedIds, depth + 1, item.id));
    }
  });

  return rows;
}

export function flattenPageTree(
  items: PageTreeItem[],
  expandedIds: Set<string>,
): FlatPageRow[] {
  return flattenItems(items, expandedIds);
}

export function countPages(items: PageTreeItem[]): {
  all: number;
  published: number;
  draft: number;
  hidden: number;
  default: number;
} {
  const flat = flattenItems(items, new Set(collectParentIds(items)));

  return {
    all: flat.length,
    published: flat.filter((row) => row.status === "published" && !row.hidden).length,
    draft: flat.filter((row) => row.status === "draft" && !row.hidden).length,
    hidden: flat.filter((row) => row.hidden).length,
    default: flat.filter((row) => row.isDefault).length,
  };
}

export function filterPageRows(
  rows: FlatPageRow[],
  view: PageListView,
  searchQuery: string,
): FlatPageRow[] {
  const query = searchQuery.trim().toLowerCase();

  return rows.filter((row) => {
    if (query && !row.title.toLowerCase().includes(query)) {
      return false;
    }

    switch (view) {
      case "published":
        return row.status === "published" && !row.hidden;
      case "draft":
        return row.status === "draft" && !row.hidden;
      case "hidden":
        return Boolean(row.hidden);
      case "default":
        return Boolean(row.isDefault);
      default:
        return !row.hidden;
    }
  });
}

export function getViewLabel(
  view: "hidden",
  counts: ReturnType<typeof countPages>,
): string {
  return `Hidden (${counts.hidden})`;
}
