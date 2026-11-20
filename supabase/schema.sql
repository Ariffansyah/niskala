-- Niskala: optional sync of non-sensitive summaries.
-- Requires Authentication > Sign In / Providers > "Allow anonymous sign-ins".
-- No video, landmarks or calibration data are ever stored here.

create table if not exists public.session_summaries (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  started_at timestamptz not null,
  updated_at timestamptz not null,
  active_s integer not null check (active_s >= 0),
  resets integer not null check (resets >= 0),
  slouch_s integer not null check (slouch_s >= 0),
  low_blink_s integer not null check (low_blink_s >= 0),
  late_s integer not null check (late_s >= 0),
  avg_blink real check (avg_blink is null or avg_blink between 0 and 120),
  source text not null check (source in ('camera', 'simulation'))
);

create table if not exists public.preferences (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  bedtime_min smallint not null check (bedtime_min between 0 and 1439),
  warmth text not null check (warmth in ('auto', 'on', 'off')),
  updated_at timestamptz not null default now()
);

alter table public.session_summaries enable row level security;
alter table public.preferences enable row level security;

-- Anonymous users get the `authenticated` role; each one sees and writes only its own rows.
create policy "own summaries" on public.session_summaries
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own preferences" on public.preferences
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
