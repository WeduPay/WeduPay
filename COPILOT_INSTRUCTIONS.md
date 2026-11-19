# Repository guidance

- Keep WeduPay positioned as building a bridge between African mobile money and global digital payments, starting with education. The concept, partnerships, and infrastructure are in development. Do not call it a traditional payment gateway, credit-card processor, operational payment service, bank, or wallet.
- Do not imply active provider integrations, institutional partnerships, licenses, regulatory approvals, transaction activity, or custody of customer funds.
- Keep waitlist collection disabled by default. Never report success unless the server confirms the database accepted the submission.
- Treat `sign-in.html` as a UI preview only until an account system is implemented; do not imply authentication is available or transmit the preview phone number.
- Keep secrets server-side. Do not place service-role keys, Redis tokens, or other credentials in browser code or public environment variables.
- Minimize collection of personal information. Do not store form data or personal information in browser storage.
- Treat privacy and terms pages as drafts until actual operations are confirmed and qualified legal review is complete.
- Preserve accessible labels, keyboard navigation, responsive behavior, and clear error states when changing the site.
- Use the static HTML/CSS/JavaScript conventions already in the repository and keep backend behavior in the Vercel `api/` functions.
