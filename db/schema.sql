-- CashTrack schema
-- Run this once against your Supabase Postgres database.

create extension if not exists pgcrypto;

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  name          text,
  password_hash text not null,
  currency      text not null default 'THB',
  created_at    timestamptz not null default now()
);

create table if not exists categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  name       text not null,
  type       text not null check (type in ('income','expense')),
  color      text not null default '#64748b',
  created_at timestamptz not null default now(),
  unique (user_id, name, type)
);

create table if not exists transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  type        text not null check (type in ('income','expense')),
  amount      numeric(14,2) not null check (amount > 0),
  category    text,
  note        text,
  method      text not null default 'cash' check (method in ('cash','online')),
  occurred_on date not null default current_date,
  created_at  timestamptz not null default now()
);

-- Add `method` to databases created before this column existed.
alter table transactions
  add column if not exists method text not null default 'cash'
  check (method in ('cash','online'));

create index if not exists idx_tx_user_date on transactions (user_id, occurred_on desc);
create index if not exists idx_tx_user_type on transactions (user_id, type);
create index if not exists idx_tx_user_method on transactions (user_id, method);

-- Monthly spending limit per expense category.
create table if not exists budgets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  category   text not null,
  amount     numeric(14,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category)
);

-- Auto-repeating transactions (salary, rent, subscriptions, …).
create table if not exists recurring (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  type       text not null check (type in ('income','expense')),
  amount     numeric(14,2) not null check (amount > 0),
  category   text,
  note       text,
  frequency  text not null check (frequency in ('daily','weekly','monthly','yearly')),
  method     text not null default 'cash' check (method in ('cash','online')),
  next_run   date not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- Add `method` to databases created before this column existed.
alter table recurring
  add column if not exists method text not null default 'cash'
  check (method in ('cash','online'));

create index if not exists idx_recurring_due on recurring (user_id, active, next_run);

-- Money-split plan: how to divide income into buckets (e.g. 50/30/20).
create table if not exists split_buckets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  name       text not null,
  percent    numeric(5,2) not null check (percent >= 0 and percent <= 100),
  color      text not null default '#4f46e5',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_split_user on split_buckets (user_id, sort_order);

-- Period cut-offs ("ตัดยอด"). Balances only count transactions recorded after
-- the latest cut-off; everything recorded before it is treated as "the safe".
-- Transactions are never deleted, so history and monthly/yearly totals stay intact.
create table if not exists closings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  closed_at  timestamptz not null default now()
);

create index if not exists idx_closings_user on closings (user_id, closed_at desc);
