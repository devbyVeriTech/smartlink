# Xoniq Smartlink

Public smartlink pages for Xoniq, served at **https://play.xoniq.pro**.

Standalone SvelteKit app that renders and tracks smart links:

- `/l/[slug]` — short-link redirect (records the click) and per-platform redirects `/l/[slug]/[platform]`
- `/[slug]` — the album-view landing page fans see
- `/api/preview` — iTunes track-preview proxy
- `/api/public/links/slug/[slug]` — public link JSON + pre-release gate/stream endpoints

It shares the same Neon PostgreSQL database as the main app (`links`, `analytics`,
`preReleaseEmails` tables) and writes click analytics there.

## Env

| Variable             | Purpose                                        | Example                  |
| -------------------- | ---------------------------------------------- | ------------------------ |
| `DATABASE_URL`       | Neon Postgres connection (shared with main)    | `postgres://...`         |
| `PUBLIC_LINKS_URL`   | This app's public URL                          | `https://play.xoniq.pro` |
| `PUBLIC_MAIN_URL`    | Main app URL (profile links, logo)             | `https://www.xoniq.pro`  |

## Dev

```bash
npm install
npm run dev
```

## Deploy

Deploy on Vercel (adapter-auto) and attach the `play.xoniq.pro` custom domain.
Set the env vars above in the project settings.