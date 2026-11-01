# WeduPay

WeduPay is a mobile-wallet payment network in development. The website includes a Supabase-powered sign-in and account-creation page.

## Set up phone sign-in on Vercel

The sign-in page needs a Supabase project, phone authentication, an SMS provider, and two Vercel environment variables. Without them, the page displays a setup message and does not attempt to sign in.

1. In Supabase, open your project and find **Project URL** and the **publishable key** (or legacy **anon** key) under **Project Settings → API**.
2. In Vercel, open the WeduPay project and go to **Settings → Environment Variables**. Add:
   - `SUPABASE_URL` — the Supabase Project URL.
   - `SUPABASE_ANON_KEY` — the Supabase publishable/anon key. Alternatively, name this `SUPABASE_PUBLISHABLE_KEY`.
3. In Supabase, open **Authentication → Sign In / Providers** and enable **Phone** authentication. Configure an SMS provider in the project's authentication settings; Supabase needs it to send phone-verification and password-reset codes.
4. In Supabase, open **Authentication → URL Configuration**. Set the Site URL to your Vercel site address. Also allow the Vercel preview URL if you will test sign-in previews.
5. Redeploy the Vercel project so the environment variables are available to the website.

Only use the Supabase publishable/anon key in this setup. **Never add a service-role key or secret key to the website or Vercel variables used by this page.** The publishable/anon key is intended for browser use; configure Supabase access policies before adding any private user data.

The sign-in page supports phone/password sign-in, SMS-verified account creation, and password reset by SMS code. Phone numbers are normalized to international format using the selected calling code for Zimbabwe (+263), Zambia (+260), Malawi (+265), or Mozambique (+258). Existing email-only accounts must add and verify a phone number in Supabase before they can use phone sign-in. WeduPay payment processing is separate and is not currently available.
