---
name: dev
description: Prints the commands to start the local development environment (backend + frontend). Use at the start of a dev session.
disable-model-invocation: true
---

Print the following instructions to start the local development environment. Do not run these commands — just display them clearly.

**Option A — Two terminals (recommended for development):**

Terminal 1 — Backend:
```bash
cd backend
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
uvicorn main:app --reload --port 8000
```

Terminal 2 — Frontend:
```bash
cd frontend
npm run dev
```

**Option B — Docker Compose (no venv needed):**
```bash
docker-compose up
```

Then tell the user:
- Backend API docs: http://localhost:8000/docs
- Frontend: http://localhost:5173
- Both services must be running for the app to work
- If backend fails: check that `GROQ_API_KEY` is set in `backend/.env`
- First start downloads the sentence-transformers model (`all-MiniLM-L6-v2`) — allow 1-2 minutes
- SQLite database file will be created at `backend/notebooklm.db` on first run
