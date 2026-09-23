import { Link } from "@tanstack/react-router";

export function MobileCta() {
  return (
    <div className="fixed inset-x-0 bottom-10 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-xl lg:hidden">
      <Link to="/profissionais" className="btn-base btn-primary w-full" data-mobile-cta>
        Ver psicólogos disponíveis
      </Link>
    </div>
  );
}
