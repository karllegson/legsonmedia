-- Work portal: roles, clients, retainers, planning, tasks, time tracking

-- Extend profiles with role + active flag
alter table public.profiles
  add column if not exists role text not null default 'specialist'
    check (role in ('owner', 'operations_manager', 'specialist')),
  add column if not exists is_active boolean not null default true;

-- Helper: check if current user is OM or owner
create or replace function public.is_work_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
      and role in ('owner', 'operations_manager')
  );
$$;

-- Helper: check if current user is owner
create or replace function public.is_work_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
      and role = 'owner'
  );
$$;

-- Service categories
create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Clients
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Client retainers
create table if not exists public.client_retainers (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  hours_per_week numeric(6, 2) not null check (hours_per_week > 0),
  hourly_rate numeric(10, 2) not null check (hourly_rate >= 0),
  billing_period text not null default 'weekly'
    check (billing_period in ('weekly', 'monthly')),
  effective_from date not null default current_date,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_retainers_client_id_idx
  on public.client_retainers (client_id);

-- Weekly plans
create table if not exists public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  week_start date not null,
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, week_start)
);

create index if not exists weekly_plans_client_week_idx
  on public.weekly_plans (client_id, week_start desc);

-- Weekly plan service lines
create table if not exists public.weekly_plan_lines (
  id uuid primary key default gen_random_uuid(),
  weekly_plan_id uuid not null references public.weekly_plans (id) on delete cascade,
  service_category_id uuid not null references public.service_categories (id) on delete restrict,
  planned_hours numeric(6, 2) not null check (planned_hours >= 0),
  created_at timestamptz not null default now(),
  unique (weekly_plan_id, service_category_id)
);

-- Specialist allocations per plan
create table if not exists public.specialist_allocations (
  id uuid primary key default gen_random_uuid(),
  weekly_plan_id uuid not null references public.weekly_plans (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  service_category_id uuid not null references public.service_categories (id) on delete restrict,
  allocated_hours numeric(6, 2) not null check (allocated_hours >= 0),
  notes text,
  created_at timestamptz not null default now(),
  unique (weekly_plan_id, user_id, service_category_id)
);

create index if not exists specialist_allocations_user_idx
  on public.specialist_allocations (user_id);

-- Tasks
create table if not exists public.work_tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  assigned_to uuid not null references auth.users (id) on delete cascade,
  service_category_id uuid references public.service_categories (id) on delete set null,
  weekly_plan_id uuid references public.weekly_plans (id) on delete set null,
  title text not null,
  description text,
  estimated_hours numeric(6, 2) check (estimated_hours is null or estimated_hours >= 0),
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'done')),
  due_date date,
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists work_tasks_assigned_to_idx
  on public.work_tasks (assigned_to, status);

create index if not exists work_tasks_client_id_idx
  on public.work_tasks (client_id);

-- Time entries
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete restrict,
  task_id uuid references public.work_tasks (id) on delete set null,
  service_category_id uuid references public.service_categories (id) on delete set null,
  clock_in timestamptz not null default now(),
  clock_out timestamptz,
  duration_minutes int generated always as (
    case
      when clock_out is not null
        then greatest(0, (extract(epoch from (clock_out - clock_in)) / 60)::int)
      else null
    end
  ) stored,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists time_entries_user_id_idx
  on public.time_entries (user_id, clock_in desc);

create index if not exists time_entries_client_id_idx
  on public.time_entries (client_id, clock_in desc);

-- Only one open time entry per user
create unique index if not exists time_entries_one_open_per_user
  on public.time_entries (user_id)
  where clock_out is null;

-- Enable RLS
alter table public.service_categories enable row level security;
alter table public.clients enable row level security;
alter table public.client_retainers enable row level security;
alter table public.weekly_plans enable row level security;
alter table public.weekly_plan_lines enable row level security;
alter table public.specialist_allocations enable row level security;
alter table public.work_tasks enable row level security;
alter table public.time_entries enable row level security;

-- Profiles: managers can read all profiles
create policy "Managers can read all profiles"
  on public.profiles for select
  using (public.is_work_manager() or auth.uid() = id);

-- Service categories: all authenticated can read
create policy "Authenticated can read service categories"
  on public.service_categories for select
  to authenticated
  using (true);

create policy "Managers manage service categories"
  on public.service_categories for all
  to authenticated
  using (public.is_work_manager())
  with check (public.is_work_manager());

-- Clients
create policy "Authenticated can read active clients"
  on public.clients for select
  to authenticated
  using (is_active = true or public.is_work_manager());

create policy "Managers manage clients"
  on public.clients for all
  to authenticated
  using (public.is_work_manager())
  with check (public.is_work_manager());

-- Client retainers
create policy "Authenticated can read retainers"
  on public.client_retainers for select
  to authenticated
  using (true);

create policy "Managers manage retainers"
  on public.client_retainers for all
  to authenticated
  using (public.is_work_manager())
  with check (public.is_work_manager());

-- Weekly plans
create policy "Authenticated can read published plans"
  on public.weekly_plans for select
  to authenticated
  using (status = 'published' or public.is_work_manager());

create policy "Managers manage weekly plans"
  on public.weekly_plans for all
  to authenticated
  using (public.is_work_manager())
  with check (public.is_work_manager());

-- Weekly plan lines
create policy "Authenticated can read plan lines"
  on public.weekly_plan_lines for select
  to authenticated
  using (true);

create policy "Managers manage plan lines"
  on public.weekly_plan_lines for all
  to authenticated
  using (public.is_work_manager())
  with check (public.is_work_manager());

-- Specialist allocations
create policy "Users read own allocations"
  on public.specialist_allocations for select
  to authenticated
  using (user_id = auth.uid() or public.is_work_manager());

create policy "Managers manage allocations"
  on public.specialist_allocations for all
  to authenticated
  using (public.is_work_manager())
  with check (public.is_work_manager());

-- Work tasks
create policy "Users read own tasks"
  on public.work_tasks for select
  to authenticated
  using (assigned_to = auth.uid() or public.is_work_manager());

create policy "Users update own tasks"
  on public.work_tasks for update
  to authenticated
  using (assigned_to = auth.uid() or public.is_work_manager())
  with check (assigned_to = auth.uid() or public.is_work_manager());

create policy "Managers insert tasks"
  on public.work_tasks for insert
  to authenticated
  with check (public.is_work_manager());

create policy "Managers delete tasks"
  on public.work_tasks for delete
  to authenticated
  using (public.is_work_manager());

-- Time entries
create policy "Users read own time entries"
  on public.time_entries for select
  to authenticated
  using (user_id = auth.uid() or public.is_work_manager());

create policy "Users insert own time entries"
  on public.time_entries for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users update own time entries"
  on public.time_entries for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Managers read all time entries"
  on public.time_entries for select
  to authenticated
  using (public.is_work_manager());

-- Seed service categories
insert into public.service_categories (slug, name, sort_order) values
  ('website', 'Website', 1),
  ('seo', 'SEO', 2),
  ('marketing', 'Marketing', 3),
  ('social_media', 'Social Media', 4),
  ('photo', 'Photo', 5),
  ('video', 'Video', 6)
on conflict (slug) do nothing;

-- Seed clients
insert into public.clients (name, slug, notes) values
  ('Elite Builders', 'elite-builders', 'Framing and construction marketing client'),
  ('Deluna Electric', 'deluna-electric', 'Electrical services marketing client'),
  ('JC Air Academy', 'jc-air-academy', 'HVAC training academy marketing client')
on conflict (slug) do nothing;

-- Seed Elite Builders retainer (20 hrs/week @ $30)
insert into public.client_retainers (client_id, hours_per_week, hourly_rate, billing_period)
select c.id, 20, 30, 'weekly'
from public.clients c
where c.slug = 'elite-builders'
  and not exists (
    select 1 from public.client_retainers r where r.client_id = c.id
  );

-- Placeholder retainers for other clients (OM fills in)
insert into public.client_retainers (client_id, hours_per_week, hourly_rate, billing_period)
select c.id, 10, 30, 'weekly'
from public.clients c
where c.slug = 'deluna-electric'
  and not exists (
    select 1 from public.client_retainers r where r.client_id = c.id
  );

insert into public.client_retainers (client_id, hours_per_week, hourly_rate, billing_period)
select c.id, 10, 30, 'weekly'
from public.clients c
where c.slug = 'jc-air-academy'
  and not exists (
    select 1 from public.client_retainers r where r.client_id = c.id
  );
