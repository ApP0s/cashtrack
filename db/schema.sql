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
  occurred_on date not null default current_date,
  created_at  timestamptz not null default now()
);

create index if not exists idx_tx_user_date on transactions (user_id, occurred_on desc);
create index if not exists idx_tx_user_type on transactions (user_id, type);
