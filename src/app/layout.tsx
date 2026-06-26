import type { Metadata } from "next";
import "./globals.css";
import BackToTop from "@/components/BackToTop";
import ImageZoom from "@/components/ImageZoom";
import SearchOverlay from "@/components/SearchOverlay";
import ThemeInit from "@/components/ThemeInit";
import P5Canvas from "@/components/P5Canvas";

export const metadata: Metadata = {
  title: {
    default: "aDiaoYa · 啊叼一只鱼",
    template: "%s | aDiaoYa · 啊叼一只鱼",
  },
  description: "前端工程与 AI Agent 技术探索，记录构建智能应用的思考与实践。",
  keywords: ["前端", "AI Agent", "React", "TypeScript", "Next.js", "MCP"],
  authors: [{ name: "aDiaoYa" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/aDiao-Blog/favicon.svg" />
      </head>
      <body>
        <ThemeInit />
        <P5Canvas />
        <SearchOverlay />
        {children}
        <BackToTop />
        <ImageZoom />
      </body>
    </html>
  );
}
