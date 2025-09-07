Här är ett förslag på en `TECHSTACK.md` som beskriver teknikvalet och processen för att utveckla och distribuera ett Cloudflare Pages + Functions-projekt.

# Tech Stack & Deployment Guide

Detta dokument beskriver den tekniska stacken och tillvägagångssättet för att utveckla, testa och distribuera ett projekt som använder **Cloudflare Pages** tillsammans med **Pages Functions** för att bygga en fullstack-applikation (frontend + backend i samma repo).

---

## 1. Översikt

### **Mål**
- Bygga moderna webbappar med **React (Vite)** för frontend.
- Implementera backend-endpoints direkt i samma projekt via **Cloudflare Pages Functions**.
- Köra allt **serverless** på Cloudflares globala edge-nätverk för låg latens och enkel drift.
- Minimera behovet av serverhantering, CORS och komplexa deployflöden.

### **Teknikval**
| Komponent          | Vald teknik                  | Motiv |
|--------------------|------------------------------|-------|
| **Frontend**       | React + Vite                  | Snabb utveckling, moderna features. |
| **Backend/API**    | Cloudflare Pages Functions (TypeScript) | Edge-nära serverless, samma origin som frontend. |
| **Routing/Framework** | Hono (för komplexare API) | Lättviktigt, känns likt FastAPI/Express. |
| **Databas**        | Cloudflare D1                 | Serverless SQL (SQLite), enkel att starta med. |
| **Cache/Config**   | Cloudflare KV                 | Snabba key-value reads globalt. |
| **CI/CD**          | Cloudflare Git Integration eller Wrangler + GitHub Actions | Enkel och automatiserad deploy. |
| **Paketmanager**   | pnpm                          | Effektiv hantering av monorepos. |

---

## 2. Struktur

Projektet är ett **monorepo per app**, med frontend och API i samma katalog.


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

## 3. Lokalt utvecklingsflöde

### **Installera**
```bash
pnpm install
````

### **Starta dev-server**

Två processer:

1. **Vite (frontend med hot reload):**

   ```bash
   cd apps/web
   pnpm dev
   ```

   Startar på `http://localhost:5173`

2. **Cloudflare Pages Functions (backend):**

   ```bash
   cd apps/web
   npx wrangler pages dev --proxy 5173
   ```

   Startar på `http://127.0.0.1:8788`

**Resultat:**

* Frontend: `http://127.0.0.1:8788`
* API: `http://127.0.0.1:8788/api/healthz`

---

## 4. Deploy till Cloudflare

### **Alternativ A: Git-integration (enklast)**

1. Gå till **Cloudflare Dashboard → Pages → Create Project**.
2. Välj ditt GitHub-repo.
3. Inställningar:

   * **Root directory:** `apps/web`
   * **Build command:** `pnpm i && pnpm build`
   * **Output directory:** `dist`
4. Deploy startar automatiskt.

**Bindings & miljövariabler:**

* Gå till **Settings → Functions → Bindings** och lägg till t.ex. `DB` för D1 eller `CACHE` för KV.
* Miljövariabler (t.ex. API-nycklar) hanteras under **Settings → Environment Variables**.

---

### **Alternativ B: CLI-deploy**

1. Logga in med Wrangler:

   ```bash
   npx wrangler login
   ```
2. Bygg frontend:

   ```bash
   cd apps/web
   pnpm build
   ```
3. Deploya manuellt:

   ```bash
   npx wrangler pages deploy ./dist --project-name=my-app-web
   ```

---

## 5. API med Pages Functions

### Minimal endpoint

```ts
// functions/api/healthz.ts
export const onRequestGet: PagesFunction = async () => {
  return new Response('ok', { headers: { 'content-type': 'text/plain' } })
}
```

### Med Hono

```ts
// functions/api/index.ts
import { Hono } from 'hono'
const app = new Hono()

app.get('/hello', c => c.json({ message: 'Hello World' }))
app.get('/users', c => c.json([{ id: 1, name: 'Alice' }]))

export const onRequest: PagesFunction = (context) => app.fetch(context.request)
```

---

## 6. Databas & lagring (Cloudflare bindings)

| Tjänst | Binding | Användning          |
| ------ | ------- | ------------------- |
| **D1** | `DB`    | Relationsdata (SQL) |
| **KV** | `CACHE` | Key-value lagring   |
| **R2** | `FILES` | Filuppladdningar    |

Exempel:

```ts
export const onRequestGet: PagesFunction<{ Bindings: { DB: D1Database } }> = async (ctx) => {
  const { results } = await ctx.env.DB.prepare('SELECT * FROM users').all()
  return Response.json(results)
}
```

---

## 7. Fördelar med denna lösning

* **En deploy för hela appen**: Frontend och backend deployas tillsammans.
* **Ingen CORS**: API ligger under samma origin som frontend.
* **Skalar globalt automatiskt**: Cloudflare edge tar hand om distributionen.
* **Låga kostnader**: Generös gratisnivå, betala bara när trafiken växer.
* **Enkel arkitektur**: Mindre rörliga delar än separata Workers/servrar.

---

## 8. Nästa steg

* Lägg till testmiljöer via Pages Preview Deployments.
* Integrera **CI/CD** via GitHub Actions om du behöver mer kontroll.
* Bygg ut backend med D1, KV eller Durable Objects när komplexiteten växer.

---

```
```
