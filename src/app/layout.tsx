import type { Metadata } from "next";
import "./globals.css";
import BackToTop from "@/components/BackToTop";
import ImageZoom from "@/components/ImageZoom";
import SearchOverlay from "@/components/SearchOverlay";
import ThemeInit from "@/components/ThemeInit";
import P5Canvas from "@/components/P5Canvas";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import { SearchProvider } from "@/contexts/SearchContext";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    default: SITE.title,
    template: `%s | ${SITE.title}`,
  },
  description: SITE.description,
  keywords: [...SITE.keywords],
  authors: [{ name: SITE.author }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href={`${SITE.basePath}/favicon.svg`} />
      </head>
      <body>
        <ThemeInit />
        <SearchProvider>
          <P5Canvas />
          <SearchOverlay />
          <KeyboardShortcuts />
          {children}
          <BackToTop />
          <ImageZoom />
        </SearchProvider>
      </body>
    </html>
  );
}
