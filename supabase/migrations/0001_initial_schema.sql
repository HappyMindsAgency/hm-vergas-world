-- Verga's World — schema iniziale (contratto congelato, brief §5).
-- RLS attiva su OGNI tabella. I dati alunno si scrivono solo via service_role
-- (API route server-side): per il client anon/authenticated valgono le policy qui.
-- service_role bypassa RLS by design.

-- ---------- Enums ----------
create type user_role        as enum ('admin', 'teacher');
create type profile_status   as enum ('active', 'inactive', 'disabled');
create type video_source     as enum ('youtube', 'asset');
create type material_category as enum ('prima_visita', 'percorsi_tematici', 'dopo_visita');

-- ====================================================================
-- Identità & strutture
-- ====================================================================
create table institutes (
  id    uuid primary key default gen_random_uuid(),
  nome  text not null,
  citta text not null
);

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          user_role not null,
  nome          text not null,
  cognome       text not null,
  email         text not null unique,
  institute_id  uuid references institutes(id) on delete set null,
  status        profile_status not null default 'active',
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);

create table classes (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references profiles(id) on delete cascade,
  institute_id uuid not null references institutes(id) on delete restrict,
  nome         text not null,                       -- es. "3B"
  anno         int  not null,
  access_code  text not null unique,                -- es. "3B-GARIBALDI-2026" (suffisso -2.. su collisione)
  created_at   timestamptz not null default now()
);
create index classes_teacher_idx on classes(teacher_id);

create table students (
  id               uuid primary key default gen_random_uuid(),
  class_id         uuid not null references classes(id) on delete cascade,
  display_name     text not null,                   -- es. "Marco R."
  created_at       timestamptz not null default now(),
  last_activity_at timestamptz,
  unique (class_id, display_name)                   -- login = access_code + display_name deve essere univoco in classe
);
create index students_class_idx on students(class_id);

-- ====================================================================
-- Contenuti (gestiti da Admin, consumati da Docenti/Alunni)
-- ====================================================================
create table stories (
  id      uuid primary key default gen_random_uuid(),
  numero  int not null unique check (numero between 1 and 7),
  titolo  text not null,
  sinossi text,
  images  jsonb not null default '[]'
);

create table characters (
  id          uuid primary key default gen_random_uuid(),
  story_id    uuid not null references stories(id) on delete cascade,
  nome        text not null,
  soprannome  text,
  descrizione text,
  immagine    text
);

create table videos (
  id          uuid primary key default gen_random_uuid(),
  story_id    uuid not null references stories(id) on delete cascade,
  titolo      text not null,
  source_type video_source not null,
  url_or_path text not null
);

create table quizzes (
  id       uuid primary key default gen_random_uuid(),
  story_id uuid not null unique references stories(id) on delete cascade  -- 1:1 con storia
);

create table quiz_questions (
  id      uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  testo   text not null,
  ordine  int  not null,
  unique (quiz_id, ordine)
);

create table quiz_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references quiz_questions(id) on delete cascade,
  testo       text not null,
  is_correct  boolean not null default false
);

-- ====================================================================
-- Progressi alunni (scritti solo via service_role lato server)
-- ====================================================================
create table student_quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references students(id) on delete cascade,
  quiz_id      uuid not null references quizzes(id) on delete cascade,
  score        int  not null,
  passed       boolean not null default false,
  completed_at timestamptz not null default now()
);
create index sqa_student_idx on student_quiz_attempts(student_id);
-- Un quiz superato non è ripetibile: al massimo un attempt passed per (student, quiz).
create unique index sqa_one_pass_idx on student_quiz_attempts(student_id, quiz_id) where passed;

create table student_badges (
  student_id uuid not null references students(id) on delete cascade,
  story_id   uuid not null references stories(id) on delete cascade,
  earned_at  timestamptz not null default now(),
  primary key (student_id, story_id)
);

-- ====================================================================
-- Materiali
-- ====================================================================
create table materials (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  file_path   text not null,                        -- Supabase Storage
  category    material_category not null,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table material_assignments (
  material_id uuid not null references materials(id) on delete cascade,
  teacher_id  uuid not null references profiles(id) on delete cascade,
  primary key (material_id, teacher_id)
);

-- ====================================================================
-- Helper: ruolo admin (security definer per evitare ricorsione RLS).
-- Definita DOPO le tabelle: il body SQL referenzia `profiles`, che deve già esistere.
-- ====================================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ====================================================================
-- RLS — attiva ovunque
-- ====================================================================
alter table institutes            enable row level security;
alter table profiles              enable row level security;
alter table classes               enable row level security;
alter table students              enable row level security;
alter table stories               enable row level security;
alter table characters            enable row level security;
alter table videos                enable row level security;
alter table quizzes               enable row level security;
alter table quiz_questions        enable row level security;
alter table quiz_options          enable row level security;
alter table student_quiz_attempts enable row level security;
alter table student_badges        enable row level security;
alter table materials             enable row level security;
alter table material_assignments  enable row level security;

-- institutes: lettura a chi è loggato, scrittura admin.
create policy institutes_read  on institutes for select using (auth.role() = 'authenticated');
create policy institutes_admin on institutes for all    using (is_admin()) with check (is_admin());

-- profiles: ognuno vede/aggiorna la propria riga; admin vede e gestisce tutto.
create policy profiles_self_read   on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_self_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin       on profiles for all    using (is_admin()) with check (is_admin());

-- classes: il docente gestisce solo le proprie; admin lettura.
create policy classes_owner on classes for all    using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy classes_admin on classes for select using (is_admin());

-- students: il docente vede gli alunni delle proprie classi; admin lettura.
create policy students_owner on students for select using (
  exists (select 1 from classes c where c.id = students.class_id and c.teacher_id = auth.uid())
);
create policy students_admin on students for select using (is_admin());

-- contenuti: lettura per ogni utente loggato (i video sono visibili anche ai docenti, §9.2);
-- scrittura solo admin.
create policy stories_read  on stories  for select using (auth.role() = 'authenticated');
create policy stories_admin on stories  for all    using (is_admin()) with check (is_admin());
create policy chars_read    on characters for select using (auth.role() = 'authenticated');
create policy chars_admin   on characters for all    using (is_admin()) with check (is_admin());
create policy videos_read   on videos   for select using (auth.role() = 'authenticated');
create policy videos_admin  on videos   for all    using (is_admin()) with check (is_admin());
create policy quizzes_read  on quizzes  for select using (auth.role() = 'authenticated');
create policy quizzes_admin on quizzes  for all    using (is_admin()) with check (is_admin());
create policy qq_read       on quiz_questions for select using (auth.role() = 'authenticated');
create policy qq_admin      on quiz_questions for all    using (is_admin()) with check (is_admin());
create policy qo_read       on quiz_options   for select using (auth.role() = 'authenticated');
create policy qo_admin      on quiz_options   for all    using (is_admin()) with check (is_admin());

-- progressi: il docente legge i progressi dei propri alunni; admin lettura.
-- Le scritture avvengono solo via service_role (nessuna policy insert/update per il client).
create policy sqa_owner on student_quiz_attempts for select using (
  exists (
    select 1 from students s join classes c on c.id = s.class_id
    where s.id = student_quiz_attempts.student_id and c.teacher_id = auth.uid()
  )
);
create policy sqa_admin on student_quiz_attempts for select using (is_admin());
create policy badges_owner on student_badges for select using (
  exists (
    select 1 from students s join classes c on c.id = s.class_id
    where s.id = student_badges.student_id and c.teacher_id = auth.uid()
  )
);
create policy badges_admin on student_badges for select using (is_admin());

-- materiali: admin gestisce tutto; il docente vede solo quelli assegnati a lui.
create policy materials_admin on materials for all using (is_admin()) with check (is_admin());
create policy materials_assigned on materials for select using (
  exists (select 1 from material_assignments ma where ma.material_id = materials.id and ma.teacher_id = auth.uid())
);
create policy ma_admin on material_assignments for all    using (is_admin()) with check (is_admin());
create policy ma_owner on material_assignments for select using (teacher_id = auth.uid());
