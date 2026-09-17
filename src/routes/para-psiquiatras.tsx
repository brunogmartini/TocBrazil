import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/para-psiquiatras")({
  head: () => ({
    meta: [
      { title: "Página indisponível — TOC Brazil" },
      { name: "description", content: "A TOC Brazil conecta pacientes apenas a psicólogos cadastrados na plataforma." },
      { property: "og:title", content: "Página indisponível — TOC Brazil" },
      { property: "og:description", content: "A TOC Brazil conecta pacientes apenas a psicólogos cadastrados na plataforma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  server: {
    handlers: {
      GET: async ({ request }) => {
        const destino = new URL("/para-psicologos", request.url);
        return Response.redirect(destino.toString(), 301);
      },
    },
  },
  beforeLoad: () => {
    throw redirect({ to: "/para-psicologos", replace: true });
  },
});
