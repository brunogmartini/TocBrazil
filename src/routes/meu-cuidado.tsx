import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/meu-cuidado")({
  head: () => ({
    meta: [
      { title: "Redirecionamento para painel — TOC Brazil" },
      { name: "description", content: "Esta página direciona pessoas cadastradas para o painel correto da TOC Brazil." },
      { property: "og:title", content: "Redirecionamento para painel — TOC Brazil" },
      { property: "og:description", content: "Esta página direciona pessoas cadastradas para o painel correto da TOC Brazil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/painel", replace: true });
  },
});
