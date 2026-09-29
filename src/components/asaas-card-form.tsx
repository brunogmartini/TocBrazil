export function AsaasCardForm({ consultaId, onSuccess }: { consultaId: string; onSuccess: () => void | Promise<void> }) {
  void consultaId;
  void onSuccess;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Você informa o cartão agora. O valor é reservado 36 horas antes da consulta e cobrado somente depois dela.</p>
      <p className="text-sm text-muted-foreground" role="status">O pagamento está temporariamente indisponível enquanto migramos para a página segura do Asaas.</p>
      <button className="btn-base btn-primary w-full" type="button" disabled>Pagamento temporariamente indisponível</button>
    </div>
  );
}