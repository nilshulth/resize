## Cloudflare Pages + Pages Functions: Architecture Guide for LLMs

This document explains the exact stack and structure used here so another LLM can reproduce it in new projects. It focuses on how the app is wired (frontend + API) rather than what the app does.

### Core idea
- Static frontend is built with React + Vite and deployed on Cloudflare Pages.
- Backend endpoints live in the same app using Cloudflare Pages Functions under `functions/` and are served from the same origin.
- No servers, no separate API host, minimal dependencies, TypeScript everywhere.

## Tech stack
- React 18 + Vite 5 (frontend build/dev)
- TypeScript 5
- Cloudflare Pages (hosting) + Pages Functions (serverless API at the edge)
- pnpm (workspace/monorepo friendly)
- No backend framework required; handlers are plain `PagesFunction`. (You may add Hono later if APIs grow.)

## Repository layout
```
apps/
  web/
    src/                   # React app (Vite)
      main.tsx
      App.tsx
      components/
    functions/             # Cloudflare Pages Functions (edge API)
      api/
        healthz.ts         # GET /api/healthz
        upload.ts          # POST /api/upload
    vite.config.ts
    package.json           # name: @resize/web
    dist/                  # Vite build output (deployed by Pages)
package.json               # workspace scripts (dev/build)
pnpm-workspace.yaml
```

Key points:
- Anything under `apps/web/functions` becomes a route. For example:
  - `functions/api/healthz.ts` → `GET /api/healthz`
  - `functions/api/upload.ts` → `POST /api/upload`
- Vite emits static assets to `apps/web/dist`. Cloudflare Pages serves that as the site root.

## Local development

Two processes are typical; you can run either one or both:

1) Frontend with Vite HMR
```bash
cd apps/web
pnpm dev
# Vite on http://localhost:5173
```

2) Unified origin (Pages + Functions + proxy to Vite)
```bash
cd apps/web
npx wrangler pages dev --proxy 5173
# Site + API on http://127.0.0.1:8788 (Pages Functions active)
```

In this setup, the frontend and API share the same origin locally, matching production and avoiding CORS.

## Routing model (Pages Functions)
- Each file in `functions/` maps to a path; subdirectories map to URL segments.
- Handlers are exported as `onRequest`, or verb-specific `onRequestGet`, `onRequestPost`, etc.
- `context` provides `request`, `env` (bindings), `params`, etc.

Minimal examples from this project:
```ts
// functions/api/healthz.ts → GET /api/healthz
export const onRequestGet: PagesFunction = async () => {
  return new Response(
    JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
    { headers: { 'content-type': 'application/json' } }
  )
}
```

```ts
// functions/api/upload.ts → POST /api/upload
export const onRequestPost: PagesFunction = async (context) => {
  const formData = await context.request.formData()
  const file = formData.get('file') as File | null
  if (!file) return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 })
  return Response.json({ success: true, file: { name: file.name, size: file.size, type: file.type } })
}
```

Notes for LLMs:
- Edge runtime: use Web Standard APIs (`Request`, `Response`, `fetch`, `FormData`, `File`, `ArrayBuffer`). Avoid Node-specific modules (no `fs`, no `Buffer` by default).
- TypeScript types: `PagesFunction` comes from the `@cloudflare/workers-types` ambient types provided by Pages (no explicit import needed in Functions code here).

## Build and deploy

Project-level scripts (root `package.json`):
```json
{
  "scripts": {
    "dev": "cd apps/web && pnpm dev",
    "build": "cd apps/web && pnpm build",
    "preview": "cd apps/web && pnpm preview"
  }
}
```

App-level scripts (`apps/web/package.json`):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

Cloudflare Pages configuration (via Dashboard → Pages → Create Project):
- Root directory: `apps/web`
- Build command: `pnpm i && pnpm build`
- Output directory: `dist`

Optional CLI deploy:
```bash
cd apps/web
pnpm build
npx wrangler pages deploy ./dist --project-name=<your-project-name>
```

## Bindings and environment
- If you add D1/KV/R2 bindings, define them in Pages → Settings → Functions → Bindings.
- Access them via `context.env.<BINDING_NAME>` in handlers.
- Example typing pattern:
```ts
type Env = { DB: D1Database }
export const onRequestGet: PagesFunction<{ Bindings: Env }> = async (ctx) => {
  const { results } = await ctx.env.DB.prepare('SELECT 1 as ok').all()
  return Response.json(results)
}
```

## Constraints and tips
- Keep handlers small and dependency-free where possible.
- Use `Response.json(data)` to return JSON; always set content-types for other responses.
- File uploads: use `formData()` and `File/ArrayBuffer` (Edge-native), not Node streams.
- Avoid CORS by keeping API under the same origin (default with Pages + Functions).

## Minimal recipe to replicate in a new project
1. Create `apps/<name>` with a Vite React app; configure build to `dist`.
2. Add `functions/` inside the same app; create files like `functions/api/healthz.ts` exporting `onRequestGet`.
3. Use `wrangler pages dev --proxy 5173` for local unified origin while developing with Vite.
4. Deploy via Cloudflare Pages with root `apps/<name>`, output `dist`.
5. Add bindings later if you need data/storage; keep handlers plain at first.


