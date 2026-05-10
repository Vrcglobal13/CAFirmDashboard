alter table public.firms
  add column if not exists is_active boolean not null default true;

create or replace function public.toggle_firm_status(target_firm_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status boolean;
  new_status boolean;
begin
  if not public.is_platform_owner() then
    raise exception 'Only the platform owner can toggle firm status';
  end if;

  select is_active into current_status
  from public.firms
  where id = target_firm_id;

  if current_status is null then
    raise exception 'Firm not found';
  end if;

  new_status := not current_status;

  update public.firms
  set is_active = new_status
  where id = target_firm_id;

  insert into public.audit_logs(action, details, user_id) values ('firm_status_toggled', jsonb_build_object('firm_id', target_firm_id, 'new_status', new_status), auth.uid());
  return new_status;
end;
$$;

grant execute on function public.toggle_firm_status(uuid) to authenticated;

create or replace function public.get_owner_firm_summaries()
returns table (
  firm_id uuid,
  firm_name text,
  address text,
  phone text,
  email text,
  registration_code text,
  created_at timestamptz,
  is_active boolean,
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
    f.is_active,
    count(distinct t.id) as tasks_count,
    count(distinct u.id) filter (where u.role = 'partner') as partners_count,
    count(distinct c.id) as clients_count,
    count(distinct u.id) as team_count
  from public.firms f
  left join public.tasks t on t.firm_id = f.id
  left join public.users u on u.firm_id = f.id
  left join public.clients c on c.firm_id = f.id
  where public.is_platform_owner()
  group by f.id, f.name, f.address, f.phone, f.email, f.registration_code, f.created_at, f.is_active
  order by f.created_at desc
$$;

create or replace function public.toggle_registration_code_status(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status boolean;
  new_status boolean;
begin
  if not public.is_platform_owner() then
    raise exception 'Only the platform owner can toggle code status';
  end if;

  select is_active into current_status
  from public.registration_codes
  where code = p_code;

  if current_status is null then
    raise exception 'Registration code not found';
  end if;

  new_status := not current_status;

  update public.registration_codes
  set is_active = new_status
  where code = p_code;

  insert into public.audit_logs(action, details, user_id) values ('registration_code_toggled', jsonb_build_object('code', p_code, 'new_status', new_status), auth.uid());
  return new_status;
end;
$$;
grant execute on function public.toggle_registration_code_status(text) to authenticated;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  details jsonb,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;
create policy "owners can read audit logs"
on public.audit_logs for select
using (public.is_platform_owner());
