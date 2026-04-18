-- ═══════════════════════════════════════════════════════════════
-- LeaveFlow — Complete Supabase Schema (v2)
-- 2-step approval flow: Staff → Dept Head → HR
-- Theme: Green & White
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ── ENUMS ────────────────────────────────────────────────────────

-- shift_head removed — 2-step flow only
create type user_role as enum ('staff', 'dept_head', 'hr', 'admin');

create type leave_type_name as enum (
  'annual', 'sick', 'maternity_paternity', 'emergency', 'casual'
);

-- pending_shift_head removed
create type leave_status as enum (
  'draft', 'pending_dept_head', 'pending_hr', 'approved', 'rejected'
);

create type approval_status as enum ('pending', 'approved', 'rejected');

create type notification_type as enum (
  'request_submitted', 'approval_required', 'approved',
  'rejected', 'request_fully_approved'
);

-- ── PROFILES ──────────────────────────────────────────────────────

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text not null,
  role        user_role not null default 'staff',
  department  text,
  shift       text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'staff')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── LEAVE TYPE CONFIG ─────────────────────────────────────────────

create table leave_type_config (
  id         uuid primary key default uuid_generate_v4(),
  name       leave_type_name not null unique,
  label      text not null,
  max_days   int  not null default 5,
  color      text default '#16a34a',
  icon       text default '📄',
  created_at timestamptz default now()
);

insert into leave_type_config (name, label, max_days, icon) values
  ('annual',              'Annual Leave',        20, '🌴'),
  ('sick',                'Sick Leave',          10, '🤒'),
  ('maternity_paternity', 'Maternity/Paternity', 90, '👶'),
  ('emergency',           'Emergency Leave',      3, '🚨'),
  ('casual',              'Casual Leave',         5, '☀️');

-- ── LEAVE REQUESTS ────────────────────────────────────────────────

create table leave_requests (
  id                  uuid primary key default uuid_generate_v4(),
  reference           text not null unique,
  staff_id            uuid not null references profiles(id),
  leave_type          leave_type_name not null,
  start_date          date not null,
  end_date            date not null,
  working_days        int  not null default 1,
  reason              text not null,
  handover_person_id  uuid references profiles(id),
  status              leave_status not null default 'pending_dept_head',
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),

  constraint valid_dates check (end_date >= start_date)
);

create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger leave_requests_updated_at
  before update on leave_requests
  for each row execute procedure update_updated_at();

-- ── APPROVALS ─────────────────────────────────────────────────────
-- level 1 = dept_head, level 2 = hr

create table approvals (
  id          uuid primary key default uuid_generate_v4(),
  request_id  uuid not null references leave_requests(id) on delete cascade,
  approver_id uuid references profiles(id),
  level       smallint not null check (level in (1, 2)),
  status      approval_status not null default 'pending',
  comment     text,
  acted_at    timestamptz,
  created_at  timestamptz default now(),

  unique (request_id, level)
);

-- ── LEAVE BALANCES ────────────────────────────────────────────────

create table leave_balances (
  id            uuid primary key default uuid_generate_v4(),
  staff_id      uuid not null references profiles(id) on delete cascade,
  leave_type    leave_type_name not null,
  year          int  not null default extract(year from now()),
  total_days    int  not null default 0,
  used_days     int  not null default 0,
  pending_days  int  not null default 0,

  unique (staff_id, leave_type, year)
);

alter table leave_balances
  add column remaining_days int generated always as (total_days - used_days - pending_days) stored;

-- ── NOTIFICATIONS ─────────────────────────────────────────────────

create table notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  request_id  uuid references leave_requests(id) on delete cascade,
  type        notification_type not null,
  message     text not null,
  read        boolean not null default false,
  created_at  timestamptz default now()
);

create index notifications_user_idx on notifications(user_id);
create index notifications_unread_idx on notifications(user_id, read);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────

alter table profiles        enable row level security;
alter table leave_requests  enable row level security;
alter table approvals       enable row level security;
alter table leave_balances  enable row level security;
alter table notifications   enable row level security;

-- profiles
create policy "profiles_select_all"  on profiles for select using (true);
create policy "profiles_update_own"  on profiles for update using (auth.uid() = id);

-- leave requests
create policy "requests_select" on leave_requests for select using (
  staff_id = auth.uid() or
  exists (select 1 from profiles where id = auth.uid() and role in ('dept_head','hr','admin'))
);
create policy "requests_insert" on leave_requests for insert with check (staff_id = auth.uid());
create policy "requests_update" on leave_requests for update using (
  exists (select 1 from profiles where id = auth.uid() and role in ('dept_head','hr','admin'))
);

-- approvals
create policy "approvals_select" on approvals for select using (
  exists (select 1 from leave_requests lr where lr.id = request_id and lr.staff_id = auth.uid()) or
  exists (select 1 from profiles where id = auth.uid() and role in ('dept_head','hr','admin'))
);
create policy "approvals_insert" on approvals for insert with check (true);
create policy "approvals_update" on approvals for update using (
  exists (select 1 from profiles where id = auth.uid() and role in ('dept_head','hr','admin'))
);

-- balances
create policy "balances_select" on leave_balances for select using (
  staff_id = auth.uid() or
  exists (select 1 from profiles where id = auth.uid() and role in ('hr','admin'))
);

-- notifications
create policy "notifications_select" on notifications for select using (user_id = auth.uid());
create policy "notifications_update" on notifications for update using (user_id = auth.uid());

-- ── SEED FUNCTION ─────────────────────────────────────────────────

create or replace function seed_leave_balances(
  p_staff_id uuid,
  p_year int default extract(year from now())::int
)
returns void as $$
begin
  insert into leave_balances (staff_id, leave_type, year, total_days) values
    (p_staff_id, 'annual',              p_year, 20),
    (p_staff_id, 'sick',                p_year, 10),
    (p_staff_id, 'maternity_paternity', p_year, 90),
    (p_staff_id, 'emergency',           p_year,  3),
    (p_staff_id, 'casual',              p_year,  5)
  on conflict (staff_id, leave_type, year) do nothing;
end;
$$ language plpgsql security definer;

-- ── USEFUL VIEWS ──────────────────────────────────────────────────

create view leave_requests_full as
  select
    lr.*,
    p.full_name     as staff_name,
    p.department    as staff_department,
    p.role          as staff_role_val,
    hp.full_name    as handover_name,
    ltc.label       as leave_type_label,
    ltc.icon        as leave_type_icon
  from leave_requests lr
  join profiles p         on p.id  = lr.staff_id
  left join profiles hp   on hp.id = lr.handover_person_id
  left join leave_type_config ltc on ltc.name = lr.leave_type;

create view pending_approvals_full as
  select
    a.*,
    lr.reference, lr.leave_type, lr.start_date, lr.end_date,
    lr.working_days, lr.reason, lr.status as request_status,
    p.full_name  as staff_name,
    p.department as staff_department,
    ltc.label    as leave_type_label
  from approvals a
  join leave_requests lr      on lr.id = a.request_id
  join profiles p             on p.id  = lr.staff_id
  left join leave_type_config ltc on ltc.name = lr.leave_type
  where a.status = 'pending';

-- ─────────────────────────────────────────────────────────────────
-- SETUP INSTRUCTIONS
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Create users via Auth → Users → Add User
-- 3. Set roles:
--    update profiles set role = 'dept_head' where email = 'manager@company.com';
--    update profiles set role = 'hr'        where email = 'hr@company.com';
-- 4. Seed balances:
--    select seed_leave_balances('<staff-uuid>');
-- ─────────────────────────────────────────────────────────────────
