import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhooks/hotmart")({
  server: {
    handlers: {
      POST: async () =>
        new Response("Fluxo comercial desativado", {
          status: 410,
          headers: { "content-type": "text/plain; charset=utf-8" },
        }),
      GET: async () =>
        new Response("Fluxo comercial desativado", {
          status: 410,
          headers: { "content-type": "text/plain; charset=utf-8" },
        }),
    },
  },
});
