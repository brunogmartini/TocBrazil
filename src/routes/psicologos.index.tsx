import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/psicologos/")({
  beforeLoad: () => {
    throw redirect({ to: "/profissionais" });
  },
});
