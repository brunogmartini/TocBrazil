import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/toc")({
  head: () => ({
    meta: [
      { title: "Entenda o TOC — TOC Brazil" },
      { name: "description", content: "Conteúdo educativo sobre Transtorno Obsessivo-Compulsivo na TOC Brazil." },
      { property: "og:title", content: "Entenda o TOC — TOC Brazil" },
      { property: "og:description", content: "Conteúdo educativo sobre Transtorno Obsessivo-Compulsivo na TOC Brazil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/entenda-o-toc" });
  },
});
