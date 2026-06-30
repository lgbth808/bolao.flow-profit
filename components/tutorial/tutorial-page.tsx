import Image from "next/image";
import type { MouseEvent } from "react";
import type { TutorialPageData } from "./tutorial-data";

type TutorialPageProps = {
  page: TutorialPageData;
  pageNumber: number;
  total: number;
  priority?: boolean;
  onCta: (event: MouseEvent<HTMLAnchorElement>, page: TutorialPageData) => void;
};

export function TutorialPage({
  page,
  pageNumber,
  total,
  priority = false,
  onCta
}: TutorialPageProps) {
  return (
    <article className="tutorial-page-motion flex min-h-[640px] flex-col rounded-lg border border-canary/55 bg-mist p-4 text-ink shadow-panel md:min-h-[680px] md:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-rose px-3 py-1 text-xs font-black uppercase text-white">
          Etapa {pageNumber}/{total}
        </span>
        {page.final ? (
          <span className="rounded-full border border-canary bg-white px-3 py-1 text-xs font-black uppercase text-field">
            🇧🇷 Brasil x Noruega 🇳🇴
          </span>
        ) : null}
      </div>

      <div className="relative mt-4 h-64 overflow-hidden rounded-lg border border-canary/35 bg-white md:h-80">
        <Image
          src={page.image}
          alt={page.imageAlt}
          fill
          sizes="(max-width: 768px) 92vw, 44vw"
          className="object-contain"
          priority={priority}
        />
      </div>

      <div className="mt-5 flex flex-1 flex-col">
        <h2 className="text-3xl font-black leading-tight text-field md:text-4xl">
          {page.title}
        </h2>
        <p className="mt-3 text-base font-semibold leading-relaxed text-coal/75">
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
            <p className="mt-2 text-sm font-semibold text-white/85">
              Abra o bolão e faça seus palpites para esta rodada.
            </p>
          </div>
        ) : null}

        {page.bullets?.length ? (
          <ul className="mt-5 grid gap-2">
            {page.bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-2 rounded-md border border-canary/30 bg-white px-3 py-2 text-sm font-bold text-coal/80"
              >
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-canary" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <a
          href={page.href ?? "#proxima-etapa"}
          onClick={(event) => onCta(event, page)}
          className="mt-auto inline-flex h-12 items-center justify-center rounded-md bg-field px-5 text-base font-black text-white transition hover:bg-rose focus:outline-none focus:ring-2 focus:ring-canary focus:ring-offset-2"
        >
          {page.cta}
        </a>
      </div>
    </article>
  );
}
