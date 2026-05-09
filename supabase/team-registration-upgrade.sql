alter table public.users
  add column if not exists designation text,
  add column if not exists mobile text;

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

grant execute on function public.create_team_member_profile(text, text, text, text) to authenticated;
