import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // 仅在生产构建时导出静态文件，开发时使用 SSR 模式以支持动态路由
  ...(isProd ? { output: "export" as const } : {}),
  basePath: "/aDiao-Blog",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
