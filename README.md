# Voice Test — LiveKit on Vercel

A minimal LiveKit voice room app (React + Vite frontend, serverless Express-style API) deployable to **Vercel** in one click.

## Project Structure

```
/
├── api/                    ← Vercel Serverless Functions
│   ├── token.js            ← POST /api/token  (generate LiveKit JWT)
│   └── index.js            ← GET  /api        (health check)
├── frontend/               ← React + Vite app
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/                ← Local dev Express server (NOT used on Vercel)
│   └── server.js
├── package.json            ← Root package (livekit-server-sdk for serverless)
└── vercel.json             ← Vercel build & routing config
```

## Deploy to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "chore: prepare for Vercel deployment"
git push
```

### 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects `vercel.json` — no framework preset needed
4. Click **Deploy**

### 3. Add Environment Variables

In your Vercel project → **Settings → Environment Variables**, add:

| Variable              | Value                              |
|-----------------------|------------------------------------|
| `LIVEKIT_URL`         | `wss://your-project.livekit.cloud` |
| `LIVEKIT_API_KEY`     | Your LiveKit API Key               |
| `LIVEKIT_API_SECRET`  | Your LiveKit API Secret            |

> ⚠️ **Never commit your `.env` file** — it's in `.gitignore`.

## Local Development

Run backend and frontend simultaneously:

**Terminal 1 — Backend:**
```bash
cd backend
npm install
npm start
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The frontend's `vite.config.js` proxies `/api/*` to `http://localhost:3001` during local dev.

## How It Works

- **`/api/token`** — Serverless function generates a signed LiveKit JWT based on `role` (`USER` or `ADMIN`)
- **Frontend** — React app connects to the LiveKit room using the token; USERs can speak, ADMINs listen-only
- **Vercel routing** — `vercel.json` sends `/api/*` to serverless functions and all other paths to the Vite SPA
