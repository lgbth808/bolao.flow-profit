type TutorialNavigationProps = {
  currentIndex: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
};

export function TutorialNavigation({
  currentIndex,
  total,
  onPrevious,
  onNext
}: TutorialNavigationProps) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirst}
        className="h-11 rounded-full border border-canary/60 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="Voltar página do tutorial"
      >
        Anterior
      </button>
      <span className="rounded-full border border-canary/40 bg-black/20 px-4 py-2 text-xs font-black text-canary">
        {currentIndex + 1}/{total}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={isLast}
        className="h-11 rounded-full border border-canary/60 bg-canary px-5 text-sm font-black text-field transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="Avançar página do tutorial"
      >
        Próxima
      </button>
    </div>
  );
}
