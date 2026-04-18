# LeaveFlow — Leave Management Platform (v3)

Paperless, multi-level leave approval built with Next.js 15, Tailwind CSS, and Supabase.

## What changed in v3
- **Theme:** Full green & white design system (replaces dark navy/gold)
- **Approval flow:** 2-step only — Staff → Dept Head → HR (shift head/supervisor removed)
- **All pages** updated: login, dashboard, apply, status, approvals, history, settings, team

## Approval flow

```
Staff submits → pending_dept_head
  ↓ Dept Head approves
pending_hr
  ↓ HR approves
approved ✅

Any level rejects → rejected ❌
```

## Tech stack

| Layer    | Technology                      |
|----------|---------------------------------|
| Frontend | Next.js 15 (App Router)         |
| Styling  | Tailwind CSS (green/white theme)|
| Backend  | Next.js Server Actions          |
| Database | Supabase (PostgreSQL)           |
| Auth     | Supabase Auth                   |
| Realtime | Supabase Realtime               |

## Quick start

```bash
# 1. Install
npm install

# 2. Set up Supabase
# Go to supabase.com → SQL Editor → paste supabase/schema.sql → Run

# 3. Environment
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Run
npm run dev
```

## User roles

| Role       | Access                                                  |
|------------|--------------------------------------------------------|
| `staff`    | Apply, view own requests, history                       |
| `dept_head`| All staff + approve/reject as step 1                   |
| `hr`       | All staff + approve/reject as step 2 + full HR view     |
| `admin`    | Everything                                              |

## Set roles in Supabase

```sql
update profiles set role = 'dept_head' where email = 'manager@company.com';
update profiles set role = 'hr'        where email = 'hr@company.com';
```

## Seed leave balances

```sql
select seed_leave_balances('<staff-uuid-here>');
```

## Project structure

```
leaveflow/
├── app/
│   ├── (auth)/login/         Login page
│   ├── (dashboard)/
│   │   ├── layout.tsx        Shell (sidebar + topbar)
│   │   ├── dashboard/        Home with stats + approval tracker
│   │   ├── apply/            Leave application form
│   │   ├── status/[id]/      Dynamic request status page
│   │   ├── approvals/        Queue for dept_head and hr
│   │   ├── history/          Full leave history with filters
│   │   ├── settings/         Profile + preferences
│   │   └── team/             Team leave calendar
│   ├── actions/
│   │   ├── auth.ts           Login / logout
│   │   ├── leave.ts          Submit / approve / reject
│   │   └── notifications.ts  Fetch / mark read
│   └── globals.css           Green/white design system
├── components/
│   ├── ui/                   Badge, Card, Button
│   ├── sidebar/              Responsive sidebar
│   ├── layout/               Topbar, BottomNav, NotificationBell
│   ├── dashboard/            StatCard, ApprovalChain, MiniStepper
│   ├── apply/                LeaveTypeGrid, ApprovalRoute, ApplyForm
│   ├── approvals/            ApprovalQueueClient
│   └── history/              HistoryClient
├── lib/
│   ├── types.ts              All TypeScript types (2-step flow)
│   ├── utils.ts              Helpers (nextStatus, roleToApprovalLevel)
│   ├── auth.ts               requireProfile, getUnreadCount, getPendingCount
│   └── supabase/             client.ts + server.ts
├── middleware.ts              Route protection
└── supabase/schema.sql       Full DB schema (run this first)
```
