import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TutorialBook } from "@/components/tutorial/tutorial-book";

export const metadata: Metadata = {
  title: "Tutorial | Bet Barão by d. Rosa",
  description:
    "Aprenda como participar do Bet Barão by d. Rosa, o bolão da família Silva."
};

export default function TutorialRoute() {
  return (
    <main className="min-h-screen bg-field text-white">
      <header className="border-b border-canary/30 bg-black/25">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/brand/logo_horizontal_dark.png"
              alt="Bet Barão by d. Rosa"
              width={220}
              height={110}
              className="h-14 w-auto object-contain"
              priority
            />
            <span className="sr-only">Início Bet Barão</span>
          </Link>

          <nav
            aria-label="Navegação do tutorial"
            className="flex flex-wrap items-center gap-2"
          >
            <Link
              href="/apostas"
              className="rounded-full bg-canary px-4 py-2 text-sm font-black text-field transition hover:bg-white"
            >
              Entrar no Bolão
            </Link>
            <Link
              href="/"
              className="rounded-full border border-canary/60 px-4 py-2 text-sm font-black text-white transition hover:bg-white/10"
            >
              Fazer Login
            </Link>
            <a
              href="#como-funciona"
              className="rounded-full border border-canary/60 px-4 py-2 text-sm font-black text-white transition hover:bg-white/10"
            >
              Ver Regras
            </a>
            <a
              href="https://wa.me/5591982585313"
              className="rounded-full border border-canary bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/20"
            >
              Falar com a D. Rosa
            </a>
          </nav>
        </div>
      </header>

      <div className="bg-[radial-gradient(circle_at_top_left,rgba(242,194,48,0.20),transparent_32%),linear-gradient(180deg,rgba(15,61,46,0.96),rgba(17,17,17,0.88))] py-6 md:py-8">
        <TutorialBook />

        <section
          id="como-funciona"
          className="mx-auto mt-6 grid max-w-7xl gap-3 px-4 text-sm font-semibold text-white/85 md:grid-cols-3"
        >
          <div className="rounded-lg border border-canary/30 bg-white/10 p-4">
            <p className="font-black text-canary">Bolão privado</p>
            <p className="mt-1">A participação é da família Silva, agregados e amigos.</p>
          </div>
          <div className="rounded-lg border border-canary/30 bg-white/10 p-4">
            <p className="font-black text-canary">Palpite por jogo</p>
            <p className="mt-1">Cada jogo tem seu próprio prêmio, pagamentos e rateio.</p>
          </div>
          <div className="rounded-lg border border-canary/30 bg-white/10 p-4">
            <p className="font-black text-canary">Placar certeiro</p>
            <p className="mt-1">
              Quem acertar o placar oficial divide o prêmio com os acertadores.
            </p>
          </div>
        </section>
      </div>

      <footer className="border-t border-canary/30 bg-black/35 px-4 py-6">
        <div className="mx-auto grid max-w-7xl gap-3 text-sm font-semibold text-white/80 md:grid-cols-4">
          <span>Ambiente privado</span>
          <span>Família e amigos</span>
          <span>Segurança e simplicidade</span>
          <span>Tradição que vira emoção</span>
        </div>
      </footer>
    </main>
  );
}
