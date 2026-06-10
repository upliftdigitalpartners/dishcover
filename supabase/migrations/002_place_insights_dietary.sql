-- Adds dietary accommodation signals (halal/kosher/vegetarian/vegan) to the
-- insights store. Backfills existing rows to an empty array. Idempotent.
-- Run manually in the Supabase SQL editor, after 001.

alter table place_insights
  add column if not exists dietary jsonb not null default '[]';
