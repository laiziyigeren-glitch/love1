# Love1 Agent Handoff

If you are an AI assistant, coding agent, or automation tool working in this repository, stop and read this file first.

## Read Order

Before changing anything, read these files in order:

1. `docs/project-memory.md`
2. `README.md`
3. `render.yaml`
4. `package.json`

If the task touches a specific area, also inspect:

- `you-and-me.html` for the public site
- `admin/src/App.vue` and `admin/src/api.ts` for the admin panel
- `server/src/modules/` for API logic
- `server/prisma/schema.prisma` for database structure
- `server/src/modules/storage.service.ts` for R2 / storage behavior

## Project Snapshot

- Public site: mostly a single-file front-end in `you-and-me.html`
- Admin panel: `admin/` (Vue 3 + Vite + Element Plus)
- API server: `server/` (NestJS + Prisma + MySQL-compatible database)
- Database: TiDB Cloud (MySQL compatible)
- Media storage: Cloudflare R2
- Public front-end deployment: Cloudflare Pages
- Admin deployment: Cloudflare Pages
- API deployment: Render Web Service
- Main domain: `likeu.love`
- API domain: `api.likeu.love`
- Admin domain: `admin.likeu.love`
- R2 media custom domain: `media.likeu.love`

## Non-Negotiable Rules

- This project is already online. Prefer small, surgical changes over refactors.
- Do not assume this is a standard SPA. The main public site is mostly in `you-and-me.html`.
- Do not re-enable automatic seed-on-start. This previously overwrote real user content.
- Media uploads should go to Cloudflare R2. Do not move uploads back into DB blobs or base64.
- Do not casually rename object storage folder conventions or object key prefixes. Existing URLs may already be live.
- Do not remove or reset user data unless the user explicitly asks.
- If you change anything deployment-related, tell the user exactly what must be updated manually.

## Deployment Change Checklist

If your code change touches any of the following, you must explicitly tell the user what to update:

- Render environment variables
- Render build / start commands
- Cloudflare Pages environment variables
- Cloudflare Pages build settings
- Cloudflare DNS / custom domains
- Cloudflare R2 CORS / custom domain / keys

If no deployment action is needed, say that clearly too.

## Data Ownership Rules

- Database stores structured content and settings.
- R2 stores uploaded images, audio, video, posters, and project assets.
- The front-end should reference media by URL, not inline base64, except for small intentional cases.
- Some historical data may still contain old inline / local values; do not "clean up" aggressively without checking impact.

## Validation Rules

Run only the relevant builds for the files you changed:

- Public front-end:
  - `npm run build:web`
- Admin panel:
  - `npm --workspace admin run build`
- Server:
  - `npm --workspace server run build`
- Prisma generation when schema / server types / storage flow changes:
  - `npm --workspace server run prisma:generate`

## Known High-Risk Areas

- Anniversary page sync between admin settings and front-end derived calendar data
- Music sync between songs, playlists, mood playlists, and front-end player state
- Couple entrance auth and upload permissions
- R2 upload purpose routing and object key folder conventions
- Front-end mobile behavior in `you-and-me.html`
- Heart Garden project assets and entry file handling

## Handoff Principle

When you finish work, tell the user:

1. what changed
2. what was validated
3. whether deployment settings must be changed
4. any remaining risks or manual checks

## Source of Truth

The long-term project memory lives here:

- `docs/project-memory.md`
- Free deployment / current deployment reference:
  - `docs/free-deploy.md`
- Security / data persistence notes:
  - `docs/security-hardening.md`
- Mobile adaptation notes:
  - `docs/mobile-adaptation-plan.md`
- Heart garden assets / lyrics planning:
  - `docs/heart-garden-assets-and-lyrics-plan.md`

If anything in code seems inconsistent with this file, trust the current code and update `docs/project-memory.md` after finishing.
