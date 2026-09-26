import type { CSSProperties } from "react";
import type { Metadata } from "next";

import { SiteSettingsProvider } from "@/components/site/SiteSettings";
import { themeStyleVars } from "@/lib/site/defaults";
import { getPublishedSiteSettings } from "@/lib/site/public";

import "./globals.css";

export const metadata: Metadata = {
  title: "Landing Trip | دات‌وان تریپ",
  description: "نسل جدید حمل‌ونقل شهری و بین‌شهری با دات‌وان تریپ",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      nosnippet: true,
    },
  },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/figma/logo.png",
    shortcut: "/figma/logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = await getPublishedSiteSettings();
  return (
    <html lang="fa" dir="rtl" style={themeStyleVars(site.theme) as CSSProperties}>
      <body className="antialiased">
        <SiteSettingsProvider value={site}>{children}</SiteSettingsProvider>
      </body>
    </html>
  );
}
