import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { confirmAttendance } from "@/lib/attendance.functions";
import { attendanceLabels, confirmationAvailable } from "@/lib/attendance";
import { dataHoraBR } from "@/lib/video-sala";

export function AttendanceConfirmation({ id, inicio, status, attendanceStatus, patientConfirmedAt, professionalConfirmedAt, side, onUpdated }: {
  id: string; inicio: string; status: string; attendanceStatus: string; patientConfirmedAt: string | null; professionalConfirmedAt: string | null; side: "paciente" | "profissional"; onUpdated: () => Promise<void> | void;
}) {
  const confirm = useServerFn(confirmAttendance);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const confirmed = side === "paciente" ? patientConfirmedAt : professionalConfirmedAt;
  const available = confirmationAvailable(inicio, status, confirmed, now) && attendanceStatus === "agendada";
  return <div className="space-y-3 border-t border-border pt-4 text-sm">
    <p className="font-semibold">Presença: {attendanceLabels[attendanceStatus] ?? attendanceStatus}</p>
    <dl className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
      <div><dt>Confirmação do paciente</dt><dd>{patientConfirmedAt ? dataHoraBR(patientConfirmedAt) : "Não registrada"}</dd></div>
      <div><dt>Confirmação do psicólogo</dt><dd>{professionalConfirmedAt ? dataHoraBR(professionalConfirmedAt) : "Não registrada"}</dd></div>
    </dl>
    {attendanceStatus === "agendada" && <Button disabled={!available || busy} className="h-auto whitespace-normal" onClick={async () => {
      setBusy(true); setMessage(null);
      try { const result = await confirm({ data: { id, side } }); if (result.ok) { setMessage("Confirmação registrada."); await onUpdated(); } else setMessage(result.erro); }
      catch { setMessage("Não foi possível confirmar agora."); } finally { setBusy(false); }
    }}>{confirmed ? "Presença confirmada" : busy ? "Confirmando…" : side === "paciente" ? "Confirmar presença na consulta" : "Confirmar que a consulta ocorreu"}</Button>}
    {message && <p role="status">{message}</p>}
  </div>;
}