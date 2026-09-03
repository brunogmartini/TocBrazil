import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/psicologos/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/profissionais/$slug", params: { slug: params.slug } });
  },
});
