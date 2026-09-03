# LinguaAI Deployment

## Vercel (Frontend + FastAPI backend)

This repository is configured for Vercel Services: the Vite frontend and FastAPI backend deploy together under one Vercel project. Vercel routes `/` to the frontend and `/svc/api/*` to FastAPI.

### Vercel project
- Framework/preset: detected from `vercel.json`
- `vercel.json` is at repository root
- Frontend service: `frontend/`
- Backend service: `backend/` with entrypoint `main:app`

### Environment variables
Add these in Vercel Project Settings → Environment Variables: 

- `AZURE_OPENAI_ENDPOINT` = your Microsoft Foundry **Project endpoint**, e.g. `https://fr01.services.ai.azure.com/api/projects/proj-default`
- `AZURE_CLIENT_ID` = Application (client) ID of the Entra app used by Vercel
- `AZURE_CLIENT_SECRET` = client secret **Value**
- `AZURE_TENANT_ID` = Directory (tenant) ID

`CORS_ORIGINS` is not required for the deployed browser flow because frontend and API share the same Vercel origin. It can still be set if you need external browser origins.

### Local development
The frontend defaults to `/svc/api` for Vercel. For the separate local FastAPI server, create `frontend/.env.local` with:

```text
VITE_API_URL=http://127.0.0.1:8000
```

For local FastAPI, use the existing Uvicorn command. If you want local routes to match production, call `/svc/api/health` and `/svc/api/translate`.

### Important
Do not commit `.env`, client secrets, or API keys to GitHub.
