-- Run this in Supabase Dashboard → SQL Editor

create table if not exists results_2d (
  id bigserial primary key,
  date text not null,
  session text not null,
  slot text not null,
  number text not null,
  set_val integer not null,
  value_val integer not null,
  set_index double precision not null,
  created_at timestamptz default now(),
  unique (date, slot)
);

create table if not exists results_3d (
  id bigserial primary key,
  date text not null unique,
  number text not null,
  draw_day integer not null,
  created_at timestamptz default now()
);

create table if not exists holidays (
  id bigserial primary key,
  date text not null unique,
  name text not null,
  name_mm text not null
);

create table if not exists kv_store (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

create index if not exists idx_results_2d_date on results_2d (date desc);

-- Public read access (anon key can read lottery data)
alter table results_2d enable row level security;
alter table results_3d enable row level security;
alter table holidays enable row level security;
alter table kv_store enable row level security;

create policy "Public read results_2d" on results_2d for select using (true);
create policy "Public read results_3d" on results_3d for select using (true);
create policy "Public read holidays" on holidays for select using (true);
create policy "Public read kv_store" on kv_store for select using (true);

-- Storage bucket: create "assets" in Dashboard → Storage → New bucket → Public
