"use client";

import Link from "next/link";
import { MouseEvent, TouchEvent, useEffect, useMemo, useState } from "react";
import { TutorialNavigation } from "./tutorial-navigation";
import { TutorialPage } from "./tutorial-page";
import { TutorialProgress } from "./tutorial-progress";
import { tutorialPages, type TutorialPageData } from "./tutorial-data";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const FIRST_PAGE = 0;

export function TutorialBook() {
  const [currentIndex, setCurrentIndex] = useState(FIRST_PAGE);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [shortcutDialogOpen, setShortcutDialogOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(
    null
  );

  const totalPages = tutorialPages.length;
  const currentPage = tutorialPages[currentIndex];
  const nextSpreadPage = tutorialPages[currentIndex + 1] ?? null;
  const isLastPage = currentIndex === totalPages - 1;

  const pageTitle = useMemo(
    () => `${currentIndex + 1}. ${currentPage.title}`,
    [currentIndex, currentPage.title]
  );

  function goTo(index: number) {
    setCurrentIndex(Math.max(FIRST_PAGE, Math.min(index, totalPages - 1)));
  }

  function goNext() {
    goTo(currentIndex + 1);
  }

  function goPrevious() {
    goTo(currentIndex - 1);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        setCurrentIndex((index) => Math.min(index + 1, totalPages - 1));
      }

      if (event.key === "ArrowLeft") {
        setCurrentIndex((index) => Math.max(index - 1, FIRST_PAGE));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalPages]);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    setTouchStartX(event.changedTouches[0]?.clientX ?? null);
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX === null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? touchStartX;
    const delta = touchStartX - endX;

    if (Math.abs(delta) > 48) {
      if (delta > 0) {
        goNext();
      } else {
        goPrevious();
      }
    }

    setTouchStartX(null);
  }

  async function handleCta(
    event: MouseEvent<HTMLAnchorElement>,
    page: TutorialPageData
  ) {
    if (!page.final) {
      event.preventDefault();
      goNext();
      return;
    }

    event.preventDefault();

    if (installPrompt) {
      await installPrompt.prompt();
      setInstallPrompt(null);
      window.location.assign(page.href ?? "/apostas");
      return;
    }

    setShortcutDialogOpen(true);
  }

  return (
    <section
      aria-label="Livro tutorial Bet Barão"
      className="mx-auto w-full max-w-7xl px-4 pb-8"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-canary/30 bg-white/10 p-4 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black uppercase text-canary">Tutorial</p>
          <h1 className="text-2xl font-black text-white md:text-4xl">
            Aprenda a participar do Bet Barão
          </h1>
          <p className="mt-1 text-sm font-semibold text-white/75">{pageTitle}</p>
        </div>
        <TutorialProgress
          currentIndex={currentIndex}
          total={totalPages}
          onSelect={goTo}
        />
      </div>

      <div className="relative rounded-xl border border-canary/50 bg-field/85 p-3 shadow-panel md:p-5">
        <div className="pointer-events-none absolute inset-y-5 left-1/2 hidden w-px bg-canary/40 md:block" />

        <div className={nextSpreadPage ? "grid gap-4 md:grid-cols-2" : "grid gap-4"}>
          <TutorialPage
            key={currentPage.id}
            page={currentPage}
            pageNumber={currentIndex + 1}
            total={totalPages}
            priority={currentIndex <= 1}
            onCta={handleCta}
          />

          {nextSpreadPage ? (
            <div className="hidden md:block">
              <TutorialPage
                key={nextSpreadPage.id}
                page={nextSpreadPage}
                pageNumber={currentIndex + 2}
                total={totalPages}
                priority={currentIndex === 0}
                onCta={handleCta}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <TutorialNavigation
          currentIndex={currentIndex}
          total={totalPages}
          onPrevious={goPrevious}
          onNext={goNext}
        />
      </div>

      {isLastPage ? (
        <div
          id="atalho-site"
          className="mt-4 rounded-lg border border-canary/40 bg-white p-4 text-sm font-semibold text-coal shadow-panel"
        >
          <p className="font-black text-field">Dica da D. Rosa</p>
          <p className="mt-1">
            No último passo, salve o site nos favoritos ou na tela inicial do celular
            para voltar ao bolão com um toque.
          </p>
        </div>
      ) : null}

      {shortcutDialogOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcut-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 px-4 py-5 backdrop-blur-sm md:items-center"
        >
          <div className="w-full max-w-lg rounded-lg border border-canary bg-mist p-5 text-ink shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-rose">
                  Salvar atalho
                </p>
                <h2 id="shortcut-title" className="mt-1 text-2xl font-black">
                  Deixe o Bet Barão fácil de abrir
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShortcutDialogOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-canary bg-white text-xl font-black text-field"
                aria-label="Fechar instruções de atalho"
              >
                ×
              </button>
            </div>

            <div className="mt-4 grid gap-3 text-sm font-semibold text-coal/80">
              <p>
                Android Chrome: toque no menu de três pontos e escolha
                &quot;Adicionar à tela inicial&quot; ou &quot;Instalar app&quot;.
              </p>
              <p>
                iPhone Safari: toque no botão de compartilhar e depois em
                &quot;Adicionar à Tela de Início&quot;.
              </p>
              <p>
                Computador: use a estrela da barra de endereços para salvar nos
                favoritos.
              </p>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Link
                href="/apostas"
                className="inline-flex h-12 items-center justify-center rounded-md bg-field px-4 text-sm font-black text-white transition hover:bg-rose"
              >
                Entrar no Bolão agora
              </Link>
              <button
                type="button"
                onClick={() => setShortcutDialogOpen(false)}
                className="h-12 rounded-md border border-canary bg-white px-4 text-sm font-black text-field transition hover:bg-canary"
              >
                Ver instruções de novo
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
