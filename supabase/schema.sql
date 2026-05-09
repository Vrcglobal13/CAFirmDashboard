create extension if not exists "pgcrypto";

create type public.app_role as enum ('admin', 'partner', 'employee');
create type public.task_status as enum ('created', 'in_progress', 'completed', 'verified');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');

create table public.firms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 1),
  address text,
  phone text,
  email text,
  registration_code text unique check (registration_code ~ '^[0-9]{10}$'),
  created_at timestamptz not null default now()
);

create table public.owner_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.registration_codes (
  code text primary key check (code ~ '^[0-9]{10}$'),
  firm_id uuid unique references public.firms(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  notes text
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  firm_id uuid not null references public.firms(id) on delete cascade,
  name text not null check (length(trim(name)) > 1),
  role public.app_role not null default 'employee',
  designation text,
  mobile text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (firm_id, id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_name text not null check (length(trim(client_name)) > 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (firm_id, id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid not null,
  title text not null check (length(trim(title)) > 2),
  description text,
  created_by uuid not null,
  doer_id uuid not null,
  verifier_id uuid not null,
  status public.task_status not null default 'created',
  priority public.task_priority not null default 'medium',
  deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  verified_at timestamptz,
  unique (firm_id, id),
  constraint tasks_different_doer_and_verifier check (doer_id <> verifier_id),
  constraint tasks_client_same_firm foreign key (firm_id, client_id)
    references public.clients(firm_id, id) on delete restrict,
  constraint tasks_creator_same_firm foreign key (firm_id, created_by)
    references public.users(firm_id, id) on delete restrict,
  constraint tasks_doer_same_firm foreign key (firm_id, doer_id)
    references public.users(firm_id, id) on delete restrict,
  constraint tasks_verifier_same_firm foreign key (firm_id, verifier_id)
    references public.users(firm_id, id) on delete restrict
);

create table public.task_logs (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  task_id uuid not null,
  action text not null check (length(trim(action)) > 1),
  user_id uuid,
  "timestamp" timestamptz not null default now(),
  remarks text,
  constraint task_logs_task_same_firm foreign key (firm_id, task_id)
    references public.tasks(firm_id, id) on delete cascade,
  constraint task_logs_user_same_firm foreign key (firm_id, user_id)
    references public.users(firm_id, id) on delete set null (user_id)
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  user_id uuid not null,
  attendance_date date not null default ((now() at time zone 'Asia/Kolkata')::date),
  check_in timestamptz not null default now(),
  check_out timestamptz,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  created_at timestamptz not null default now(),
  working_minutes integer generated always as (
    case
      when check_out is null then null
      else floor(extract(epoch from (check_out - check_in)) / 60)::integer
    end
  ) stored,
  constraint attendance_user_same_firm foreign key (firm_id, user_id)
    references public.users(firm_id, id) on delete cascade,
  constraint attendance_checkout_after_checkin check (check_out is null or check_out >= check_in)
);

create unique index attendance_one_checkin_per_day_idx
  on public.attendance(user_id, attendance_date);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  user_id uuid not null,
  message text not null check (length(trim(message)) > 1),
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint notifications_user_same_firm foreign key (firm_id, user_id)
    references public.users(firm_id, id) on delete cascade
);

alter table public.tasks replica identity full;
alter table public.notifications replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.tasks;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end $$;

create index users_firm_id_idx on public.users(firm_id);
create index clients_firm_id_idx on public.clients(firm_id);
create index tasks_firm_id_idx on public.tasks(firm_id);
create index tasks_firm_id_status_idx on public.tasks(firm_id, status);
create index tasks_firm_id_created_by_idx on public.tasks(firm_id, created_by);
create index tasks_firm_id_doer_id_idx on public.tasks(firm_id, doer_id);
create index tasks_firm_id_verifier_id_idx on public.tasks(firm_id, verifier_id);
create index tasks_firm_id_deadline_idx on public.tasks(firm_id, deadline);
create index tasks_firm_id_created_at_idx on public.tasks(firm_id, created_at desc);
create index tasks_client_id_idx on public.tasks(client_id);
create index task_logs_firm_id_idx on public.task_logs(firm_id);
create index task_logs_task_id_idx on public.task_logs(task_id);
create index task_logs_user_id_idx on public.task_logs(user_id);
create index task_logs_firm_id_task_id_idx on public.task_logs(firm_id, task_id);
create index attendance_firm_id_idx on public.attendance(firm_id);
create index attendance_user_id_idx on public.attendance(user_id);
create index attendance_firm_id_user_id_date_idx on public.attendance(firm_id, user_id, attendance_date desc);
create index attendance_firm_id_check_in_idx on public.attendance(firm_id, check_in desc);
create index notifications_firm_id_idx on public.notifications(firm_id);
create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_user_id_is_read_idx on public.notifications(user_id, is_read);
create index notifications_user_id_created_at_idx on public.notifications(user_id, created_at desc);

alter table public.firms enable row level security;
alter table public.owner_users enable row level security;
alter table public.registration_codes enable row level security;
alter table public.users enable row level security;
alter table public.clients enable row level security;
alter table public.tasks enable row level security;
alter table public.task_logs enable row level security;
alter table public.attendance enable row level security;
alter table public.notifications enable row level security;

create or replace function public.current_firm_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.firm_id
  from public.users u
  where u.id = auth.uid()
$$;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select u.role
  from public.users u
  where u.id = auth.uid()
$$;

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

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = 'admin'
$$;

create or replace function public.is_partner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = 'partner'
$$;

create or replace function public.can_read_task(task_row public.tasks)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    task_row.firm_id = public.current_firm_id()
    and (
      public.is_admin()
      or task_row.doer_id = auth.uid()
      or task_row.verifier_id = auth.uid()
      or (public.is_partner() and task_row.created_by = auth.uid())
    )
$$;

create policy "firm members can read own firm"
on public.firms for select
using (id = public.current_firm_id());

create policy "admins can update own firm"
on public.firms for update
using (id = public.current_firm_id() and public.is_admin())
with check (id = public.current_firm_id() and public.is_admin());

create policy "owners can read owner profile"
on public.owner_users for select
using (user_id = auth.uid());

create policy "owners can read registration codes"
on public.registration_codes for select
using (public.is_platform_owner());

create policy "owners can create registration codes"
on public.registration_codes for insert
with check (public.is_platform_owner() and created_by = auth.uid());

create policy "firm users can read firm members"
on public.users for select
using (firm_id = public.current_firm_id());

create policy "admins can insert firm members"
on public.users for insert
with check (firm_id = public.current_firm_id() and public.is_admin());

create policy "admins can update firm members"
on public.users for update
using (firm_id = public.current_firm_id() and public.is_admin())
with check (firm_id = public.current_firm_id() and public.is_admin());

create policy "admins can delete firm members"
on public.users for delete
using (firm_id = public.current_firm_id() and public.is_admin());

create policy "firm users can read clients"
on public.clients for select
using (firm_id = public.current_firm_id());

create policy "admins and partners can insert clients"
on public.clients for insert
with check (firm_id = public.current_firm_id() and public.current_app_role() in ('admin', 'partner'));

create policy "admins and partners can update clients"
on public.clients for update
using (firm_id = public.current_firm_id() and public.current_app_role() in ('admin', 'partner'))
with check (firm_id = public.current_firm_id() and public.current_app_role() in ('admin', 'partner'));

create policy "admins can delete clients"
on public.clients for delete
using (firm_id = public.current_firm_id() and public.is_admin());

create policy "users can read permitted tasks"
on public.tasks for select
using (public.can_read_task(tasks));

create policy "admins and partners can create firm tasks"
on public.tasks for insert
with check (
  firm_id = public.current_firm_id()
  and created_by = auth.uid()
  and public.current_app_role() in ('admin', 'partner')
  and status = 'created'
);

create policy "admins can update firm tasks"
on public.tasks for update
using (firm_id = public.current_firm_id() and public.is_admin())
with check (firm_id = public.current_firm_id() and public.is_admin());

create policy "partners can update tasks they created"
on public.tasks for update
using (firm_id = public.current_firm_id() and public.is_partner() and created_by = auth.uid())
with check (firm_id = public.current_firm_id() and public.is_partner() and created_by = auth.uid());

create policy "doers can advance assigned tasks"
on public.tasks for update
using (firm_id = public.current_firm_id() and doer_id = auth.uid())
with check (firm_id = public.current_firm_id() and doer_id = auth.uid());

create policy "verifiers can verify assigned tasks"
on public.tasks for update
using (firm_id = public.current_firm_id() and verifier_id = auth.uid())
with check (firm_id = public.current_firm_id() and verifier_id = auth.uid());

create policy "admins can delete firm tasks"
on public.tasks for delete
using (firm_id = public.current_firm_id() and public.is_admin());

create policy "users can read logs for permitted tasks"
on public.task_logs for select
using (
  firm_id = public.current_firm_id()
  and exists (
    select 1
    from public.tasks t
    where t.firm_id = task_logs.firm_id
      and t.id = task_logs.task_id
      and public.can_read_task(t)
  )
);

create policy "firm users can read scoped attendance"
on public.attendance for select
using (
  firm_id = public.current_firm_id()
  and (
    user_id = auth.uid()
    or public.current_app_role() in ('admin', 'partner')
  )
);

create policy "users can insert own attendance"
on public.attendance for insert
with check (firm_id = public.current_firm_id() and user_id = auth.uid());

create policy "users can update own attendance"
on public.attendance for update
using (firm_id = public.current_firm_id() and user_id = auth.uid())
with check (firm_id = public.current_firm_id() and user_id = auth.uid());

create policy "admins can delete attendance"
on public.attendance for delete
using (firm_id = public.current_firm_id() and public.is_admin());

create policy "users can read own notifications"
on public.notifications for select
using (firm_id = public.current_firm_id() and user_id = auth.uid());

create policy "users can update own notifications"
on public.notifications for update
using (firm_id = public.current_firm_id() and user_id = auth.uid())
with check (firm_id = public.current_firm_id() and user_id = auth.uid());

create policy "admins can delete firm notifications"
on public.notifications for delete
using (firm_id = public.current_firm_id() and public.is_admin());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

create or replace function public.enforce_task_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'created' then
      raise exception 'New tasks must start with status created';
    end if;

    if new.created_by <> auth.uid() then
      raise exception 'Task creator must be the authenticated user';
    end if;

    if public.current_app_role() not in ('admin', 'partner') then
      raise exception 'Only admins and partners can create tasks';
    end if;

    return new;
  end if;

  new.updated_at = now();

  if new.firm_id is distinct from old.firm_id then
    raise exception 'Task firm cannot be changed';
  end if;

  if new.status is distinct from old.status then
    if old.status = 'created' and new.status = 'in_progress' then
      if not public.is_admin() and auth.uid() <> old.doer_id then
        raise exception 'Only the assigned doer can start a task';
      end if;
      new.started_at = coalesce(new.started_at, now());
    elsif old.status = 'in_progress' and new.status = 'completed' then
      if not public.is_admin() and auth.uid() <> old.doer_id then
        raise exception 'Only the assigned doer can mark a task completed';
      end if;
      new.completed_at = coalesce(new.completed_at, now());
    elsif old.status = 'completed' and new.status = 'verified' then
      if not public.is_admin() and auth.uid() <> old.verifier_id then
        raise exception 'Only the assigned verifier can verify a task';
      end if;
      new.verified_at = coalesce(new.verified_at, now());
    else
      raise exception 'Invalid task status transition: % to %', old.status, new.status;
    end if;
  end if;

  if not public.is_admin() and not (public.is_partner() and old.created_by = auth.uid()) then
    if new.title is distinct from old.title
      or new.description is distinct from old.description
      or new.client_id is distinct from old.client_id
      or new.created_by is distinct from old.created_by
      or new.doer_id is distinct from old.doer_id
      or new.verifier_id is distinct from old.verifier_id
      or new.deadline is distinct from old.deadline
      or new.priority is distinct from old.priority
      or new.started_at is distinct from old.started_at
      or new.completed_at is distinct from old.completed_at
      or new.verified_at is distinct from old.verified_at
    then
      raise exception 'Assigned users can only update task status';
    end if;
  end if;

  return new;
end;
$$;

create trigger tasks_enforce_workflow
before insert or update on public.tasks
for each row execute function public.enforce_task_workflow();

create or replace function public.log_task_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.task_logs(firm_id, task_id, action, user_id, remarks)
    values (new.firm_id, new.id, 'created', auth.uid(), 'Task created');

    insert into public.notifications(firm_id, user_id, message)
    values
      (new.firm_id, new.doer_id, 'New task assigned: ' || new.title),
      (new.firm_id, new.verifier_id, 'Verification assigned: ' || new.title);

    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.task_logs(firm_id, task_id, action, user_id, remarks)
    values (new.firm_id, new.id, 'status_changed', auth.uid(), old.status || ' -> ' || new.status);

    insert into public.notifications(firm_id, user_id, message)
    values (
      new.firm_id,
      new.created_by,
      'Task status changed: ' || new.title || ' is now ' || replace(new.status::text, '_', ' ')
    );
  end if;

  return new;
end;
$$;

create trigger tasks_log_events
after insert or update on public.tasks
for each row execute function public.log_task_events();

create or replace function public.enforce_attendance_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.firm_id is distinct from old.firm_id
    or new.user_id is distinct from old.user_id
    or new.attendance_date is distinct from old.attendance_date
    or new.check_in is distinct from old.check_in
    or new.latitude is distinct from old.latitude
    or new.longitude is distinct from old.longitude
  then
    raise exception 'Attendance identity, check-in, and location cannot be changed';
  end if;

  if old.check_out is not null and new.check_out is distinct from old.check_out then
    raise exception 'Attendance check-out cannot be changed after it is set';
  end if;

  return new;
end;
$$;

create trigger attendance_enforce_update
before update on public.attendance
for each row execute function public.enforce_attendance_update();

create or replace function public.set_notification_read_at()
returns trigger
language plpgsql
as $$
begin
  if new.firm_id is distinct from old.firm_id
    or new.user_id is distinct from old.user_id
    or new.message is distinct from old.message
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Only notification read state can be changed';
  end if;

  if new.is_read and old.is_read is false then
    new.read_at = coalesce(new.read_at, now());
  elsif new.is_read is false then
    new.read_at = null;
  end if;

  return new;
end;
$$;

create trigger notifications_set_read_at
before update on public.notifications
for each row execute function public.set_notification_read_at();

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

create or replace function public.create_team_member_profile(
  p_registration_code text,
  p_full_name text,
  p_member_designation text,
  p_member_mobile text
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  target_firm_id uuid;
  profile public.users;
begin
  if auth.uid() is null then
    raise exception 'Must be authenticated';
  end if;

  if exists (select 1 from public.users where id = auth.uid()) then
    raise exception 'Profile already exists';
  end if;

  if p_registration_code !~ '^[0-9]{10}$' then
    raise exception 'Registration code must be exactly 10 digits';
  end if;

  select id
  into target_firm_id
  from public.firms
  where firms.registration_code = p_registration_code;

  if target_firm_id is null then
    raise exception 'Invalid registration code';
  end if;

  insert into public.users(id, firm_id, name, role, designation, mobile)
  values (auth.uid(), target_firm_id, p_full_name, 'employee', p_member_designation, p_member_mobile)
  returning * into profile;

  return profile;
end;
$$;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.create_registration_code(text, text) to authenticated;
grant execute on function public.get_owner_firm_summaries() to authenticated;
grant execute on function public.create_firm_and_admin(text, text, text, text, text, text) to authenticated;
grant execute on function public.create_team_member_profile(text, text, text, text) to authenticated;
grant execute on function public.current_firm_id() to authenticated;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_platform_owner() to authenticated;

create table if not exists public.register_otps (
  email text primary key,
  otp text not null,
  expires_at timestamptz not null
);

grant all on public.register_otps to anon, authenticated, service_role;

create or replace function public.create_partner_profile(
  p_registration_code text,
  p_full_name text,
  p_member_mobile text
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  target_firm_id uuid;
  profile public.users;
begin
  if auth.uid() is null then
    raise exception 'Must be authenticated';
  end if;

  if exists (select 1 from public.users where id = auth.uid()) then
    raise exception 'Profile already exists';
  end if;

  if p_registration_code !~ '^[0-9]{10}$' then
    raise exception 'Registration code must be exactly 10 digits';
  end if;

  select id
  into target_firm_id
  from public.firms
  where firms.registration_code = p_registration_code;

  if target_firm_id is null then
    raise exception 'Invalid registration code';
  end if;

  insert into public.users(id, firm_id, name, role, mobile)
  values (auth.uid(), target_firm_id, p_full_name, 'partner', p_member_mobile)
  returning * into profile;

  return profile;
end;
$$;

grant execute on function public.create_partner_profile(text, text, text) to authenticated;
CREATE POLICY "Allow anon insert" ON "public"."register_otps" AS PERMISSIVE FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update" ON "public"."register_otps" AS PERMISSIVE FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon select" ON "public"."register_otps" AS PERMISSIVE FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon delete" ON "public"."register_otps" AS PERMISSIVE FOR DELETE TO anon USING (true);
alter table public.register_otps enable row level security;
