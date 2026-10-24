-- Run in the selected Supabase project's SQL editor for setup or upgrades.
-- Admin access requires an Auth user's app_metadata.main_madrasah_admin = true.

create table if not exists public.admission_requests (
  id uuid primary key default gen_random_uuid(),
  student_name text not null check (char_length(student_name) between 1 and 120),
  student_age smallint,
  guardian_name text not null check (char_length(guardian_name) between 1 and 120),
  contact text not null check (char_length(contact) between 1 and 40),
  class_name text not null,
  message text not null default '' check (char_length(message) <= 1000),
  consent_accepted boolean not null check (consent_accepted),
  consent_at timestamptz not null default now(),
  status text not null default 'new'
    check (status in ('new', 'reviewed', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.admission_requests
  add column if not exists student_age smallint;

-- Keep historical values readable while the public form accepts only current programs.
alter table public.admission_requests
  drop constraint if exists admission_requests_class_name_check;
alter table public.admission_requests
  add constraint admission_requests_class_name_check check (class_name in (
    'Play', 'Nursery', 'Class 1', 'Class 2', 'Class 3',
    'Class 4', 'Class 5', 'Nazera', 'Hifz',
    'Najera', 'Kitab'
  ));

alter table public.admission_requests
  drop constraint if exists admission_requests_student_age_range_check;
alter table public.admission_requests
  add constraint admission_requests_student_age_range_check
    check (student_age is null or student_age between 5 and 10);

alter table public.admission_requests enable row level security;
revoke all on table public.admission_requests from anon, authenticated, service_role;
grant insert (
  student_name, student_age, guardian_name, contact, class_name, message, consent_accepted
) on table public.admission_requests to anon;
grant select, update, delete on table public.admission_requests to authenticated;

drop policy if exists "admission_requests_public_submit" on public.admission_requests;
create policy "admission_requests_public_submit"
  on public.admission_requests
  for insert
  to anon
  with check (
    consent_accepted = true
    and student_age between 5 and 10
    and class_name in (
      'Play', 'Nursery', 'Class 1', 'Class 2', 'Class 3',
      'Class 4', 'Class 5', 'Nazera', 'Hifz'
    )
  );

drop policy if exists "admission_requests_admin_manage" on public.admission_requests;
create policy "admission_requests_admin_manage"
  on public.admission_requests
  for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'main_madrasah_admin') = 'true')
  with check ((auth.jwt() -> 'app_metadata' ->> 'main_madrasah_admin') = 'true');

create table if not exists public.main_madrasah_content (
  content_key text primary key check (content_key in (
    'academic_en', 'academic_bn', 'admission_en', 'admission_bn'
  )),
  content_value text not null default '' check (char_length(content_value) <= 4000),
  updated_at timestamptz not null default now()
);

alter table public.main_madrasah_content enable row level security;
revoke all on table public.main_madrasah_content from anon, authenticated, service_role;
grant select on table public.main_madrasah_content to anon, authenticated;
grant insert, update on table public.main_madrasah_content to authenticated;

drop policy if exists "main_madrasah_content_public_read" on public.main_madrasah_content;
create policy "main_madrasah_content_public_read"
  on public.main_madrasah_content
  for select
  to anon, authenticated
  using (true);

drop policy if exists "main_madrasah_content_admin_manage" on public.main_madrasah_content;
create policy "main_madrasah_content_admin_manage"
  on public.main_madrasah_content
  for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'main_madrasah_admin') = 'true')
  with check ((auth.jwt() -> 'app_metadata' ->> 'main_madrasah_admin') = 'true');

create table if not exists public.teacher_profiles (
  id uuid primary key default gen_random_uuid(),
  name_en text not null check (char_length(name_en) between 1 and 120),
  name_bn text not null check (char_length(name_bn) between 1 and 120),
  role_en text not null check (char_length(role_en) between 1 and 120),
  role_bn text not null check (char_length(role_bn) between 1 and 120),
  qualification_en text not null default '' check (char_length(qualification_en) <= 500),
  qualification_bn text not null default '' check (char_length(qualification_bn) <= 500),
  subjects_en text not null default '' check (char_length(subjects_en) <= 300),
  subjects_bn text not null default '' check (char_length(subjects_bn) <= 300),
  bio_en text not null default '' check (char_length(bio_en) <= 4000),
  bio_bn text not null default '' check (char_length(bio_bn) <= 4000),
  photo_url text not null,
  photo_name text not null unique,
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.teacher_profiles enable row level security;
revoke all on table public.teacher_profiles from anon, authenticated, service_role;
grant select on table public.teacher_profiles to anon, authenticated;
grant insert, update, delete on table public.teacher_profiles to authenticated;

drop policy if exists "teacher_profiles_public_read" on public.teacher_profiles;
create policy "teacher_profiles_public_read"
  on public.teacher_profiles
  for select
  to anon, authenticated
  using (is_published);

drop policy if exists "teacher_profiles_admin_manage" on public.teacher_profiles;
create policy "teacher_profiles_admin_manage"
  on public.teacher_profiles
  for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'main_madrasah_admin') = 'true')
  with check ((auth.jwt() -> 'app_metadata' ->> 'main_madrasah_admin') = 'true');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'madrasah-gallery',
  'madrasah-gallery',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'teacher-profiles',
  'teacher-profiles',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "madrasah_gallery_public_read" on storage.objects;
create policy "madrasah_gallery_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'madrasah-gallery');

drop policy if exists "teacher_profiles_public_photo_read" on storage.objects;
create policy "teacher_profiles_public_photo_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'teacher-profiles');

drop policy if exists "main_madrasah_admin_storage_insert" on storage.objects;
create policy "main_madrasah_admin_storage_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id in ('madrasah-gallery', 'teacher-profiles')
    and (auth.jwt() -> 'app_metadata' ->> 'main_madrasah_admin') = 'true'
  );

drop policy if exists "main_madrasah_admin_storage_update" on storage.objects;
create policy "main_madrasah_admin_storage_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id in ('madrasah-gallery', 'teacher-profiles')
    and (auth.jwt() -> 'app_metadata' ->> 'main_madrasah_admin') = 'true'
  )
  with check (
    bucket_id in ('madrasah-gallery', 'teacher-profiles')
    and (auth.jwt() -> 'app_metadata' ->> 'main_madrasah_admin') = 'true'
  );

drop policy if exists "main_madrasah_admin_storage_delete" on storage.objects;
create policy "main_madrasah_admin_storage_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id in ('madrasah-gallery', 'teacher-profiles')
    and (auth.jwt() -> 'app_metadata' ->> 'main_madrasah_admin') = 'true'
  );
