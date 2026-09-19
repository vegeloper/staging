import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
