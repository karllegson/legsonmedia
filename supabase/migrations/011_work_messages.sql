-- Work portal team messaging (group chats)

create table if not exists public.work_message_threads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.work_message_members (
  thread_id uuid not null references public.work_message_threads (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create index if not exists work_message_members_user_id_idx
  on public.work_message_members (user_id);

create table if not exists public.work_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.work_message_threads (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists work_messages_thread_id_created_at_idx
  on public.work_messages (thread_id, created_at);

alter table public.work_message_threads enable row level security;
alter table public.work_message_members enable row level security;
alter table public.work_messages enable row level security;

create or replace function public.is_work_thread_member(p_thread_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.work_message_members
    where thread_id = p_thread_id
      and user_id = auth.uid()
  );
$$;

create policy "Members read own threads"
  on public.work_message_threads for select
  using (public.is_work_thread_member(id));

create policy "Authenticated create threads"
  on public.work_message_threads for insert
  with check (auth.uid() = created_by);

create policy "Members update own threads"
  on public.work_message_threads for update
  using (public.is_work_thread_member(id))
  with check (public.is_work_thread_member(id));

create policy "Members read thread membership"
  on public.work_message_members for select
  using (public.is_work_thread_member(thread_id) or user_id = auth.uid());

create policy "Authenticated join threads they create"
  on public.work_message_members for insert
  with check (
    auth.uid() = user_id
    or exists (
      select 1
      from public.work_message_threads t
      where t.id = thread_id
        and t.created_by = auth.uid()
    )
  );

create policy "Members update own membership"
  on public.work_message_members for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Members read messages"
  on public.work_messages for select
  using (public.is_work_thread_member(thread_id));

create policy "Members send messages"
  on public.work_messages for insert
  with check (
    sender_id = auth.uid()
    and public.is_work_thread_member(thread_id)
  );
