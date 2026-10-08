import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { legalDocumentReady, registrationConsentAllowed } from "./legal";

const slug = z.enum(["termos-de-uso", "termos-profissionais", "privacidade"]);
const docsSchema = z.array(z.object({ slug, version: z.string().min(1).max(40) })).min(1).max(3);
function requestEvidence() {
  const req = getRequest();
  // Only the platform-provided connecting address is trusted, not caller-supplied forwarding headers.
  const ip = req.headers.get("cf-connecting-ip");
  return { ip: ip && /^[a-fA-F0-9.:]+$/.test(ip) ? ip : null, agent: req.headers.get("user-agent")?.slice(0, 1000) ?? null };
}
async function digest(text: string) { return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)))).map(v => v.toString(16).padStart(2,"0")).join(""); }

export const activeLegalDocuments = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
  const client = createClient<Database>(process.env['SUPABASE_URL']!, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => { const headers = new Headers(init?.headers); if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization"); headers.set("apikey",key); return fetch(input,{...init,headers}); } } });
  const {data,error}=await client.from("legal_documents").select("id,slug,version,title,content_md,published_at,requires_reacceptance,change_summary").eq("is_active",true).lte("published_at",new Date().toISOString());
  if(error) throw new Error("Não foi possível carregar os documentos agora.");
  return data ?? [];
});

export const prepareSignupConsent = createServerFn({method:"POST"}).inputValidator((input:unknown)=>z.object({email:z.string().trim().email().max(255),area:z.enum(["paciente","profissional"]),terms:z.boolean(),sensitive:z.boolean(),documents:docsSchema}).parse(input)).handler(async({data})=>{
  if(!registrationConsentAllowed(data.terms,data.sensitive,data.area)) throw new Error("Marque os aceites obrigatórios.");
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data: documents,error}=await supabaseAdmin.from("legal_documents").select("slug,version,content_md").eq("is_active",true).lte("published_at",new Date().toISOString());
  if(error || !documents) throw new Error("Documentos indisponíveis.");
  const expected=documents.filter(d=>d.slug==="privacidade" || d.slug===(data.area==="paciente"?"termos-de-uso":"termos-profissionais"));
  if(expected.length!==2 || expected.some(d=>!legalDocumentReady(d.content_md)||!data.documents.some(v=>v.slug===d.slug&&v.version===d.version))) throw new Error("O texto legal ainda não está disponível ou mudou. Recarregue a página.");
  const evidence=requestEvidence(); const ipHash=await digest(evidence.ip??"local-preview");
  const {count,error:limitError}=await supabaseAdmin.from("legal_signup_receipts").select("token_hash",{count:"exact",head:true}).eq("ip_hash",ipHash).gte("created_at",new Date(Date.now()-15*60000).toISOString());
  if(limitError || (count??0)>=10) throw new Error("Aguarde alguns minutos antes de tentar novamente.");
  const token=crypto.randomUUID()+crypto.randomUUID();
  const {error:insertError}=await supabaseAdmin.from("legal_signup_receipts").insert({token_hash:await digest(token),email_hash:await digest(data.email.toLowerCase()),area:data.area,documents:data.documents,ip_hash:ipHash,ip_address:evidence.ip,user_agent:evidence.agent});
  if(insertError) throw new Error("Não foi possível registrar o aceite.");
  return {token};
});

export const legalUserState=createServerFn({method:"GET"}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 const {data:roles,error:rError}=await context.supabase.from("user_roles").select("role").eq("user_id",context.userId);
 if(rError) throw new Error("Não foi possível verificar sua área.");
 const area=roles?.some(r=>r.role==="admin")?"admin":roles?.some(r=>r.role==="profissional")?"profissional":"paciente";
 const {data:documents,error:dError}=await context.supabase.from("legal_documents").select("slug,version,title,content_md,published_at,requires_reacceptance,change_summary").eq("is_active",true).lte("published_at",new Date().toISOString());
 const {data:acceptances,error:aError}=await context.supabase.from("legal_acceptances").select("id,document_slug,document_version,kind,accepted_at,revoked_at").eq("user_id",context.userId).order("accepted_at",{ascending:false});
 const {data:closure,error:cError}=await context.supabase.from("legal_account_closures").select("requested_at").eq("user_id",context.userId).maybeSingle();
 if(dError||aError||cError) throw new Error("Não foi possível carregar seus aceites.");
 const applicable=(documents??[]).filter(d=>d.slug==="privacidade"||d.slug===(area==="profissional"?"termos-profissionais":"termos-de-uso"));
 const pending=area==="admin"?[]:applicable.filter(d=>legalDocumentReady(d.content_md)&&(!(acceptances??[]).some(a=>a.document_slug===d.slug&&a.kind==="terms")||(d.requires_reacceptance&&!(acceptances??[]).some(a=>a.document_slug===d.slug&&a.document_version===d.version&&a.kind==="terms"))));
 const privacy=applicable.find(d=>d.slug==="privacidade");
 const sensitiveNeeded=area==="paciente" && !(acceptances??[]).some(a=>a.kind==="sensitive_data_consent"&&!a.revoked_at&&(!privacy?.requires_reacceptance||a.document_version===privacy.version));
 return {area,documents:applicable,pending,acceptances:acceptances??[],closure:closure??null,sensitiveNeeded};
});

export const recordLegalConsent=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({documents:docsSchema,terms:z.literal(true),sensitive:z.boolean()}).parse(input)).handler(async({data,context})=>{
 const {data:roles,error}=await context.supabase.from("user_roles").select("role").eq("user_id",context.userId);
 if(error) throw new Error("Não foi possível verificar sua área.");
 if(roles?.some(r=>r.role==="paciente")&&!data.sensitive) throw new Error("Confirme o consentimento específico.");
 const {supabaseAdmin}=await import("@/integrations/supabase/client.server"); const evidence=requestEvidence();
 const {error:saveError}=await supabaseAdmin.rpc("legal_record_acceptances_for_user",{_user_id:context.userId,_documents:data.documents,_sensitive:data.sensitive,_ip:evidence.ip,_agent:evidence.agent??""});
 if(saveError) throw new Error("Não foi possível registrar o aceite; verifique se a versão mudou.");
 return {ok:true};
});
export const revokeLegalConsent=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({confirmed:z.literal(true)}).parse(input)).handler(async({context})=>{
 const {data:allowed,error}=await context.supabase.rpc("has_role",{_user_id:context.userId,_role:"paciente"});
 if(error||!allowed) throw new Error("Esta ação é exclusiva do paciente.");
 const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
 const {error:saveError}=await supabaseAdmin.rpc("legal_revoke_consent_for_user",{_user_id:context.userId});
 if(saveError) throw new Error("Não foi possível registrar a revogação."); return {ok:true};
});

export const submitPrivacyRequest=createServerFn({method:"POST"}).inputValidator((input:unknown)=>z.object({nome:z.string().trim().min(2).max(120),email:z.string().trim().email().max(255),tipo:z.enum(["acesso","correcao","exclusao","portabilidade","revogacao","outro"]),mensagem:z.string().trim().min(3).max(4000),website:z.string().max(200).default("")}).parse(input)).handler(async({data})=>{
 if(data.website) return {ok:true};
 const {supabaseAdmin}=await import("@/integrations/supabase/client.server"); const evidence=requestEvidence(); const ipHash=await digest(evidence.ip??"local-preview");
 const {count,error}=await supabaseAdmin.from("privacy_requests").select("id",{count:"exact",head:true}).eq("ip_hash",ipHash).gte("created_at",new Date(Date.now()-3600000).toISOString());
 if(error||(count??0)>=5) throw new Error("Muitos pedidos recentes. Aguarde para enviar novamente.");
 const {website:unused,...values}=data; void unused;
 const {error:saveError}=await supabaseAdmin.from("privacy_requests").insert({...values,ip_hash:ipHash});
 if(saveError) throw new Error("Não foi possível enviar seu pedido agora.");return {ok:true};
});
export const legalAdminData=createServerFn({method:"GET"}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 const {data:admin,error}=await context.supabase.rpc("has_role",{_user_id:context.userId,_role:"admin"}); if(error||!admin) throw new Error("Acesso restrito.");
 const {data:documents,error:dError}=await context.supabase.from("legal_documents").select("*").order("published_at",{ascending:false});
 const {data:requests,error:rError}=await context.supabase.from("privacy_requests").select("id,nome,email,tipo,mensagem,status,created_at,responded_at").order("created_at",{ascending:true}).limit(1000);
 if(dError||rError) throw new Error("Não foi possível carregar a gestão de privacidade."); return {documents:documents??[],requests:requests??[]};
});
export const publishLegalDocument=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({slug,version:z.string().trim().min(1).max(40),title:z.string().trim().min(3).max(200),content:z.string().min(30).max(200000),requires:z.boolean(),summary:z.string().max(4000)}).parse(input)).handler(async({data,context})=>{
 const {error}=await context.supabase.rpc("legal_publish_document",{_slug:data.slug,_version:data.version,_title:data.title,_content:data.content,_requires:data.requires,_summary:data.summary});
 if(error) throw new Error("Não foi possível publicar: confira texto, versão inédita e resumo das mudanças.");return {ok:true};
});
export const updatePrivacyRequest=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({id:z.string().uuid(),status:z.enum(["aberto","em_andamento","concluido"])}).parse(input)).handler(async({data,context})=>{
 const {data:admin,error}=await context.supabase.rpc("has_role",{_user_id:context.userId,_role:"admin"});if(error||!admin) throw new Error("Acesso restrito.");
 const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
 const {error:saveError}=await supabaseAdmin.from("privacy_requests").update({status:data.status,responded_at:data.status==="concluido"?new Date().toISOString():null}).eq("id",data.id);
 if(saveError) throw new Error("Não foi possível atualizar o pedido.");
 const {writeAuditEvent}=await import("@/lib/audit.server"); await writeAuditEvent({actorId:context.userId,actorRole:"admin",action:"privacy_request_status_updated",entity:"privacy_requests",entityId:data.id});return {ok:true};
});