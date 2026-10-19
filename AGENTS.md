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
- Keep uploaded legal documents as versioned source text and render the current official documents integrally as Markdown; legal pages must never summarize or rewrite them.
- Treat `professionals.valor_centavos` as the exact public price freely set by the professional; derive `valor_liquido_centavos` as that price minus the fixed platform fee, because the fee is the professional's obligation and never increases the patient's price.
- Keep contract PDFs byte-identical and private; accept with the user's session only after the latest immutable approval, enforced by RLS and trigger; require receiving and availability before publication.
- Keep credentialing files private and issue 60-second signed URLs only after an MFA-authenticated admin action; why: each access must be authorized and auditable.
- Keep clinical-content legacy tables and fields locked and deprecated, never use them in application code; why: consultations occur outside the platform.
- Write required security events to immutable `audit_log` with metadata keys only, never values containing messages or health information; why: preserve accountability without creating sensitive replicas.
- Keep Asaas fail-closed and server-only; its admin lab is sandbox-only and detached from real users/appointments; why: prevent real test charges.
- Use two Asaas card pre-authorizations for booking outcomes and limit bookable slots to the provider's three-day authorization window; why: partial capture is not relied upon.
- Keep explicit deny policies on server-only tables; why: access stays fail-closed.
- Keep managed auth emails and signup resend support; why: confirmation is recoverable.
- Resolve existing account areas from the authenticated user's own RLS-scoped role row before provisioning a missing role server-side; why: login must not race bearer propagation.
- Send the fixed-recipient management email only after the first successful professional profile creation, using the profile ID for idempotency; why: edits must not generate duplicate signup alerts.
- Treat manager-requested professional removal as decredentialing rather than a physical delete, and exclude removed profiles from current dashboard profile counts; why: appointments, contracts, payment records, and audit history must survive without inflating current totals.
- Store professional PF/PJ identity on the existing professional record with validated CPF and conditional CNPJ; why: independent psychologists can register without weakening manual review or publication gates.
- Store professional administrative phone numbers in an owner/admin-only contact table, not the public-readable professional record; why: RLS exposes the entire eligible professional row.
- Evaluate public professional eligibility through a narrow security-definer helper for private receiving and schedule tables; why: public listing must not grant financial-table access or block owner registration.
- Validate and audit manager-entered professional data on the server and return edited profiles to pending review; why: assistance must not bypass credentialing or publication gates.
- Admin profile photos are uploaded through an authenticated server function with role and actual-image validation, stored privately, and reset to pending review; why: delegated uploads must not widen Storage permissions or bypass publication gates.

- Keep appointment meeting URLs behind owner-scoped database RPCs and exclude URL columns from authenticated general SELECT grants; why: patient access must obey the payment and time window even through direct database calls.
- Keep dual attendance confirmations and administrative adjudication in attendance_status, independent of appointment financial status and settlement; why: presence decisions must not capture, refund or distribute payments in this phase.
- Keep legal document versions immutable and record consent through authenticated server evidence or one-use signup receipts; why: browser checkboxes alone cannot establish versioned consent.
- Keep legal withdrawal separate from data deletion and enforce reacceptance in database booking guards; why: history and legally retained evidence must remain available during closure review.
- Share signup document selection between the form and receipt validator, independently of post-approval contract gates; why: account creation must not require or record acceptance of an unavailable credentialing document.
- Select only official applicable documents in the account consent panel and allow professional privacy acceptance while public professional terms are pending; why: pending text must not disable account completion or become accepted evidence.
