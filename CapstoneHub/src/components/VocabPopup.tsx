import { useEffect } from "react";
import { X } from "lucide-react";
import { VOCAB_TERMS } from "@/lib/vocab";
import { cn } from "@/lib/utils";

interface VocabPopupProps {
  termId: string | null;
  onClose: () => void;
}

export function VocabPopup({ termId, onClose }: VocabPopupProps) {
  const term = termId
    ? VOCAB_TERMS.find((t) => t.id === termId) ?? null
    : null;

  useEffect(() => {
    if (!termId) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [termId, onClose]);

  if (!termId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vocab-popup-term"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-xl border border-border bg-card shadow-xl",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h3 id="vocab-popup-term" className="font-mono text-lg font-semibold text-foreground">
              {term?.term ?? termId}
            </h3>
            {term?.aliases?.length ? (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {term.aliases.join(", ")}
              </p>
            ) : null}
            {term?.category ? (
              <p className="mt-1 text-xs text-primary">{term.category}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {term?.definition ?? "Definition not found."}
          </p>
        </div>
      </div>
    </div>
  );
}
