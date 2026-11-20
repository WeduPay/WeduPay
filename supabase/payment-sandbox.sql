create table if not exists public.sandbox_payment_previews (
  id uuid primary key default gen_random_uuid(),
  idempotency_key uuid not null unique,
  merchant_id text not null check (merchant_id = 'byu-pathway'),
  country text not null check (country in ('Zimbabwe', 'Zambia', 'Malawi', 'Mozambique')),
  provider text not null,
  amount numeric(11, 2) not null check (amount > 0 and amount <= 1000000),
  currency text not null,
  status text not null default 'PREVIEW_ONLY' check (status = 'PREVIEW_ONLY'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  check (
    (country = 'Zimbabwe' and provider in ('EcoCash', 'InnBucks', 'Mukuru Wallet', 'OMari') and currency in ('USD', 'ZWL')) or
    (country = 'Zambia' and provider in ('MTN MoMo', 'Airtel Money', 'Zamtel Kwacha') and currency in ('USD', 'ZMW')) or
    (country = 'Malawi' and provider in ('Airtel Money', 'TNM Mpamba') and currency in ('USD', 'MWK')) or
    (country = 'Mozambique' and provider in ('M-Pesa', 'e-Mola', 'Mkesh') and currency in ('USD', 'MZN'))
  )
);

create index if not exists sandbox_payment_previews_expires_at_idx
  on public.sandbox_payment_previews (expires_at);

create table if not exists public.sandbox_payment_preview_events (
  id bigint generated always as identity primary key,
  preview_id uuid not null references public.sandbox_payment_previews (id) on delete cascade,
  event_type text not null check (event_type = 'DEMO_PREVIEW_CREATED'),
  event_status text not null check (event_status = 'SIMULATED'),
  event_source text not null check (event_source = 'WEDUPAY_SANDBOX'),
  created_at timestamptz not null default now()
);

create index if not exists sandbox_payment_preview_events_preview_id_idx
  on public.sandbox_payment_preview_events (preview_id, created_at);

alter table public.sandbox_payment_previews enable row level security;
alter table public.sandbox_payment_preview_events enable row level security;
revoke all on table public.sandbox_payment_previews from public, anon, authenticated;
revoke all on table public.sandbox_payment_preview_events from public, anon, authenticated;
grant select on table public.sandbox_payment_previews to service_role;
grant select on table public.sandbox_payment_preview_events to service_role;
revoke all on sequence public.sandbox_payment_preview_events_id_seq from public, anon, authenticated;

create or replace function public.prevent_sandbox_event_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' and current_setting('wedupay.allow_sandbox_preview_purge', true) = 'on' then
    return old;
  end if;
  raise exception 'Sandbox preview events are immutable';
end;
$$;

drop trigger if exists sandbox_payment_preview_events_immutable
  on public.sandbox_payment_preview_events;
create trigger sandbox_payment_preview_events_immutable
  before update or delete on public.sandbox_payment_preview_events
  for each row execute function public.prevent_sandbox_event_mutation();

create or replace function public.purge_expired_sandbox_payment_previews()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  deleted_count integer;
begin
  perform set_config('wedupay.allow_sandbox_preview_purge', 'on', true);
  delete from public.sandbox_payment_previews where expires_at <= now();
  get diagnostics deleted_count = row_count;
  perform set_config('wedupay.allow_sandbox_preview_purge', 'off', true);
  return deleted_count;
end;
$$;

create or replace function public.create_sandbox_payment_preview(
  p_idempotency_key uuid,
  p_merchant_id text,
  p_country text,
  p_amount numeric,
  p_currency text,
  p_provider text
)
returns table (id uuid, created_at timestamptz, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  preview public.sandbox_payment_previews%rowtype;
begin
  if p_idempotency_key is null or
     p_merchant_id is distinct from 'byu-pathway' or
     p_amount is null or p_country is null or p_currency is null or p_provider is null or
     p_amount <= 0 or p_amount > 1000000 or p_amount <> round(p_amount, 2) or
     not (
       (p_country = 'Zimbabwe' and p_provider in ('EcoCash', 'InnBucks', 'Mukuru Wallet', 'OMari') and p_currency in ('USD', 'ZWL')) or
       (p_country = 'Zambia' and p_provider in ('MTN MoMo', 'Airtel Money', 'Zamtel Kwacha') and p_currency in ('USD', 'ZMW')) or
       (p_country = 'Malawi' and p_provider in ('Airtel Money', 'TNM Mpamba') and p_currency in ('USD', 'MWK')) or
       (p_country = 'Mozambique' and p_provider in ('M-Pesa', 'e-Mola', 'Mkesh') and p_currency in ('USD', 'MZN'))
     ) then
    raise exception 'Invalid sandbox preview details' using errcode = '22023';
  end if;

  perform public.purge_expired_sandbox_payment_previews();

  insert into public.sandbox_payment_previews (
    idempotency_key, merchant_id, country, provider, amount, currency
  )
  values (
    p_idempotency_key, p_merchant_id, p_country, p_provider, p_amount, p_currency
  )
  on conflict (idempotency_key) do nothing
  returning * into preview;

  if preview.id is null then
    select * into preview
    from public.sandbox_payment_previews as existing
    where existing.idempotency_key = p_idempotency_key;

    if preview.merchant_id is distinct from p_merchant_id or
       preview.country is distinct from p_country or
       preview.provider is distinct from p_provider or
       preview.amount is distinct from p_amount or
       preview.currency is distinct from p_currency then
      raise exception 'Idempotency key was already used for different demo details' using errcode = '22023';
    end if;
  else
    insert into public.sandbox_payment_preview_events (
      preview_id, event_type, event_status, event_source
    )
    values (preview.id, 'DEMO_PREVIEW_CREATED', 'SIMULATED', 'WEDUPAY_SANDBOX');
  end if;

  return query select preview.id, preview.created_at, preview.expires_at;
end;
$$;

revoke all on function public.prevent_sandbox_event_mutation() from public, anon, authenticated;
revoke all on function public.purge_expired_sandbox_payment_previews() from public, anon, authenticated;
revoke all on function public.create_sandbox_payment_preview(uuid, text, text, numeric, text, text)
  from public, anon, authenticated;
grant execute on function public.purge_expired_sandbox_payment_previews() to service_role;
grant execute on function public.create_sandbox_payment_preview(uuid, text, text, numeric, text, text)
  to service_role;
