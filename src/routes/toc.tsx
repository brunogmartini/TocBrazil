import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/toc")({
  beforeLoad: () => {
    throw redirect({ to: "/entenda-o-toc" });
  },
});
