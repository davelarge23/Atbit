# Atbit

AI-powered personal budget tracker. Next.js 16 · Supabase (Postgres, RLS, Auth) · Tailwind · Recharts · Google Gemini (AI Studio).

## Setup

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor.
2. In Supabase → Authentication → URL Configuration, add `http://localhost:3000/auth/callback` to the redirect URLs.
3. Copy `.env.example` to `.env.local` and fill in the Supabase URL + publishable key (and `GEMINI_API_KEY` for voice).
4. `npm install` then `npm run dev`.

Without `GEMINI_API_KEY`, the mic is disabled and typed quick-logs use a basic local parser.


