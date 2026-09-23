import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { institucional } from "@/config/institucional";

const avisoSchema = z.object({
  email: z.string().trim().email().max(255),
  consentimento: z.literal(true),
});

export const solicitarAvisoDisponibilidade = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => avisoSchema.parse(data))
  .handler(async ({ data }) => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return { ok: false as const, erro: "Não foi possível registrar seu e-mail agora." };
    const cliente = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });
    const { error } = await cliente.from("avisos_disponibilidade").upsert(
      {
        email: data.email.toLowerCase(),
        consentimento_em: new Date().toISOString(),
        politica_versao: institucional.politicaPrivacidadeVersao,
      },
      { onConflict: "email", ignoreDuplicates: true },
    );
    if (error) return { ok: false as const, erro: "Não foi possível registrar seu e-mail agora." };
    return { ok: true as const };
  });