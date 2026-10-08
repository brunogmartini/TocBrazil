import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { attendanceReviews, decideAttendance } from "@/lib/attendance.functions";
import { attendanceLabels } from "@/lib/attendance";
import { dataHoraBR } from "@/lib/video-sala";
import { Button } from "@/components/ui/button";

export function AttendanceAdmin() {
  const load = useServerFn(attendanceReviews);
  const decide = useServerFn(decideAttendance);
  const reviews = useQuery({ queryKey: ["attendance-reviews"], queryFn: () => load(), refetchInterval: 15_000 });
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  return <section className="mt-6 space-y-4">
    <h2 className="text-xl">Análise de presença</h2>
    {reviews.isError && <p className="text-destructive" role="alert">Não foi possível carregar as consultas em análise.</p>}
    {reviews.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
    {reviews.isSuccess && !reviews.data.length && <p className="text-sm text-muted-foreground">Nenhuma consulta em análise.</p>}
    {message && <p role="status" className="text-sm">{message}</p>}
    {(reviews.data ?? []).map((c) => <article key={c.id} className="card-soft space-y-4 p-5">
      <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{c.professional_name}</h3><span className="pill">{attendanceLabels[c.attendance_status]}</span></div>
      <p className="break-words text-xs text-muted-foreground">Consulta {c.id} · Paciente {c.patient_id}</p>
      <p className="text-sm">{dataHoraBR(c.inicio)} — {dataHoraBR(c.fim)}</p>
      <dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Paciente confirmou</dt><dd>{c.patient_confirmed_at ? dataHoraBR(c.patient_confirmed_at) : "Não"}</dd></div><div><dt className="text-muted-foreground">Psicólogo confirmou</dt><dd>{c.professional_confirmed_at ? dataHoraBR(c.professional_confirmed_at) : "Não"}</dd></div></dl>
      {c.attendance_decided_at ? <div className="space-y-2 text-sm"><p className="break-words">Justificativa: {c.attendance_justification}</p>{c.attendance_observation && <p className="break-words">Observação: {c.attendance_observation}</p>}<p className="break-words text-xs text-muted-foreground">Decisão em {dataHoraBR(c.attendance_decided_at)} · Responsável: {c.attendance_decided_by}</p></div> : <form className="space-y-3" onSubmit={async (event) => {
        event.preventDefault(); const form = new FormData(event.currentTarget); const status = form.get("status");
        if (status !== "realizada" && status !== "falta_paciente" && status !== "falta_profissional") return;
        setBusy(c.id); setMessage(null);
        try { const result = await decide({ data: { id: c.id, status, justification: String(form.get("justification") ?? ""), observation: String(form.get("observation") ?? "") } }); if (result.ok) { setMessage("Decisão de presença registrada."); await reviews.refetch(); } else setMessage(result.erro); }
        catch { setMessage("Não foi possível registrar a decisão. Preencha a justificativa."); } finally { setBusy(null); }
      }}>
        <label className="block text-sm">Resultado<select name="status" className="field-base mt-1 w-full"><option value="realizada">Realizada</option><option value="falta_paciente">Falta do paciente — atraso ou ausência superior a 15 minutos</option><option value="falta_profissional">Falta do psicólogo — atraso ou ausência superior a 15 minutos</option></select></label>
        <label className="block text-sm">Justificativa obrigatória<textarea name="justification" className="field-base mt-1 w-full" rows={3} required minLength={3} maxLength={2000} /></label>
        <label className="block text-sm">Observação administrativa (opcional)<textarea name="observation" className="field-base mt-1 w-full" rows={2} maxLength={2000} /></label>
        <Button disabled={busy === c.id} className="h-auto whitespace-normal">{busy === c.id ? "Registrando…" : "Registrar decisão"}</Button>
      </form>}
    </article>)}
  </section>;
}