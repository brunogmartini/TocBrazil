import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { appointmentRoom, saveAppointmentRoom } from "@/lib/attendance.functions";
import { LINK_RELEASE_MINUTES, validMeetingUrl } from "@/lib/attendance";

export function AppointmentRoom({ id, professional = false, inicio, fim, paymentStatus, releaseMinutes = LINK_RELEASE_MINUTES, onSaved }: {
  id: string; professional?: boolean; inicio: string; fim: string; paymentStatus: string; releaseMinutes?: number; onSaved?: () => Promise<void> | void;
}) {
  const load = useServerFn(appointmentRoom);
  const save = useServerFn(saveAppointmentRoom);
  const queryClient = useQueryClient();
  const room = useQuery({ queryKey: ["appointment-room", id], queryFn: () => load({ data: { id } }), refetchInterval: 15_000, staleTime: 0 });
  const [url, setUrl] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (!dirty && room.isSuccess) setUrl(room.data?.meeting_url ?? room.data?.suggestion_url ?? ""); }, [room.data, room.isSuccess, dirty]);
  const future = now < Date.parse(inicio);
  const available = paymentStatus === "aprovado" && now >= Date.parse(inicio) - releaseMinutes * 60000 && now <= Date.parse(fim) + 2 * 3600_000;
  if (!professional) {
    if (available && room.data?.meeting_url) return <Button asChild className="h-auto whitespace-normal"><a href={room.data.meeting_url} target="_blank" rel="noopener noreferrer">Entrar na sala do profissional</a></Button>;
    return <p className="text-xs text-muted-foreground" role="status">{room.isError ? "Não foi possível consultar o link da sala agora." : now > Date.parse(fim) + 2 * 3600_000 ? "O acesso ao link desta consulta terminou." : paymentStatus !== "aprovado" ? "O link será liberado após a confirmação do pagamento e dentro do horário de acesso." : available ? "O profissional ainda não informou o link desta consulta." : `O link será liberado ${releaseMinutes} minutos antes da consulta`}</p>;
  }
  return <div className="space-y-3 border-t border-border pt-4">
    <h3 className="text-sm font-semibold">Sala desta consulta</h3>
    {room.isError && <p className="text-sm text-destructive" role="alert">Não foi possível consultar a sala agora.</p>}
    {future && <form className="space-y-3" onSubmit={async (event) => {
      event.preventDefault(); setMessage(null);
      if (!validMeetingUrl(url)) { setMessage("Informe uma URL HTTPS válida."); return; }
      setBusy(true);
      try {
        const result = await save({ data: { id, url } });
        if (!result.ok) setMessage(result.erro);
        else { setDirty(false); setMessage("Link desta consulta salvo."); await queryClient.invalidateQueries({ queryKey: ["appointment-room", id] }); await onSaved?.(); }
      } catch { setMessage("Não foi possível salvar o link agora."); } finally { setBusy(false); }
    }}>
      <label className="block text-sm">Link da sala virtual<input type="url" aria-label="Link da sala virtual" value={url} onChange={(e) => { setUrl(e.target.value); setDirty(true); }} className="field-base mt-1 w-full" placeholder="https://" required maxLength={2048} disabled={room.isLoading || busy} /></label>
      <p className="text-xs text-muted-foreground">Use um link exclusivo para esta consulta e ative a sala de espera da sua ferramenta. A segurança e o sigilo da sala são de sua responsabilidade.</p>
      <Button type="submit" disabled={busy || room.isLoading} className="h-auto whitespace-normal">{busy ? "Salvando…" : "Salvar link desta consulta"}</Button>
    </form>}
    {room.data?.meeting_url && <Button asChild variant="outline" className="h-auto whitespace-normal"><a href={room.data.meeting_url} target="_blank" rel="noopener noreferrer">Abrir sua sala de atendimento</a></Button>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </div>;
}