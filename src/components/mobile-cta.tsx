import { Link } from "@tanstack/react-router";
import { useState } from "react";

export function MobileCta() {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="fixed inset-x-0 bottom-8 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-xl lg:hidden">
      {aberto && (
        <div className="mb-3 flex flex-col rounded-2xl bg-muted p-2">
          <Link
            to="/auth"
            search={{ modo: "cadastro" as const, redirect: undefined }}
            onClick={() => setAberto(false)}
            className="rounded-xl px-3 py-3 text-sm font-medium text-foreground"
          >
            Sou paciente
          </Link>
          <Link
            to="/cadastro-profissional"
            onClick={() => setAberto(false)}
            className="rounded-xl px-3 py-3 text-sm font-medium text-foreground"
          >
            Sou profissional
          </Link>
        </div>
      )}
      <button
        type="button"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className="btn-base btn-primary w-full"
        data-mobile-cta
      >
        Quero fazer parte
      </button>
    </div>
  );
}
