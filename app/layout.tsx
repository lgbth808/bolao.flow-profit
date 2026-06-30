import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://bolao.flow-profit.com"),
  applicationName: "Bet Barão by d. Rosa",
  title: "Bet Barão by d. Rosa",
  description: "O bolão da família Silva, agregados e amigos.",
  icons: {
    icon: [
      { url: "/brand/favicon.png", type: "image/png" },
      { url: "/brand/logo_simbolo.png", type: "image/png" }
    ],
    apple: [{ url: "/brand/logo_simbolo.png", type: "image/png" }],
    shortcut: "/brand/favicon.png"
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Bet Barão by d. Rosa",
    description: "O bolão da família Silva, agregados e amigos.",
    url: "https://bolao.flow-profit.com",
    siteName: "Bet Barão by d. Rosa",
    images: [
      {
        url: "/brand/logo_principal.png",
        width: 1200,
        height: 630,
        alt: "Bet Barão by d. Rosa, o bolão da família Silva"
      }
    ],
    locale: "pt_BR",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Bet Barão by d. Rosa",
    description: "O bolão da família Silva, agregados e amigos.",
    images: ["/brand/logo_principal.png"]
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
