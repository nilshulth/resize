# Tech Stack & Deployment Guide

This document describes the technical stack and approach for developing, testing, and deploying a project that uses **Cloudflare Pages** together with **Pages Functions** to build a fullstack application (frontend + backend in the same repo).

---

## 1. Overview

### **Goals**
- Build modern web apps with **React (Vite)** for frontend.
- Implement backend endpoints directly in the same project via **Cloudflare Pages Functions**.
- Run everything **serverless** on Cloudflare's global edge network for low latency and simple operations.
- Minimize the need for server management, CORS, and complex deployment flows.

### **Technology Choices**
| Component          | Chosen Technology            | Reason |
|--------------------|------------------------------|--------|
| **Frontend**       | React + Vite                 | Fast development, modern features. |
| **Backend/API**    | Cloudflare Pages Functions (TypeScript) | Edge-close serverless, same origin as frontend. |
| **Routing/Framework** | Hono (for complex APIs)   | Lightweight, feels like FastAPI/Express. |
| **Database**       | Cloudflare D1                | Serverless SQL (SQLite), easy to get started. |
| **Cache/Config**   | Cloudflare KV                | Fast key-value reads globally. |
| **CI/CD**          | Cloudflare Git Integration or Wrangler + GitHub Actions | Simple and automated deployment. |
| **Package Manager** | pnpm                        | Efficient monorepo management. |

---

## 2. Structure

The project is a **monorepo per app**, with frontend and API in the same directory.


my-app/
├─ apps/
│  └─ web/                 # Frontend + API (Pages + Functions)
│     ├─ src/              # React/Vite frontend
│     ├─ functions/        # Backend endpoints (Pages Functions)
│     │   └─ api/
│     │       ├─ healthz.ts  -> GET /api/healthz
│     │       └─ hello.ts    -> GET /api/hello
│     └─ dist/             # Build output (genereras av Vite)
└─ package.json

````

---

## 3. Local Development Flow

### **Install**
```bash
pnpm install
```

### **Start dev server**

Two processes:

1. **Vite (frontend with hot reload):**

   ```bash
   cd apps/web
   pnpm dev
   ```

   Starts on `http://localhost:5173`

2. **Cloudflare Pages Functions (backend):**

   ```bash
   cd apps/web
   npx wrangler pages dev --proxy 5173
   ```

   Starts on `http://127.0.0.1:8788`

**Result:**

* Frontend: `http://127.0.0.1:8788`
* API: `http://127.0.0.1:8788/api/healthz`

---

## 4. Deploy to Cloudflare

### **Option A: Git integration (easiest)**

1. Go to **Cloudflare Dashboard → Pages → Create Project**.
2. Select your GitHub repo.
3. Settings:

   * **Root directory:** `apps/web`
   * **Build command:** `pnpm i && pnpm build`
   * **Output directory:** `dist`
4. Deploy starts automatically.

**Bindings & environment variables:**

* Go to **Settings → Functions → Bindings** and add e.g. `DB` for D1 or `CACHE` for KV.
* Environment variables (e.g. API keys) are managed under **Settings → Environment Variables**.

---

### **Option B: CLI deploy**

1. Login with Wrangler:

   ```bash
   npx wrangler login
   ```
2. Build frontend:

   ```bash
   cd apps/web
   pnpm build
   ```
3. Deploy manually:

   ```bash
   npx wrangler pages deploy ./dist --project-name=my-app-web
   ```

---

## 5. API with Pages Functions

### Minimal endpoint

```ts
// functions/api/healthz.ts
export const onRequestGet: PagesFunction = async () => {
  return new Response('ok', { headers: { 'content-type': 'text/plain' } })
}
```

### With Hono

```ts
// functions/api/index.ts
import { Hono } from 'hono'
const app = new Hono()

app.get('/hello', c => c.json({ message: 'Hello World' }))
app.get('/users', c => c.json([{ id: 1, name: 'Alice' }]))

export const onRequest: PagesFunction = (context) => app.fetch(context.request)
```

---

## 6. Database & Storage (Cloudflare bindings)

| Service | Binding | Usage               |
| ------- | ------- | ------------------- |
| **D1**  | `DB`    | Relational data (SQL) |
| **KV**  | `CACHE` | Key-value storage   |
| **R2**  | `FILES` | File uploads        |

Example:

```ts
export const onRequestGet: PagesFunction<{ Bindings: { DB: D1Database } }> = async (ctx) => {
  const { results } = await ctx.env.DB.prepare('SELECT * FROM users').all()
  return Response.json(results)
}
```

---

## 7. Benefits of this solution

* **One deploy for the entire app**: Frontend and backend are deployed together.
* **No CORS**: API is under the same origin as frontend.
* **Scales globally automatically**: Cloudflare edge handles distribution.
* **Low costs**: Generous free tier, pay only when traffic grows.
* **Simple architecture**: Fewer moving parts than separate Workers/servers.

---

## 8. Next steps

* Add test environments via Pages Preview Deployments.
* Integrate **CI/CD** via GitHub Actions if you need more control.
* Expand backend with D1, KV or Durable Objects as complexity grows.

---

```
```
