drop policy if exists "partners can create firm tasks" on public.tasks;
drop policy if exists "admins and partners can create firm tasks" on public.tasks;

create policy "admins and partners can create firm tasks"
on public.tasks for insert
with check (
  firm_id = public.current_firm_id()
  and created_by = auth.uid()
  and public.current_app_role() in ('admin', 'partner')
  and status = 'created'
);

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
