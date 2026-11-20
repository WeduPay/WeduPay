# WeduPay payment platform: repository audit and implementation plan

## Repository audit

### Existing application

- The customer-facing site is static HTML, CSS, and browser JavaScript served from Vercel.
- `index.html`, `sign-in.html`, and `dashboard.html` are linked as the landing page, phone-number demo route, and public customer dashboard preview.
- The sign-in page accepts only a fictional demo number to navigate to the preview. It does not authenticate a customer or verify a phone number.
- `dashboard.js` renders the overview, merchant categories, empty account states, and a tuition demo flow. When configured, that flow posts only the selected merchant, country, provider, amount, and currency to a sandbox endpoint; it never sends the student reference or phone number.
- `merchant-registry.js` is frontend planning data. Merchant/provider names do not indicate availability, agreements, or integrations.
- The only API function is `api/waitlist.js`. It is configuration-gated, handles waitlist collection only, and writes to the waitlist table through Supabase REST.
- `supabase/waitlist.sql` defines only the waitlist table. It has no customer, payment, transaction, ledger, webhook, or settlement schema.
- `vercel.json` configures security headers and a restrictive Content Security Policy. It does not configure a payment backend.
- There is no package manifest or existing test runner in the repository. The current worktree has no configured Node/npm/npx executable.

### Reusable assets and gaps

Reusable assets are the WeduPay landing/dashboard styling, merchant planning registry, Vercel serverless deployment, Supabase PostgreSQL database option, and existing server-side environment-variable pattern.

The production payment platform does not yet exist. The sandbox preview slice is not a production payment service. In particular, there are no customer accounts or roles, authenticated APIs, production payment routes, provider or merchant adapters, real transaction state machine, financial ledger, fee rules, verified webhooks, reconciliation inputs, settlement data, or role-protected operational/admin interface. The waitlist database and service credentials must not be repurposed as a customer or production payment system.

## Recommended implementation approach

Keep the current website as the customer interface and add a versioned server-side API and a separate payment-platform schema. Based on the existing deployment, Vercel Node serverless functions and Supabase PostgreSQL are the least-disruptive starting point. Use PostgreSQL transactions and fixed-precision numeric columns for money; do not use browser state or an in-memory serverless store as transaction records.

Start with a development-only/sandbox mode, disabled by default. Keep simulated events, reports, and metrics unmistakably labeled as demonstrations. Do not expose production payment initiation until there is an approved provider/merchant arrangement, a verified provider API, authentication and authorization, and legal/compliance review. No credentials or external partner access are present in this repository.

## Phased plan

### Phase 1 — Repository audit (complete)

Inventory the existing frontend, Vercel function, database schema, deployment configuration, and trust boundaries. Findings are recorded above. The existing public dashboard remains a non-authenticated preview.

### Phase 2 — Backend foundation (sandbox preview slice started)

1. Define the sandbox-versus-production configuration and fail-closed behavior.
2. Add a separate, versioned payment schema, initially for merchants, providers, routes, payment intents, transaction events, and audit records.
3. Implement a strict transaction state machine with append-only events and idempotency constraints.
4. Add server-side validation and APIs for merchant/provider discovery, sandbox payment-intent creation, state/event retrieval, and cancellation where permitted.
5. Add authentication and role checks before any customer-specific or administrative API is exposed.
6. Add automated tests for state transitions, duplicate requests, invalid amounts/currency, and unauthorized access.

The first website-connected slice is implemented: a disabled-by-default Vercel sandbox endpoint creates and retrieves an expiring demonstration-only preview record. Its database schema uses a precise numeric amount, a unique idempotency key, a simulated event, and seven-day expiry. The UI displays the backend record and explicitly marks every unperformed provider, authorization, debit, merchant, and settlement stage. This is not yet a real payment intent, provider adapter, or ledger. The migration and server-side environment configuration must be applied before the endpoint can be exercised on Vercel.

### Phase 3 — Accounting and pricing

1. Agree on the permitted sandbox accounting model and the external party responsible for funds.
2. Implement a currency-aware double-entry journal using fixed-precision amounts, balanced posting, immutable posted entries, and compensating reversals.
3. Add configurable fee rules only after commercial terms and customer disclosures are defined.
4. Keep external clearing and settlement records distinct from WeduPay-held funds; never create a customer wallet balance or invented balance.
5. Test balanced journals, reversals, fee limits, and currency isolation.

### Phase 4 — Provider and merchant adapters

1. Define separate merchant and mobile-money provider adapter contracts.
2. Implement clearly named mock/sandbox adapters that cannot call production endpoints.
3. Start with the education tuition use case without assuming student-record or institutional API access.
4. Add provider routing only from server-side, enabled, tested configurations.
5. Require verified commercial arrangements and provider-issued credentials before enabling any real adapter.

### Phase 5 — Webhooks and reconciliation

1. Add provider-specific signature, timestamp, replay, and idempotency verification.
2. Persist callback events before processing; handle duplicates, delays, and out-of-order notifications without regressing authoritative state.
3. Import explicitly simulated sandbox reports before connecting to real provider reports.
4. Add reconciliation items and audit trails for unmatched references, amount/fee mismatches, duplicates, reversals, and settlement discrepancies.
5. Never infer merchant receipt or settlement from a customer debit alone.

### Phase 6 — Website integration

1. Keep the existing landing, sign-in preview, and dashboard route structure.
2. Replace preview-only customer transaction views with authenticated API data only after customer authentication exists.
3. Add a verified-event payment timeline separating customer authorization, provider debit, merchant obligation, and confirmed settlement.
4. Add a separate role-protected operations area for ledger, provider health, and reconciliation; do not expose administrative data in the public customer dashboard.
5. Clearly label sandbox activity and receipts as `DEMONSTRATION` or `SANDBOX`.

### Phase 7 — Verification and launch readiness

Add automated tests for duplicate/out-of-order webhooks, invalid signatures, provider timeouts, payment failures, reversals/refunds, journal balancing, reconciliation mismatches, and customer/admin access controls. Complete threat modeling, operational monitoring, backup/retention/deletion, incident-response planning, and qualified regulatory/legal review before any production activation.

## Decisions and prerequisites before production

- Confirm the backend runtime/database direction. This plan recommends the existing Vercel + Supabase path, but no production payment schema or credentials are configured.
- Select and verify authentication and account recovery; the current phone-number page is only a demo.
- Confirm each provider's licensed/authorised integration path, capabilities, country/currency coverage, commercial agreement, and sandbox/production credentials.
- Confirm merchant payment requirements, references, settlement responsibility, and confirmation source.
- Define fee responsibility, fee disclosures, limits, and currency behavior from approved commercial terms; keep FX disabled until verified.
- Obtain qualified legal/compliance guidance for target-market permissions, POPIA, cross-border payment flows, AML/KYC responsibilities, retention, and consumer disclosures.

Until these prerequisites are satisfied, payment initiation, provider callbacks, settlement, and financial metrics must remain unavailable or clearly simulated. The current dashboard makes no real payment claims and should retain that boundary.
