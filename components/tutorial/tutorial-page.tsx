import Image from "next/image";
import Link from "next/link";
import type { TutorialPageData } from "./tutorial-data";

type TutorialPageProps = {
  page: TutorialPageData;
  pageNumber: number;
  total: number;
  priority?: boolean;
};

export function TutorialPage({
  page,
  pageNumber,
  total,
  priority = false
}: TutorialPageProps) {
  return (
    <article className="tutorial-page-motion flex min-h-[520px] flex-col rounded-lg border border-canary/55 bg-mist p-4 text-ink shadow-panel md:min-h-[600px] md:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-rose px-3 py-1 text-[11px] font-black uppercase text-white">
          {pageNumber}/{total}
        </span>
        {page.final ? (
          <span className="rounded-full border border-canary bg-white px-3 py-1 text-[11px] font-black uppercase text-field">
            🇧🇷 Brasil x Noruega 🇳🇴
          </span>
        ) : null}
      </div>

      <div className="relative mt-4 h-52 overflow-hidden rounded-lg border border-canary/35 bg-white md:h-72">
        <Image
          src={page.image}
          alt={page.imageAlt}
          fill
          sizes="(max-width: 768px) 92vw, 760px"
          className="object-contain"
          priority={priority}
        />
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <h2 className="text-2xl font-black leading-tight text-field md:text-4xl">
          {page.title}
        </h2>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-coal/75 md:text-base">
          {page.text}
        </p>

        {page.final ? (
          <div className="mt-4 rounded-lg border border-canary bg-field px-4 py-4 text-center text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-canary">
              Jogo em destaque
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-md bg-white px-3 py-2 text-base font-black text-field md:text-lg">
                🇧🇷 Brasil
              </span>
              <span className="text-lg font-black text-canary">x</span>
              <span className="rounded-md bg-white px-3 py-2 text-base font-black text-field md:text-lg">
                Noruega 🇳🇴
              </span>
            </div>
            <Link
              href={page.href ?? "/apostas"}
              className="mt-4 inline-flex h-12 items-center justify-center rounded-md bg-canary px-5 text-base font-black text-field transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-field"
            >
              Entrar no Bolão
            </Link>
          </div>
        ) : null}
      </div>
    </article>
  );
}
