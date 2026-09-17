import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getSupabaseStorageHostname } from "./src/lib/supabase/storage";

const supabaseHostname = getSupabaseStorageHostname();
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Pin root so Turbopack does not lose `next` (avoids HMR panic refresh loops).
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
    ],
    serverActions: {
      bodySizeLimit: "256mb",
    },
  },
  images: {
    qualities: [75, 85, 90, 95, 100],
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
