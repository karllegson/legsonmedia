# Legson Media

Next.js website and WordPress-style admin CMS — cloned from the Elite Builders project backbone with all Elite branding and data removed.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4**
- **Supabase** (Postgres, Auth, Storage)
- **Monaco Editor** (admin HTML IDE)
- **@dnd-kit** (admin sortable lists)

## Quick start

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Admin: [http://localhost:3000/admin](http://localhost:3000/admin)  
With `BYPASS_ADMIN_AUTH=true` in `.env.local`, login is skipped in local dev.

## Supabase setup

1. Create a Supabase project.
2. Run migrations in `supabase/migrations/` (001–008) in order.
3. Add env vars from `.env.local.example`.
4. Create an admin user in Supabase Auth.
5. Optional: `npm run seed:media` to upload `public/images/home/*` to Storage.

## Admin dashboard

| Section | Status |
|---------|--------|
| Posts, categories, tags | Live (Supabase + local JSON fallback) |
| Media library | Live |
| Pages manager | Live |
| Service areas | Live |
| FAQs | Live |
| Analytics | Live |
| Contact submissions | Live |
| Site config | Live (localStorage) |
| Forms builder, reviews, SEO, users | UI scaffold |

## Customize your brand

1. `src/lib/site/config.ts` — business info, services, service areas, team
2. `src/lib/admin/config.ts` — admin site name and nav
3. `public/logo.png` — replace logo and favicons
4. `public/videos/hero.mp4` — replace hero video

## Revert to pre-clone state

If you only had the original README before this clone:

```bash
git checkout -- .
git clean -fd
```

This removes all cloned files and restores the one-line README.

## Deploy

Deploy to Vercel with Supabase env vars. Set `BYPASS_ADMIN_AUTH=false` (or remove it) in production.
