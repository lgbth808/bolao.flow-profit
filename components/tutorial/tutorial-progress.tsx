type TutorialProgressProps = {
  currentIndex: number;
  total: number;
  onSelect: (index: number) => void;
};

export function TutorialProgress({
  currentIndex,
  total,
  onSelect
}: TutorialProgressProps) {
  return (
    <div aria-label="Progresso do tutorial" className="flex items-center gap-2">
      {Array.from({ length: total }, (_, index) => {
        const active = index === currentIndex;

        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            className={
              active
                ? "h-2.5 w-8 rounded-full bg-canary transition"
                : "h-2.5 w-2.5 rounded-full bg-white/35 transition hover:bg-white/70"
            }
            aria-label={`Ir para etapa ${index + 1}`}
            aria-current={active ? "step" : undefined}
          />
        );
      })}
    </div>
  );
}
