import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/para-psiquiatras")({
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
