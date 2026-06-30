---
name: bootstrap
description: Scaffolds the full backend + frontend directory structure and all boilerplate files per the CLAUDE.md spec. Run once at project start before writing any feature code.
disable-model-invocation: true
---

Scaffold the entire project skeleton as defined in CLAUDE.md. Create all directories and files below — do not skip any, do not ask for confirmation before each file.

## Backend (Python 3.11 + FastAPI)

Create `backend/` with this structure:
- `requirements.txt` — exact list from CLAUDE.md Requirements section
- `.env.example` — with `GROQ_API_KEY=` and `HF_TOKEN=` (empty values, with comments)
- `main.py` — FastAPI app with CORS middleware (allow localhost:5173 + production Vercel URL placeholder), imports all routers, includes `/health` endpoint returning `{"status": "ok"}`
- `models.py` — all 4 SQLModel table classes (Notebook, Source, Chunk, ChatMessage) from CLAUDE.md schema
- `database.py` — SQLite engine creation using `DATABASE_URL = "sqlite:///./notebooklm.db"`, `create_db_and_tables()` function, `get_session()` dependency
- `rag/__init__.py`, `rag/ingestion.py` (PDF/text/URL → chunks, CHUNK_SIZE=500, CHUNK_OVERLAP=50, MAX_CHUNKS_PER_SOURCE=50), `rag/embedder.py` (sentence-transformers all-MiniLM-L6-v2 singleton), `rag/retriever.py` (cosine similarity, TOP_K_CHUNKS=5)
- `llm/__init__.py`, `llm/client.py` — Groq AsyncOpenAI client + `stream_chat` async generator from CLAUDE.md, primary model `llama-3.3-70b-versatile`
- `api/__init__.py`, `api/notebooks.py` (CRUD endpoints), `api/sources.py` (upload + background ingestion), `api/chat.py` (SSE streaming endpoint at `/api/chat/{notebook_id}/stream`)
- `Dockerfile` — exact content from CLAUDE.md Deployment section (python:3.11-slim, pre-downloads sentence-transformers model)

## Frontend (React + Vite + TypeScript + Tailwind)

Create `frontend/` with this structure:
- `package.json` — exact dependencies from CLAUDE.md Requirements section, plus dev deps: `vite`, `typescript`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `@types/react`, `@types/react-dom`, `@types/d3`
- `.env.example` — `VITE_API_URL=http://localhost:8000`
- `index.html` — Vite entrypoint
- `vite.config.ts` — with React plugin, proxy `/api` to `http://localhost:8000` in dev
- `tailwind.config.js` — content paths for `./src/**/*.{ts,tsx}`
- `tsconfig.json` — strict TypeScript config for React
- `src/main.tsx` — ReactDOM render with BrowserRouter
- `src/App.tsx` — routes (/ → NotebookList, /notebook/:id → NotebookDetail) + wake-up ping useEffect that pings `${VITE_API_URL}/health` every 14 minutes
- `src/api/client.ts` — typed fetch wrappers for all API endpoints + SSE chat helper
- `src/store/useStore.ts` — Zustand store with AppStore interface from CLAUDE.md
- `src/pages/NotebookList.tsx` — grid of notebook cards with create button
- `src/pages/NotebookDetail.tsx` — two-column layout: sources left, chat right
- `src/components/ChatPanel.tsx`, `src/components/SourceList.tsx`, `src/components/SourceUpload.tsx`
- `src/components/CitationChip.tsx` — parses `[Quelle: FILENAME, Seite X]` pattern and renders clickable badge
- `src/components/PdfViewer.tsx` — react-pdf with page navigation, accepts `initialPage` prop
- `src/components/AudioOverview.tsx` — Web Speech API player stub

## Root files

- `docker-compose.yml` — runs backend on 8000 (with `./backend:/app` volume and `./data:/app/data` for SQLite persistence), frontend on 5173
- `.gitignore` — ignores `venv/`, `*.db`, `uploads/`, `data/`, `node_modules/`, `.env`, `__pycache__/`, `.DS_Store`, `dist/`
- `vercel.json` — SPA rewrite rule `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}`

After writing all files, print a summary of what was created and remind the user to:
1. Copy `backend/.env.example` to `backend/.env` and add their `GROQ_API_KEY` from console.groq.com
2. Copy `frontend/.env.example` to `frontend/.env` (default URL is already correct for local dev)
3. Run: `cd backend && python -m venv venv && venv/Scripts/activate && pip install -r requirements.txt`
4. Run: `cd frontend && npm install`
5. The sentence-transformers model downloads on first backend start — takes 1-2 minutes
