create table if not exists public.waitlist (
  id bigint generated always as identity primary key,
  audience text not null check (audience in ('student', 'merchant', 'institution')),
  email text not null check (email = lower(email)),
  country text not null check (country in ('Zimbabwe', 'South Africa', 'Malawi', 'Zambia', 'Mozambique', 'Other')),
  contact_name text not null,
  details jsonb not null default '{}'::jsonb,
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint waitlist_email_audience_unique unique (email, audience)
);

alter table public.waitlist enable row level security;
revoke all on table public.waitlist from anon, authenticated;
grant insert on table public.waitlist to service_role;
grant usage, select on sequence public.waitlist_id_seq to service_role;
