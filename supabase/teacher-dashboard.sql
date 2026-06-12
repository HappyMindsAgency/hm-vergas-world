-- Profili insegnanti: estende auth.users.
create table if not exists teacher_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  class_name text,
  school_name text,
  created_at timestamptz default now()
);

alter table teacher_profiles enable row level security;

drop policy if exists "own profile" on teacher_profiles;
create policy "own profile" on teacher_profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Vista aggregata per il cruscotto.
-- Richiede adventure_codes(id, class_name, teacher_id, class_size)
-- e mission_completions(class_id, explorer_name, story_id, completed_at).
create or replace view class_progress as
select
  ac.id as class_id,
  ac.class_name,
  ac.teacher_id,
  ac.class_size,
  mc.explorer_name,
  count(mc.story_id) as missions_completed,
  max(mc.completed_at) as last_activity
from adventure_codes ac
left join mission_completions mc on mc.class_id = ac.id
group by ac.id, ac.class_name, ac.teacher_id, ac.class_size, mc.explorer_name;

-- Esempio policy sulle classi/codici se adventure_codes usa teacher_id.
alter table adventure_codes enable row level security;

drop policy if exists "teacher sees own adventure codes" on adventure_codes;
create policy "teacher sees own adventure codes" on adventure_codes
  for select
  using (auth.uid() = teacher_id);

alter table mission_completions enable row level security;

drop policy if exists "teacher sees own class completions" on mission_completions;
create policy "teacher sees own class completions" on mission_completions
  for select
  using (
    exists (
      select 1
      from adventure_codes ac
      where ac.id = mission_completions.class_id
        and ac.teacher_id = auth.uid()
    )
  );
