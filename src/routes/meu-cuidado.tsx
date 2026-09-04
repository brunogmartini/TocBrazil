import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/meu-cuidado")({
  beforeLoad: () => {
    throw redirect({ to: "/painel", replace: true });
  },
});
