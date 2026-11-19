# Waitlist implementation and launch checklist

## Audience fields

- **Student:** full name, email, country, registered mobile-wallet phone number.
- **Merchant:** business name, contact person, business email, country, business type.
- **Institution:** institution name, contact person, official email, country, nature of interest.
- **All:** explicit privacy consent; consent timestamp recorded by the server.

Do not add sensitive identity or payment information. Form entries are not persisted in the browser. The form does not verify phone ownership or infer a wallet/provider from the phone number.

## Configure services

1. Create a Supabase project, review its region and terms, and execute `supabase/waitlist.sql`.
2. Create Upstash Redis, review its region and retention settings, and obtain its REST URL/token.
3. Add all `.env.example` variables to the Vercel project as server-side environment variables. Never expose service-role or Upstash tokens to the browser.
4. Set `WAITLIST_ALLOWED_ORIGIN` to the exact origin making submissions. Use `https://your-domain.example` without a trailing slash.
5. Initially leave `WAITLIST_ENABLED=false`. The API returns a configuration message and does not save requests in this state.

## Before opening collection

- Complete company identity, privacy contact, effective dates, governing law, data subject rights, legal bases, processor disclosures, international transfer safeguards, retention period, and deletion procedures in the legal drafts.
- Obtain appropriate legal/privacy review for applicable countries and any data transfers.
- Confirm actual processor configuration, least-privilege access, backups, logging, breach response, and retention/deletion controls.
- Test each role, invalid input, missing consent, honeypot, repeated submissions, rate limiting, service outage, and origin restrictions in a non-production environment.
- Remove test data; verify the data deletion process.
- Enable `WAITLIST_ENABLED=true` only after all of the above is approved, then redeploy.

## API behavior

The endpoint accepts only `POST`, an exact configured `Origin`, JSON, a valid audience-specific field set, consent `true`, and a supported country. Student entries require a phone number in a basic international-number character format; this does not verify ownership or identify the wallet/provider. Honeypot submissions receive a non-descriptive success response without being stored. The rate limit is eight attempts per IP per ten minutes; failures in the limiter or database fail closed. Repeated normalized email/audience entries are ignored by the unique constraint and are not overwritten.

The returned success message only follows an accepted database request. A `503` means the submission was not confirmed as saved; it must not be presented as successful.
