import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // 仅在生产构建时导出静态文件，开发时使用 SSR 模式以支持动态路由
  ...(isProd ? { output: "export" as const } : {}),
  // 生产构建排除 .ts 后缀，跳过 src/app/api/*/route.ts（静态导出不支持 Route Handler）
  pageExtensions: isProd
    ? ["tsx", "jsx", "js"] // 排除 .ts → route.ts 不被识别
    : ["tsx", "ts", "jsx", "js"],
  basePath: "/aDiao-Blog",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
