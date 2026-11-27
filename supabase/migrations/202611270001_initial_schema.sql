-- K.T.A initial Supabase schema
-- Apply in the Supabase SQL Editor after creating the project.
-- No service-role key or payment credentials belong in this repository.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  phone text,
  role text not null default 'customer'
    check (role in ('customer', 'agent', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.flights (
  id text primary key,
  flight_no text not null,
  airline text not null,
  origin text not null,
  destination text not null,
  departure_time text,
  arrival_time text,
  duration text,
  stops integer not null default 0 check (stops >= 0),
  cabin text,
  price_usd numeric(12,2) not null check (price_usd >= 0),
  seats integer not null default 0 check (seats >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  pnr text unique,
  ticket_no text unique,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'refunded')),
  flight_snapshot jsonb not null default '{}'::jsonb,
  passenger_data jsonb not null default '[]'::jsonb
    check (jsonb_typeof(passenger_data) = 'array'),
  contact_email text not null,
  contact_phone text,
  depart_date date,
  total_usd numeric(12,2) not null check (total_usd >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Never trust role or other authorization fields from user-editable auth metadata.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- SECURITY DEFINER avoids recursive profile-table RLS checks.
create or replace function public.is_kta_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'agent')
  );
$$;

create or replace function public.is_kta_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.flights enable row level security;
alter table public.bookings enable row level security;
alter table public.audit_events enable row level security;

-- Profiles: users can read their own profile; staff can read profiles.
drop policy if exists "profiles_read_self_or_staff" on public.profiles;
create policy "profiles_read_self_or_staff"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_kta_staff()));

-- No client-side role or profile updates. Use a trusted server-side workflow.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

-- Flight catalogue is public-readable; only staff can modify it.
drop policy if exists "flights_public_read_active" on public.flights;
create policy "flights_public_read_active"
  on public.flights for select to anon, authenticated
  using (is_active or (select public.is_kta_staff()));

drop policy if exists "flights_staff_insert" on public.flights;
create policy "flights_staff_insert"
  on public.flights for insert to authenticated
  with check ((select public.is_kta_staff()));

drop policy if exists "flights_staff_update" on public.flights;
create policy "flights_staff_update"
  on public.flights for update to authenticated
  using ((select public.is_kta_staff()))
  with check ((select public.is_kta_staff()));

drop policy if exists "flights_staff_delete" on public.flights;
create policy "flights_staff_delete"
  on public.flights for delete to authenticated
  using ((select public.is_kta_staff()));

grant select on public.flights to anon, authenticated;
grant insert, update, delete on public.flights to authenticated;

-- Customers can create pending bookings for themselves and read only their own.
-- Client-side users cannot change booking status, PNR, ticket number, or payment state.
drop policy if exists "bookings_read_owner_or_staff" on public.bookings;
create policy "bookings_read_owner_or_staff"
  on public.bookings for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_kta_staff()));

drop policy if exists "bookings_insert_owner_pending" on public.bookings;
create policy "bookings_insert_owner_pending"
  on public.bookings for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and pnr is null
    and ticket_no is null
  );

grant select, insert on public.bookings to authenticated;

-- Audit records are readable only by admins; writes will be performed by trusted functions.
drop policy if exists "audit_admin_read" on public.audit_events;
create policy "audit_admin_read"
  on public.audit_events for select to authenticated
  using ((select public.is_kta_admin()));

grant select on public.audit_events to authenticated;

-- Do not expose internal authorization helpers to anonymous clients.
revoke all on function public.is_kta_staff() from public, anon;
revoke all on function public.is_kta_admin() from public, anon;
grant execute on function public.is_kta_staff() to authenticated;
grant execute on function public.is_kta_admin() to authenticated;
