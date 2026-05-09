alter table public.firms
  add column if not exists address text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists registration_code text;

do $$
begin
  alter table public.firms
    add constraint firms_registration_code_format check (registration_code is null or registration_code ~ '^[0-9]{10}$');
exception
  when duplicate_object then null;
end $$;

create unique index if not exists firms_registration_code_unique_idx
  on public.firms(registration_code)
  where registration_code is not null;

create table if not exists public.owner_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.registration_codes (
  code text primary key check (code ~ '^[0-9]{10}$'),
  firm_id uuid unique references public.firms(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  notes text
);

alter table public.owner_users enable row level security;
alter table public.registration_codes enable row level security;

create or replace function public.is_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.owner_users owner_user
    where owner_user.user_id = auth.uid()
  )
$$;

drop policy if exists "owners can read owner profile" on public.owner_users;
create policy "owners can read owner profile"
on public.owner_users for select
using (user_id = auth.uid());

drop policy if exists "owners can read registration codes" on public.registration_codes;
create policy "owners can read registration codes"
on public.registration_codes for select
using (public.is_platform_owner());

drop policy if exists "owners can create registration codes" on public.registration_codes;
create policy "owners can create registration codes"
on public.registration_codes for insert
with check (public.is_platform_owner() and created_by = auth.uid());

create or replace function public.create_registration_code(registration_code text, notes text default null)
returns public.registration_codes
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code public.registration_codes;
begin
  if not public.is_platform_owner() then
    raise exception 'Only the platform owner can create registration codes';
  end if;

  if registration_code !~ '^[0-9]{10}$' then
    raise exception 'Registration code must be exactly 10 digits';
  end if;

  insert into public.registration_codes(code, created_by, notes)
  values (registration_code, auth.uid(), nullif(trim(notes), ''))
  returning * into new_code;

  return new_code;
end;
$$;

create or replace function public.get_owner_firm_summaries()
returns table (
  firm_id uuid,
  firm_name text,
  address text,
  phone text,
  email text,
  registration_code text,
  created_at timestamptz,
  tasks_count bigint,
  partners_count bigint,
  clients_count bigint,
  team_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    f.id as firm_id,
    f.name as firm_name,
    f.address,
    f.phone,
    f.email,
    f.registration_code,
    f.created_at,
    count(distinct t.id) as tasks_count,
    count(distinct u.id) filter (where u.role = 'partner') as partners_count,
    count(distinct c.id) as clients_count,
    count(distinct u.id) as team_count
  from public.firms f
  left join public.tasks t on t.firm_id = f.id
  left join public.users u on u.firm_id = f.id
  left join public.clients c on c.firm_id = f.id
  where public.is_platform_owner()
  group by f.id, f.name, f.address, f.phone, f.email, f.registration_code, f.created_at
  order by f.created_at desc
$$;

create or replace function public.create_firm_and_admin(
  registration_code text,
  firm_name text,
  firm_address text,
  firm_phone text,
  firm_email text,
  full_name text
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  new_firm_id uuid;
  profile public.users;
  invite public.registration_codes;
begin
  if auth.uid() is null then
    raise exception 'Must be authenticated';
  end if;

  if exists (select 1 from public.users where id = auth.uid()) then
    raise exception 'Profile already exists';
  end if;

  select *
  into invite
  from public.registration_codes
  where code = registration_code
  for update;

  if invite.code is null then
    raise exception 'Invalid registration code';
  end if;

  if invite.used_at is not null or invite.firm_id is not null then
    raise exception 'Registration code has already been used';
  end if;

  insert into public.firms(name, address, phone, email, registration_code)
  values (firm_name, firm_address, firm_phone, firm_email, registration_code)
  returning id into new_firm_id;

  update public.registration_codes
  set firm_id = new_firm_id, used_at = now()
  where code = registration_code;

  insert into public.users(id, firm_id, name, role)
  values (auth.uid(), new_firm_id, full_name, 'admin')
  returning * into profile;

  return profile;
end;
$$;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.create_registration_code(text, text) to authenticated;
grant execute on function public.get_owner_firm_summaries() to authenticated;
grant execute on function public.create_firm_and_admin(text, text, text, text, text, text) to authenticated;
grant execute on function public.is_platform_owner() to authenticated;
