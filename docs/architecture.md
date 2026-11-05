# WeduPay website and waitlist architecture

## Current site

The public website is static HTML, CSS, and browser JavaScript served by Vercel. It describes WeduPay's effort to build a bridge between African mobile money and global digital payments, starting with education. Payment flows and provider examples are proposed, not operational. `sign-in.html` accepts the reserved fictional demo number `+1 202-555-0147` to navigate to the dashboard preview. This client-side check is not authentication or phone verification; the number is not transmitted, retained, or used to identify a customer. Other numbers do not continue to the dashboard through the sign-in form.

`dashboard.html` is a publicly accessible, unauthenticated customer-dashboard concept linked from the landing and sign-in pages. `dashboard.js` renders its overview, merchant categories, empty account states, and a local-only tuition payment-review mockup. Merchant metadata is centralized in `merchant-registry.js`. The dashboard does not request API data, save entered details, infer a wallet from a phone number, create transactions, calculate fees or exchange rates, or authorize/submit payments. Provider names are examples only and do not establish availability or a commercial relationship.

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

There is no payment execution, wallet identification, wallet authorization, refund/settlement system, account system, email confirmation, analytics, or production consent management. Any future payment system requires separate product, partner, compliance, and security design and verification.
