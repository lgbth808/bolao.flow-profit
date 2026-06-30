"use client";

import { TouchEvent, useEffect, useState } from "react";
import { TutorialNavigation } from "./tutorial-navigation";
import { TutorialPage } from "./tutorial-page";
import { tutorialPages } from "./tutorial-data";

const FIRST_PAGE = 0;

export function TutorialBook() {
  const [currentIndex, setCurrentIndex] = useState(FIRST_PAGE);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const totalPages = tutorialPages.length;
  const currentPage = tutorialPages[currentIndex];

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

  return (
    <section
      aria-label="Livro tutorial Bet Barão"
      className="mx-auto w-full max-w-4xl px-4 pb-5"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="rounded-xl border border-canary/50 bg-field/88 p-3 shadow-panel md:p-4">
        <TutorialPage
          key={currentPage.id}
          page={currentPage}
          pageNumber={currentIndex + 1}
          total={totalPages}
          priority={currentIndex <= 1}
        />
      </div>

      <div className="mt-3">
        <TutorialNavigation
          currentIndex={currentIndex}
          total={totalPages}
          onPrevious={goPrevious}
          onNext={goNext}
        />
      </div>
    </section>
  );
}
