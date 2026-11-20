# WeduPay

WeduPay is building a bridge between African mobile money and global digital payments, starting with education. Its vision is to enable students to pay tuition fees online using local mobile money accounts without relying on international bank cards. The concept, partnerships, and infrastructure are in development. WeduPay is not a bank, wallet, payment gateway, card processor, or currently operating payment service. No provider integrations, institutional partnerships, licenses, or payment services are claimed.

The site is a static HTML, CSS, and JavaScript landing page with a linked, public customer-dashboard concept preview at `dashboard.html`. Its audience-specific early-interest form posts to a Vercel serverless API. The API is disabled by default and does not report successful signup unless the submission is saved by the configured database. `sign-in.html` accepts the reserved fictional demo number `+1 202-555-0147` only to navigate to the dashboard preview; this is not authentication or phone verification, and the number is not sent or saved. The dashboard is not an authenticated customer account: it shows no real account, payment methods, or transaction history. Its optional sandbox API can save a seven-day demonstration record containing the selected merchant, country, provider, amount, and currency. It does not send the student reference or phone number, contact a provider or merchant, or initiate, confirm, or settle a payment.

## Local preview

Serve the repository root with any static file server and open `index.html`. Use the landing-page Sign In link to see the phone-number sign-in preview, then choose “Explore the dashboard preview” to navigate the public dashboard concept. You can also open `dashboard.html` directly. The dashboard merchant and wallet-provider examples are centralized in `merchant-registry.js`; they are planning references, not verified partnerships or live integrations. Both the waitlist and sandbox-payment endpoints require Vercel-compatible functions and remain unavailable in a static-only preview.

## Waitlist deployment

Do not enable collection until the privacy and terms drafts have been reviewed, the company/contact placeholders are resolved, data retention and deletion procedures are approved, and all storage providers are configured.

1. Create a Supabase project and run [`supabase/waitlist.sql`](supabase/waitlist.sql) in its SQL editor.
2. Create an Upstash Redis database for rate limiting.
3. Configure the environment variables from [`.env.example`](.env.example) in Vercel. Keep `SUPABASE_SERVICE_ROLE_KEY` and `UPSTASH_REDIS_REST_TOKEN` server-only; never prefix them with `VITE_`, `NEXT_PUBLIC_`, or another public-client prefix.
4. Set `WAITLIST_ALLOWED_ORIGIN` to the exact production origin, for example `https://example.com`, without a trailing slash. Add preview origins only if intentionally accepting preview submissions.
5. Keep `WAITLIST_ENABLED=false` until the privacy notice and retention practices are finalized and reviewed. Then set it to `true` and redeploy.
6. Submit one test entry for each audience, verify the stored row and duplicate handling, and delete test data before opening the waitlist.

The endpoint validates audience-specific fields, requires affirmative privacy consent, rejects unexpected values, checks a honeypot, rate-limits by request IP, and inserts through the Supabase REST API. Rate limiting fails closed if Upstash is unavailable. The SQL enables row-level security without public policies; the service role is used only by the serverless function. Configure Supabase and Upstash data regions and retention to meet applicable legal requirements before collecting real data.

See [`docs/architecture.md`](docs/architecture.md), [`docs/waitlist.md`](docs/waitlist.md), and the [payment platform repository audit and phased implementation plan](docs/payment-platform-implementation-plan.md) for the current architecture and next steps. `privacy.html` and `terms.html` are drafts for qualified legal review, not legal advice or claims of compliance.

## Sandbox payment preview

The sandbox endpoint is disabled unless `PAYMENTS_SANDBOX_ENABLED=true`. To try it in a non-production Vercel environment, apply [`supabase/payment-sandbox.sql`](supabase/payment-sandbox.sql), set `PAYMENTS_SANDBOX_ALLOWED_ORIGIN` to that exact environment origin, and configure the existing server-only Supabase and Upstash variables. Keep `PAYMENTS_SANDBOX_ENABLED=false` in production. The API persists the selected merchant, country, provider, amount, currency, a random idempotency key, timestamps, and one simulated event for up to seven days; expired records are purged during the next sandbox create or lookup request. It does not accept or persist a student reference or phone number. It creates a clearly labeled preview record; it does not call an external provider, create a financial ledger entry, move funds, or confirm a payment.
