import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://bolao.flow-profit.com"),
  applicationName: "Bet Barão by d. Rosa",
  title: "Bet Barão by d. Rosa",
  description: "O bolão da Família Silva.",
  icons: {
    icon: [
      { url: "/brand/favicon.png", type: "image/png" },
      { url: "/brand/favicon_32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon_64.png", sizes: "64x64", type: "image/png" }
    ],
    apple: [{ url: "/brand/apple_touch_icon.png", sizes: "180x180" }],
    shortcut: "/brand/favicon.png"
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Bet Barão by d. Rosa",
    description: "O bolão da Família Silva.",
    url: "https://bolao.flow-profit.com",
    siteName: "Bet Barão by d. Rosa",
    images: [
      {
        url: "/brand/og_image.png",
        width: 1200,
        height: 630,
        alt: "Bet Barão by d. Rosa"
      }
    ],
    locale: "pt_BR",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Bet Barão by d. Rosa",
    description: "O bolão da Família Silva.",
    images: ["/brand/og_image.png"]
  },
  appleWebApp: {
    title: "Bet Barão",
    capable: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
