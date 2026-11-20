# WeduPay website and waitlist architecture

## Current site

The public website is static HTML, CSS, and browser JavaScript served by Vercel. It describes WeduPay's effort to build a bridge between African mobile money and global digital payments, starting with education. Payment flows and provider examples are proposed, not operational. `sign-in.html` accepts the reserved fictional demo number `+1 202-555-0147` to navigate to the dashboard preview. This client-side check is not authentication or phone verification; the number is not transmitted, retained, or used to identify a customer. Other numbers do not continue to the dashboard through the sign-in form.

`dashboard.html` is a publicly accessible, unauthenticated customer-dashboard concept linked from the landing and sign-in pages. `dashboard.js` renders its overview, merchant categories, empty account states, and a browser-only tuition demonstration flow. The flow displays a fictional sample code (`123456`) as a mock provider message, checks it in page memory, and offers a “Approve demo only” action before showing a final no-payment result. No OTP is sent, no provider is contacted, no wallet is authorized or debited, and no transfer, institution receipt, or settlement is confirmed. Merchant and provider option metadata is centralized in `merchant-registry.js`. The browser does not submit or persist payment-demo fields; its temporary journey disappears on reload or navigation. The separate, disabled-by-default sandbox API is not called by this demo. It does not create a financial transaction, calculate fees or exchange rates, contact a provider or merchant, authorize/submit a payment, or claim fund movement. Provider names are examples only and do not establish availability or a commercial relationship. Any institution settlement destination shown in the demo is illustrative; no BYU-Pathway bank account or receiving route is verified.

The separate `/api/v1/sandbox-payment` endpoint is not integrated into the customer-facing demo and is disabled unless `PAYMENTS_SANDBOX_ENABLED=true` and its database, exact allowed origin, and Upstash rate limiter are configured. Its Supabase schema is separate from the waitlist. It accepts a selected merchant, country, provider, amount, currency, and idempotency key; it does not accept the student reference or phone number. The endpoint records no provider instruction, customer authorization, debit, merchant confirmation, financial ledger entry, or settlement. `GET /api/v1/sandbox-payment/:id` returns a time-limited demonstration record and its simulated preview-created event. Expired records are purged during the next sandbox create or lookup request.

## Waitlist request flow

1. A visitor selects student, merchant, or institution and supplies only the fields for that audience.
2. The browser validates required fields and consent, then sends a JSON `POST` to `/api/waitlist`. It does not retain the form in local or session storage.
3. `api/waitlist.js` checks the feature flag and exact allowed origin, enforces a request-size bound, rejects honeypot submissions, rate-limits the forwarded client IP with Upstash Redis, validates and normalizes fields, and inserts through Supabase's REST API.
4. Supabase stores one row per normalized email and audience. Row-level security is enabled without public policies; only server-side credentials are used by the API.
5. The browser displays a success state only after the API confirms database acceptance. Unconfigured services, rate-limit failures, or database failures return an error and do not claim a saved registration.

## Data boundaries

The database contains audience, lowercase email, country, contact name, role-specific details, consent timestamp, and server-generated creation timestamp. Student details include the required phone number provided by the student; it is not verified and is not used to identify a wallet. The API does not store request IP in the waitlist table. Upstash keys include the IP for a ten-minute counter TTL. Configure and verify provider logs, regions, backups, and deletion behavior before collection.

## Trust and security boundaries

- `WAITLIST_ENABLED` defaults to false. Keep it false until legal and operational readiness is approved.
- `WAITLIST_ALLOWED_ORIGIN` must be an exact HTTPS production origin.
- `SUPABASE_SERVICE_ROLE_KEY` and `UPSTASH_REDIS_REST_TOKEN` are server-only secrets.
- Public database roles have no policies or grants to read/write the waitlist.
- Rate limiting fails closed; when Upstash is unavailable, the endpoint does not accept a submission.
- Vercel headers set a restrictive content security policy, deny framing, and disable browser features not used by the site.

## Not implemented

There is no production payment execution, wallet identification, wallet authorization, refund/settlement system, customer account system, email confirmation, analytics, or production consent management. The sandbox preview API is not a payment system. Any future payment system requires separate product, partner, compliance, and security design and verification. See [`payment-platform-implementation-plan.md`](payment-platform-implementation-plan.md) for the repository audit and phased implementation plan.
