-- Dish insights per place: a permanent, growing dataset (read-through store
-- that never expires, only goes stale). Never delete rows — refresh them.
-- Run manually in the Supabase SQL editor.

create table if not exists place_insights (
  place_id text primary key,
  name text not null,
  dishes jsonb not null default '[]',
  vibe text,
  price_level int,
  updated_at timestamptz not null default now()
);
