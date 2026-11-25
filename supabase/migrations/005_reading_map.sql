-- Reading map: verse + aliyah open counts (additive).
-- Apply when ready — does not wipe user data.

-- ---------------------------------------------------------------------------
-- Verses the user has opened while reading
-- ---------------------------------------------------------------------------

create table if not exists reading_verse_opens (
  user_id uuid not null references profiles(id) on delete cascade,
  verse_ref text not null,
  open_count integer not null default 1,
  last_opened_at timestamptz not null default now(),
  primary key (user_id, verse_ref)
);

create index if not exists reading_verse_opens_user_idx
  on reading_verse_opens (user_id);

alter table reading_verse_opens enable row level security;

drop policy if exists "Users read own verse opens" on reading_verse_opens;
drop policy if exists "Users insert own verse opens" on reading_verse_opens;
drop policy if exists "Users update own verse opens" on reading_verse_opens;
drop policy if exists "Users delete own verse opens" on reading_verse_opens;

create policy "Users read own verse opens"
  on reading_verse_opens for select
  using (auth.uid() = user_id);

create policy "Users insert own verse opens"
  on reading_verse_opens for insert
  with check (auth.uid() = user_id);

create policy "Users update own verse opens"
  on reading_verse_opens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own verse opens"
  on reading_verse_opens for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on reading_verse_opens to authenticated;

-- ---------------------------------------------------------------------------
-- Aliyot the user has opened
-- ---------------------------------------------------------------------------

create table if not exists reading_aliyah_opens (
  user_id uuid not null references profiles(id) on delete cascade,
  aliyah_ref text not null,
  open_count integer not null default 1,
  last_opened_at timestamptz not null default now(),
  primary key (user_id, aliyah_ref)
);

create index if not exists reading_aliyah_opens_user_idx
  on reading_aliyah_opens (user_id);

alter table reading_aliyah_opens enable row level security;

drop policy if exists "Users read own aliyah opens" on reading_aliyah_opens;
drop policy if exists "Users insert own aliyah opens" on reading_aliyah_opens;
drop policy if exists "Users update own aliyah opens" on reading_aliyah_opens;
drop policy if exists "Users delete own aliyah opens" on reading_aliyah_opens;

create policy "Users read own aliyah opens"
  on reading_aliyah_opens for select
  using (auth.uid() = user_id);

create policy "Users insert own aliyah opens"
  on reading_aliyah_opens for insert
  with check (auth.uid() = user_id);

create policy "Users update own aliyah opens"
  on reading_aliyah_opens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own aliyah opens"
  on reading_aliyah_opens for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on reading_aliyah_opens to authenticated;
