import { imageSize } from "image-size";

export const LIMITE_FOTO_BYTES = 5 * 1024 * 1024;

export function exigirAdminFoto(isAdmin: boolean | null) {
  if (isAdmin !== true) throw new Error("Somente a gestão pode adicionar fotos de outros profissionais.");
}

export function validarFotoAdmin(bytes: Uint8Array, mime: string) {
  if (!bytes.length || bytes.length > LIMITE_FOTO_BYTES) throw new Error("A foto deve ter no máximo 5 MB.");
  const tipos: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  const extensao = tipos[mime];
  if (!extensao) throw new Error("Envie uma imagem JPG, PNG ou WebP.");
  let dimensoes;
  try { dimensoes = imageSize(bytes); } catch { throw new Error("Imagem inválida."); }
  if (dimensoes.type !== extensao) throw new Error("O formato da imagem não corresponde ao arquivo enviado.");
  if (dimensoes.width < 600 || dimensoes.height < 600 || dimensoes.width !== dimensoes.height) {
    throw new Error("A foto precisa ser quadrada e ter pelo menos 600 × 600 pixels.");
  }
  return extensao;
}