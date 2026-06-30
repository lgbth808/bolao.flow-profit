import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TutorialBook } from "@/components/tutorial/tutorial-book";

export const metadata: Metadata = {
  title: "Bet Barão by d. Rosa — Tutorial",
  description:
    "Aprenda como participar do bolão da família Silva, agregados e amigos.",
  alternates: {
    canonical: "https://bolao.flow-profit.com/tutorial"
  },
  openGraph: {
    title: "Bet Barão by d. Rosa — Tutorial",
    description:
      "Aprenda como participar do bolão da família Silva, agregados e amigos.",
    url: "https://bolao.flow-profit.com/tutorial",
    type: "website",
    images: [
      {
        url: "/brand/og_tutorial.png",
        width: 1200,
        height: 630,
        alt: "Tutorial Bet Barão by d. Rosa"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Bet Barão by d. Rosa — Tutorial",
    description:
      "Aprenda como participar do bolão da família Silva, agregados e amigos.",
    images: ["/brand/og_tutorial.png"]
  }
};

export default function TutorialRoute() {
  return (
    <main className="min-h-screen bg-field text-white">
      <header className="border-b border-canary/30 bg-black/25">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/brand/logos/logo_horizontal_dark.png"
              alt="Bet Barão by d. Rosa"
              width={220}
              height={110}
              className="h-11 w-auto object-contain sm:h-14"
              priority
            />
            <span className="sr-only">Início Bet Barão</span>
          </Link>

          <nav aria-label="Navegação do tutorial">
            <Link
              href="/"
              className="rounded-full border border-canary/60 px-4 py-2 text-sm font-black text-white transition hover:bg-white/10"
            >
              Fazer Login
            </Link>
          </nav>
        </div>
      </header>

      <div className="bg-[radial-gradient(circle_at_top_left,rgba(242,194,48,0.20),transparent_32%),linear-gradient(180deg,rgba(15,61,46,0.96),rgba(17,17,17,0.88))] py-4 md:py-6">
        <TutorialBook />
      </div>
    </main>
  );
}
