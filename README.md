
# Samdania Talimul Islam Madrasah App and Website

This repository contains the madrasah app and the public website.

## Android App and Google AI Studio

This project includes an Android app originally associated with Google AI Studio.

AI Studio project:
https://ai.studio/apps/484f4098-19e7-4cc9-9ecf-e130319e05ec

### Run the Android App

Prerequisites: Android Studio.

1. Open Android Studio.
2. Select **Open** and choose the directory containing this project.
3. Allow Android Studio to resolve any project incompatibilities.
4. If the app requires a Gemini API key, create a local `.env` file and configure `GEMINI_API_KEY` according to the project configuration and `.env.example`.
5. Check `build.gradle.kts` for any project-specific signing configuration before running.
6. Run the app on an emulator or physical Android device.

Never commit API keys, passwords, or signing credentials to GitHub.

## Public Website

The project also contains the Next.js public website and its API. It shares the existing Supabase project with the school management app.

### Supabase Database Setup

1. Keep `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the root `.env` file if required by the management app.
2. Copy `.env.example` to `.env.local` when applicable and configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Review `supabase/schema.sql` and run it in the selected Supabase project's SQL editor only after confirming that it is appropriate for that database.

The school software may use `VITE_ADMIN_EMAIL`, `VITE_ADMIN_PASSWORD`, and `VITE_AUTH_SALT` from the root `.env`. Website administration should use authenticated access and database row-level security (RLS). Never expose admission data by weakening database policies, and never publish service-role keys.

In local development, the website API URL may default to `http://localhost:3012`. Deployments with separately hosted apps may need `VITE_MAIN_MADRASAH_API_URL` configured to the appropriate HTTPS origin.

### Run the Website Locally

From the website project directory, install dependencies:

```sh
npm install
```

Then start the website:

```sh
npm run dev -- --port 3012
```

The school management app runs separately from the repository root.

### Website Features

- Responsive English and Bengali public website.
- Admission page at `/admission`.
- Teacher and about page at `/about`.
- Public teacher directory backed by Supabase.
- Gallery image management.
- Admission request form and administrative review.
- Bilingual website information and teacher profile management.
- Authenticated administration using access tokens and database RLS.

Public images cannot be fully protected from screenshots or browser-based saving.

## Environment Files and Security

- Do not commit `.env`, `.env.local`, passwords, private API keys, or signing credentials.
- Use `.env.example` for placeholder configuration values only.
- Back up the project and database before making schema or deployment changes.
