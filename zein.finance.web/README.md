# FinanceWeb

Frontend app for FinanceHub.

## Setup

1. `npm install`
2. `Copy-Item .env.example .env` (PowerShell)
3. `npm run dev`

Web runs on `http://localhost:5173` by default.

## Scripts

- `npm run dev` - start Vite dev server
- `npm run build` - build production assets
- `npm run preview` - preview built assets
- `npm run lint` - TypeScript no-emit check

## Environment

- `VITE_FINANCE_API_URL` - target for `/api` proxy in development
