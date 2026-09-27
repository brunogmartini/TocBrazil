import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const storageKey = "tocbrazil:aviso-cookies-essenciais:v1";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(storageKey) !== "ok");
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <aside aria-label="Aviso de cookies" className="fixed inset-x-0 bottom-32 z-[60] border-t border-border bg-background px-4 py-4 shadow-soft lg:bottom-9">
      <div className="container-page flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-4xl text-sm leading-relaxed text-foreground">
          Usamos apenas cookies necessários para manter sua sessão ativa e o site funcionando. Não usamos cookies de publicidade nem de rastreamento de terceiros. Saiba mais na{" "}
          <Link to="/cookies" className="font-semibold text-primary underline underline-offset-4">Política de Cookies</Link>.
        </p>
        <Button type="button" className="shrink-0" onClick={() => {
          try { localStorage.setItem(storageKey, "ok"); } catch { /* armazenamento indisponível */ }
          setVisible(false);
        }}>Entendi</Button>
      </div>
    </aside>
  );
}