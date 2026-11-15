import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { attendanceDetails, reportAttendance, confirmAttendance } from "@/lib/attendance.functions";
import { attendanceLabels, confirmationAvailable } from "@/lib/attendance";
import { dataHoraBR } from "@/lib/video-sala";

export function AttendanceConfirmation({ id, inicio, status, attendanceStatus, patientConfirmedAt, professionalConfirmedAt, side, onUpdated }: {
  id: string; inicio: string; status: string; attendanceStatus: string; patientConfirmedAt: string | null; professionalConfirmedAt: string | null; side: "paciente" | "profissional"; onUpdated: () => Promise<void> | void;
}) {
  const confirm = useServerFn(confirmAttendance);
  const load = useServerFn(attendanceDetails);
  const report = useServerFn(reportAttendance);
  const details = useQuery({ queryKey: ["attendance-details", id], queryFn: () => load({ data: { id } }), refetchInterval: 15_000 });
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const confirmed = side === "paciente" ? patientConfirmedAt : professionalConfirmedAt;
  const d = details.data;
  const windowOpen = Boolean(d && d.payment_status === "aprovado" && !d.decided_at && !d.automatic_at && confirmationAvailable(d.fim, status, null, now));
  const available = windowOpen && !confirmed && attendanceStatus !== "realizada";
  return <div className="space-y-3 border-t border-border pt-4 text-sm">
    <p className="font-semibold">Presença: {attendanceLabels[attendanceStatus] ?? attendanceStatus}</p>
    <dl className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
      <div><dt>Confirmação do paciente</dt><dd>{patientConfirmedAt ? dataHoraBR(patientConfirmedAt) : "Não registrada"}</dd></div>
      <div><dt>Confirmação do psicólogo</dt><dd>{professionalConfirmedAt ? dataHoraBR(professionalConfirmedAt) : "Não registrada"}</dd></div>
    </dl>
    {details.isError && <p role="alert" className="text-destructive">Não foi possível consultar as confirmações.</p>}
    {d?.automatic_at && <p>Realização reconhecida automaticamente em {dataHoraBR(d.automatic_at)}, após confirmação do psicólogo e 48 horas sem manifestação do paciente.</p>}
    <p className="text-xs text-muted-foreground">Após o término, há 48 horas para confirmar ou informar um problema. Sem resposta do paciente e sem problemas relatados, a confirmação do psicólogo permite reconhecer a realização automaticamente.</p>
    {(attendanceStatus === "agendada" || attendanceStatus === "em_analise") && <Button disabled={!available || busy} className="h-auto whitespace-normal" onClick={async () => {
      setBusy(true); setMessage(null);
      try { const result = await confirm({ data: { id, side } }); if (result.ok) { setMessage("Confirmação registrada."); await details.refetch(); await onUpdated(); } else setMessage(result.erro); }
      catch { setMessage("Não foi possível confirmar agora."); } finally { setBusy(false); }
    }}>{confirmed ? "Presença confirmada" : busy ? "Confirmando…" : side === "paciente" ? "Confirmar presença na consulta" : "Confirmar que a consulta ocorreu"}</Button>}
    {(d?.reports ?? []).map(r => <div key={r.side} className="border-l-2 border-border pl-3"><p className="font-semibold">Motivo informado pelo {r.side === "paciente" ? "paciente" : "psicólogo"}</p><p className="whitespace-pre-wrap break-words">{r.reason}</p></div>)}
    {windowOpen && !d?.reports.some(r => r.side === side) && <Button variant="outline" disabled={busy} onClick={() => setReportOpen(v => !v)}>A consulta não ocorreu</Button>}
    {reportOpen && <form className="space-y-3" onSubmit={async e => {
      e.preventDefault(); setBusy(true); setMessage(null);
      try { const result = await report({ data: { id, side, reason } }); if (result.ok) { setMessage("Motivo registrado. A consulta será analisada pela gestão."); setReportOpen(false); await details.refetch(); await onUpdated(); } else setMessage(result.erro); }
      catch { setMessage("Não foi possível registrar o motivo."); } finally { setBusy(false); }
    }}><label className="block">Motivo administrativo<textarea required minLength={3} maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} className="field-base mt-2 w-full" rows={3} /></label><p className="text-xs text-muted-foreground">Não inclua informações clínicas ou de saúde. O motivo fica disponível aos envolvidos e à gestão.</p><Button disabled={busy || !windowOpen}>Enviar motivo</Button></form>}
    {message && <p role="status">{message}</p>}
  </div>;
}