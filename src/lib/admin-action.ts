type Result = { ok: true } | { ok: false; erro: string };

export async function executarAcaoAdmin(
  acao: () => Promise<Result>,
  sucesso: string,
): Promise<{ ok: boolean; mensagem: string }> {
  try {
    const resultado = await acao();
    return { ok: resultado.ok, mensagem: resultado.ok ? sucesso : resultado.erro };
  } catch {
    return { ok: false, mensagem: "Não foi possível concluir a ação. Verifique sua sessão e tente novamente." };
  }
}