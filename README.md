# Love1

## AI / Agent Quick Start

If you are an AI assistant or coding agent working in this repository, read these first:

1. `AGENTS.md`
2. `docs/project-memory.md`

These two files are the project handoff source of truth:

- what this project is
- where the public site / admin / API live
- where media is stored
- how deployment is wired
- what platform settings must be changed after code changes
- which files are high-risk and should be edited carefully

## Project Overview

Love1 is a couple-themed memorial / relationship website with three main parts:

- Public site: `you-and-me.html`
- Admin panel: `admin/`
- API server: `server/`

It includes:

- home page
- anniversaries and calendar
- album and media uploads
- music and playlists
- heart-garden romantic code showcase
- couple entrance login
- theme and privacy settings

## Current Online Deployment

- Public site: Cloudflare Pages
- Admin site: Cloudflare Pages
- API: Render Web Service
- Database: TiDB Cloud (MySQL compatible)
- Object storage: Cloudflare R2
- Main domain: `likeu.love`
- API domain: `api.likeu.love`
- Admin domain: `admin.likeu.love`
- Media domain: `media.likeu.love`

## Repository Structure

```text
love1/
  admin/                    Vue 3 + Vite admin panel
  server/                   NestJS API + Prisma
  docs/                     deployment notes and project memory
  scripts/                  front-end build helpers
  render.yaml               Render deployment config
  you-and-me.html           main public site
  config.example.js         front-end API base config
  package.json              workspace root
```

## Local Development

Install dependencies:

```bash
npm install
```

Useful commands:

```bash
npm run dev:web
npm --workspace admin run dev
npm --workspace server run start:dev
```

Build commands:

```bash
npm run build:web
npm --workspace admin run build
npm --workspace server run build
```

## Important Notes

- The public site is not a typical SPA. Most front-end behavior is in `you-and-me.html`.
- Uploaded media should go to Cloudflare R2, not back into DB blobs or base64.
- Do not re-enable automatic seed-on-start. It previously overwrote user content.
- If you change environment variables, build commands, domains, storage rules, or API base URLs, you must also tell the user which deployment platform settings need to be updated.

For full project memory and historical context, read:

- `docs/project-memory.md`
- `AGENTS.md`
