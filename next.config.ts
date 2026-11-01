import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Pin project root. Without this, Next infers root from the nearest lockfile
// upward (e.g. ~/package-lock.json) and Turbopack ends up watching the whole
// home directory -> very slow compiles + dev server OOM.
const projectRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
  // Bootstrap 5 SCSS triggers hundreds of Dart Sass deprecation warnings that
  // Turbopack re-emits on every request in dev -> log flood + memory growth.
  // Remove once migrated to @use / Bootstrap ships a Sass-module build.
  sassOptions: {
    quietDeps: true,
    silenceDeprecations: ["import", "if-function", "color-functions", "global-builtin"],
  },
  images: {
    remotePatterns: [
      { hostname: "ik.imagekit.io" },
    ],
  },
};

export default withNextIntl(nextConfig);
