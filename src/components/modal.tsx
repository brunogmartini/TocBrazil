import { useEffect, type ReactNode } from "react";

export function Modal({
  aberto,
  titulo,
  onFechar,
  children,
  largura = "max-w-2xl",
}: {
  aberto: boolean;
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
  largura?: string;
}) {
  useEffect(() => {
    if (!aberto) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", tecla);
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = anterior;
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className={`card-soft max-h-[92vh] w-full overflow-y-auto rounded-b-none p-6 sm:rounded-b-[var(--radius-2xl)] sm:p-8 ${largura}`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl">{titulo}</h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onFechar}
            className="btn-base btn-ghost px-3 py-1.5 text-sm"
          >
            ✕
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
