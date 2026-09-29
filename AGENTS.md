<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Apply frame protection at the server response boundary and keep the broader CSP in report-only until inline hydration scripts can be nonce-protected; enforcing an untested script restriction would break the app.
- Keep the essential-cookie notice as an acknowledgement in browser storage, not consent; necessary cookies do not require opt-in.
- Keep uploaded legal documents as versioned source text and render the official v1.3 documents integrally as Markdown; legal pages must never summarize or rewrite them.
- Treat `professionals.valor_liquido_centavos` as the professional's desired net amount and `professionals.valor_centavos` as the public patient price (net + fixed platform fee), so listings and bookings share one price source.
- Keep professional contract PDFs versioned in private storage and acceptance records immutable; profile publication requires acceptance of the active PDF version so legal evidence cannot be changed retroactively.
- Keep credentialing files private and issue 60-second signed URLs only after an MFA-authenticated admin action; why: each access must be authorized and auditable.
- Keep clinical-content legacy tables and fields locked and deprecated, never use them in application code; why: consultations occur outside the platform.
- Write required security events to immutable `audit_log` with metadata keys only, never values containing messages or health information; why: preserve accountability without creating sensitive replicas.
- Keep Asaas fail-closed and server-only; its admin lab is sandbox-only and detached from real users/appointments; why: prevent real test charges.
- Use two Asaas card pre-authorizations for booking outcomes and limit bookable slots to the provider's three-day authorization window; why: partial capture is not relied upon.
- Keep explicit restrictive deny policies on server-only tables even when client grants are revoked; why: access must remain fail-closed if privileges change later.
