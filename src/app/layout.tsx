import type { Metadata } from "next";
import "./globals.css";
import BackToTop from "@/components/BackToTop";
import ImageZoom from "@/components/ImageZoom";
import SearchOverlay from "@/components/SearchOverlay";
import ThemeInit from "@/components/ThemeInit";
import P5CanvasWrapper from "@/components/P5CanvasWrapper";
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
  openGraph: {
    title: SITE.title,
    description: SITE.description,
    type: "website",
    locale: "zh_CN",
    siteName: SITE.title,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href={`${SITE.basePath}/favicon.svg`} />
      </head>
      <body suppressHydrationWarning>
        <ThemeInit />
        <SearchProvider>
          <P5CanvasWrapper />
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
