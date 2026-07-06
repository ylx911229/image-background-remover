# Image Background Remover

Next.js + Tailwind CSS MVP for an online image background remover.

## Features

- Upload JPG, PNG, and WebP images up to 10 MB
- Remove backgrounds through the Remove.bg API
- Preview original and processed images
- Download transparent PNG
- Export white or custom solid-color backgrounds in the browser
- No image storage in the app layer
- Cloudflare Pages native deployment with Pages Functions
- Google sign-in with login sessions stored in Cloudflare D1

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `REMOVEBG_API_KEY` in `.env.local` before using the background removal API in
Next.js dev mode. Pages Functions use Wrangler env vars, so copy
`.dev.vars.example` to `.dev.vars` for local Cloudflare testing.

For local Cloudflare Pages Function testing, build the static app and run it with Wrangler:

```bash
npm run build
npx wrangler d1 migrations apply image-background-remover-auth --local
npx wrangler pages dev out --port 8789
```

## Google Sign-In + D1

Create a D1 database and replace the placeholder `database_id` in
`wrangler.jsonc` with the id returned by Wrangler:

```bash
npx wrangler d1 create image-background-remover-auth
npx wrangler d1 migrations apply image-background-remover-auth --remote
```

Set production secrets in Cloudflare Pages:

```bash
npx wrangler pages secret put REMOVEBG_API_KEY --project-name=image-background-remover
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name=image-background-remover
```

The Google OAuth client must allow this redirect URI:

```text
https://your-domain.example/api/auth/google/callback
```

For local Pages testing, also allow:

```text
http://localhost:8789/api/auth/google/callback
```

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Cloudflare Pages

Use these settings for the native GitHub integration:

- Build command: `npm run build`
- Build output directory: `out`
- Production branch: `main`
- Runtime environment variables: `REMOVEBG_API_KEY`, `MAX_UPLOAD_MB`,
  `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- D1 binding: `DB`

## Docs

- [English MVP PRD](docs/image-background-remover-mvp-prd.md)
- [Chinese MVP PRD](docs/image-background-remover-mvp-prd-zh.md)
