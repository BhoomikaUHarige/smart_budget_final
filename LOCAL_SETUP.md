# Run SmartBudget Matrix on your laptop

Stack: **FastAPI + MongoDB** (backend) · **Vite + React 19 + TypeScript + Tailwind v4** (frontend).
Everything is plain open-source — no Emergent-specific runtime is required once you apply the
two small local tweaks in step 3.

## 0. Prerequisites

- Python 3.10+
- Node.js 20+ (npm)
- MongoDB — pick ONE:
  - **Docker (easiest):** from the project root run `docker compose up -d` (uses the
    `docker-compose.yml` in this folder — starts MongoDB on localhost:27017)
  - **Local install:** e.g. `brew install mongodb-community` / `apt install mongodb-org`, then start `mongod`
  - **MongoDB Atlas (free tier):** use your Atlas connection string in `backend/.env` instead

## 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# minimal dependency set for this app:
pip install "fastapi==0.141.1" "uvicorn==0.52.1" "motor==3.7.1" "pymongo==4.17.0" "pydantic>=2.6.4" python-dotenv "numpy>=1.26.0"
# ...or the full environment: pip install -r requirements.txt
```

Create `backend/.env`:

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="app"
CORS_ORIGINS="*"
```

Start it:

```bash
uvicorn server:app --reload --port 8001
# sanity check: http://localhost:8001/api/forecast
```

## 2. Frontend

```bash
cd frontend
npm install
```

**Local tweak A —** remove these two platform-only lines from `package.json` → `devDependencies`
(they are Emergent preview infrastructure, not needed locally):

```json
"@emergentbase/overlay": "https://assets.emergent.sh/npm/emergentbase-overlay-0.1.31.tgz",
"@emergentbase/visual-edits": "https://assets.emergent.sh/npm/emergentbase-visual-edits-1.0.15.tgz",
```

**Local tweak B —** replace `vite.config.ts` with this minimal version (same `@` alias, same
`/api → :8001` proxy, without the Emergent overlay plugins):

```ts
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      // local adapters (kept in the repo): restore brand icons + recharts 2 Tooltip typings
      { find: /^lucide-react$/, replacement: path.resolve(__dirname, "./src/lib/lucide-react.tsx") },
      { find: "lucide-react-upstream", replacement: path.resolve(__dirname, "./node_modules/lucide-react") },
      { find: /^recharts$/, replacement: path.resolve(__dirname, "./src/lib/recharts.tsx") },
      { find: "recharts-upstream", replacement: path.resolve(__dirname, "./node_modules/recharts") },
    ],
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8001",
        changeOrigin: true,
      },
    },
  },
});
```

Start it:

```bash
npm run dev
# open http://localhost:3000
```

## 3. Use the app

1. Click **New monthly plan** (or **Create first month plan** on the empty state) — set expected
   income, planned spend, planned savings.
2. When the month ends, click **Enter actuals** — log spend per category (the donut uses these)
   and what you actually saved.
3. The forecast panel + trend chart update after every closed month, using least squares
   (θ = (XᵀWX)⁻¹XᵀWy). **Inspect math** shows the live matrices; **Load 3-month demo** seeds
   sample history if you want to see everything immediately.

## Troubleshooting

- **`pymongo` connection error** → MongoDB isn't running: check `docker compose ps`, or your
  Atlas URI in `backend/.env`.
- **Charts/blank page** → make sure the two `@emergentbase` devDependencies were removed and the
  minimal `vite.config.ts` saved, then re-run `npm install`.
- **API 404s from the frontend** → backend must run on port **8001** (the Vite proxy targets it).
- The `frontend/src/lib/lucide-react.tsx` and `recharts.tsx` adapters are required — don't delete
  them (tsconfig + vite alias point at them).

Optional files you can ignore locally: `tests/`, `backend/tests/`, `backend/pytest.ini`,
`.emergent/`, `memory/`.
