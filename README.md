# WeduPay

WeduPay is building a bridge between African mobile money and global digital payments, starting with education. Its vision is to enable students to pay tuition fees online using local mobile money accounts without relying on international bank cards. The concept, partnerships, and infrastructure are in development. WeduPay is not a bank, wallet, payment gateway, card processor, or currently operating payment service. No provider integrations, institutional partnerships, licenses, or payment services are claimed.

The site is a static HTML, CSS, and JavaScript landing page with a linked, public customer-dashboard concept preview at `dashboard.html`. Its audience-specific early-interest form posts to a Vercel serverless API. The API is disabled by default and does not report successful signup unless the submission is saved by the configured database. `sign-in.html` accepts the reserved fictional demo number `+1 202-555-0147` only to navigate to the dashboard preview; this is not authentication or phone verification, and the number is not sent or saved. The dashboard is not an authenticated customer account: it shows no real account, payment methods, or transaction history. The tuition presentation walkthrough shows a fictional sample verification code (`123456`), accepts it locally, and offers a “Approve demo only” step. No SMS or OTP is sent, no provider is contacted, no wallet is debited, and no institution payment or settlement is confirmed. Payment details remain in page memory only. Any settlement destination is illustrative; no BYU-Pathway bank account or route is verified. Separate sandbox API endpoints exist but are disabled and are not called by this public demo.

## Local preview

Serve the repository root with any static file server and open `index.html`. Use the landing-page Sign In link to see the phone-number sign-in preview, then choose “Explore the dashboard preview” to navigate the public dashboard concept. You can also open `dashboard.html` directly. In the tuition walkthrough, review the details, continue to the visibly fictional code `123456`, verify it locally, then select “Approve demo only” to reach the final “no payment made” screen. The journey works without backend configuration and clears when the page is reloaded or left. Do not use real wallet OTPs, credentials, or PINs in the presentation demo. The dashboard merchant and wallet-provider examples are centralized in `merchant-registry.js`; they are planning references, not verified partnerships or live integrations. The waitlist and separate sandbox API endpoints require Vercel-compatible functions and remain unavailable in a static-only preview.

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

Separate sandbox API endpoints are present for future backend exploration but are not used by the browser-only demo. `PAYMENTS_SANDBOX_ENABLED` is false by default. Keep it false unless a non-production environment has been deliberately configured and reviewed. If configured, the API can persist the selected merchant, country, provider, amount, currency, an idempotency key, timestamps, and one simulated event for up to seven days. It does not accept a student reference or phone number, call an external provider, create a financial ledger entry, move funds, or confirm a payment.
