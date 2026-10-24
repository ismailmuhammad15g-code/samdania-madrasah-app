# Samdania Talimul Islam Madrasah website

This folder contains the Next.js public website and its API. It shares the existing Supabase project with the school management app.

## Supabase database setup

1. In the project root, keep `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`. The management app uses these same public project settings.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to those same values. These are public project credentials, not admin secrets.
3. Run the complete `supabase/schema.sql` in the selected Supabase project's SQL editor. It creates or upgrades the admissions, content, teacher, and storage structures, and applies the row-level security policies.

The school software login uses `VITE_ADMIN_EMAIL`, `VITE_ADMIN_PASSWORD`, and `VITE_AUTH_SALT` from the root `.env`. After those credentials are accepted, the software silently attempts to sign into Supabase Auth with that same email and password. To enable website administration, create a Supabase Auth user once with those same credentials and grant it the admin app-metadata claim below. Staff still enter their credentials only once, at the normal software login. Do not expose admission data by weakening database policies. In local development, the website API URL defaults to `http://localhost:3012`; deployments with separately hosted apps should set `VITE_MAIN_MADRASAH_API_URL` to the HTTPS website origin.

## Run locally

From this folder, install dependencies with `npm install`, then start the website on port 3012:

```sh
npm run dev -- --port 3012
```

The school management app runs separately from the repository root. Supabase is used for website data and its protected admin API; the software's own admin login is controlled by its `.env` values.

## Included

- Responsive English/Bengali public website, with separate admission (`/admission`) and teacher/about (`/about`) pages.
- Confirmed academic programs, class schedule, curriculum, subjects, admission eligibility and process, required documents, public contacts, and official social links.
- Public teacher directory backed by Supabase, with bilingual biography, role, education, subjects, profile photo, display order, and publishing controls in the management app.
- School-provided gallery images. The site discourages right-click and dragging, but public images cannot be fully protected from screenshots or browser-based saving.
- Admission request form backed by an isolated table. The public API validates submitted fields; database policies permit constrained public inserts while restricting admission reads and management to authorized administrators.
- Admin controls for bilingual website information, gallery image upload/removal, teacher profiles/photos, and admission request review/removal.
- Authenticated administration uses the public anon key plus the signed-in user's access token and database RLS. The application does not require or store a service-role key.
