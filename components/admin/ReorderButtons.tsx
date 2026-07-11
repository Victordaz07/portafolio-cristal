export default function ReorderButtons({
  onUp,
  onDown,
  disableUp,
  disableDown,
}: {
  onUp: () => void;
  onDown: () => void;
  disableUp: boolean;
  disableDown: boolean;
}) {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onUp}
        disabled={disableUp}
        aria-label="Mover arriba"
        className="text-ink/60 hover:text-coral disabled:opacity-30"
      >
        ▲
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={disableDown}
        aria-label="Mover abajo"
        className="text-ink/60 hover:text-coral disabled:opacity-30"
      >
        ▼
      </button>
    </div>
  );
}
