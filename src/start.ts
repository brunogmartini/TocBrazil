import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next, request }) => {
  // Rotas internas de e-mail/webhook se autenticam sozinhas.
  if (new URL(request.url).pathname.startsWith("/lovable/")) {
    return next();
  }
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});


// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  for (const entry of cookieHeader.split(";")) {
    const separator = entry.indexOf("=");
    if (separator < 0 || entry.slice(0, separator).trim() !== name) continue;
    return entry.slice(separator + 1).trim();
  }
  return null;
}

function secureSessionCookie(value: string) {
  const parts = value.split(";").map((part) => part.trim()).filter(Boolean);
  const [pair, ...attributes] = parts;
  if (!pair || !pair.toLowerCase().startsWith("session-id=")) return value;
  const retained = attributes.filter((attribute) => {
    const name = attribute.split("=", 1)[0]?.toLowerCase();
    return name !== "httponly" && name !== "secure" && name !== "samesite";
  });
  return [pair, ...retained, "HttpOnly", "Secure", "SameSite=Lax"].join("; ");
}

const secureSessionCookieMiddleware = createMiddleware({ type: "request" }).server(async ({ next, request }) => {
  const result = await next();
  const response = result.response;
  const sessionId = readCookie(request.headers.get("cookie"), "session-id");
  const headers = new Headers(response.headers);
  const setCookies = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];
  if (setCookies.length > 0) {
    headers.delete("set-cookie");
    for (const cookie of setCookies) headers.append("set-cookie", secureSessionCookie(cookie));
  } else if (sessionId) {
    headers.append("set-cookie", `session-id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax`);
  } else {
    return result;
  }
  return { ...result, response: new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    }) };
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, secureSessionCookieMiddleware, csrfMiddleware],
}));
