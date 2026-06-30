# NotebookLM Clone — Master Plan für Claude Code

> **Lies diese Datei zuerst vollständig bevor du Code schreibst.**
> Sie ist die einzige Wahrheitsquelle für Architektur, Stack und Entscheidungen.

---

## Was wir bauen

Ein KI-gestützter Forschungsassistent (NotebookLM-Klon). Nutzer laden Dokumente hoch (PDFs, Text, URLs) und können per Chat Fragen stellen — mit zitierten Antworten die direkt auf die Quellstellen zeigen.

**Wettbewerb-Kontext:** 5-Tage-Sprint, Demo-fähiges MVP, vollständig kostenlos.

---

## Finale Tech-Entscheidungen (nicht hinterfragen — alle begründet)

### Stack

| Schicht | Technologie | Warum |
|---|---|---|
| Frontend | React + Vite + TypeScript + Tailwind | Schnell, bekannt, Vercel-ready |
| Backend | Python 3.11 + FastAPI | PDF-Parsing braucht Python |
| Datenbank | SQLite via SQLModel | Kein Setup, persistiert auf Render |
| Vektoren | numpy (Cosine Similarity) | Kein ChromaDB nötig — 10 Zeilen Code |
| LLM | Groq API (`llama-3.3-70b-versatile`) | 300–1000 T/s, kostenlos, OpenAI-kompatibel |
| Embeddings | sentence-transformers (`all-MiniLM-L6-v2`) | Lokal im Container, kein API-Call zur Laufzeit |
| Streaming | SSE (Server-Sent Events) via FastAPI `StreamingResponse` | WebSocket geht nicht serverless |
| PDF-Parsing | PyMuPDF (`fitz`) | Beste Python PDF-Library |
| URL-Import | BeautifulSoup4 | Webseiten als Quelle |
| Deployment Frontend | Vercel | Bekannt, Git-push, kostenlos |
| Deployment Backend | Render (Docker) | Persistentes Filesystem, SQLite, sentence-transformers, kostenlos |

### API Keys (alle kostenlos, kein Credit Card nötig)

```
GROQ_API_KEY=gsk_...        # console.groq.com — kein Credit Card
HF_TOKEN=hf_...             # huggingface.co/settings/tokens — optional, für Embedding-Fallback
```

### Warum NICHT:
- **Kein Ollama** — Lokale Installation, portiert nicht mit dem Projekt
- **Kein ChromaDB** — Unnötiger Prozess, numpy reicht völlig
- **Kein Mistral direkt** — Kein dauerhafter Free Tier
- **Kein Vercel für Backend** — SQLite nicht supported, sentence-transformers zu groß (4.7GB > 500MB Limit)
- **Kein WebSocket** — Serverless-inkompatibel, SSE ist gleichwertig
- **Kein Supabase/PostgreSQL** — Unnötige Komplexität wenn SQLite auf Render funktioniert

---

## Projektstruktur

```
notebooklm-clone/
├── CLAUDE.md                    # Diese Datei — immer zuerst lesen
├── README.md                    # Setup-Anleitung + Demo-Hinweis (Render sleep)
├── docker-compose.yml           # Lokale Entwicklung
│
├── backend/
│   ├── Dockerfile               # Für Render Deployment
│   ├── requirements.txt
│   ├── main.py                  # FastAPI App Entrypoint
│   ├── models.py                # SQLModel Schemas
│   ├── database.py              # SQLite Connection + Init
│   │
│   ├── rag/
│   │   ├── __init__.py
│   │   ├── ingestion.py         # PDF/Text/URL → Chunks
│   │   ├── embedder.py          # sentence-transformers Wrapper
│   │   └── retriever.py         # Cosine Similarity Suche
│   │
│   ├── llm/
│   │   ├── __init__.py
│   │   └── client.py            # Groq OpenAI-kompatibler Client + SSE
│   │
│   └── api/
│       ├── __init__.py
│       ├── notebooks.py         # CRUD Notebooks
│       ├── sources.py           # Upload + Ingestion
│       └── chat.py              # SSE Chat Endpoint
│
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   ├── tailwind.config.js
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/
│       │   └── client.ts        # API calls + SSE client
│       ├── store/
│       │   └── useStore.ts      # Zustand global state
│       ├── pages/
│       │   ├── NotebookList.tsx # Home: alle Notebooks
│       │   └── NotebookDetail.tsx # Sources + Chat
│       └── components/
│           ├── ChatPanel.tsx
│           ├── SourceList.tsx
│           ├── SourceUpload.tsx
│           ├── CitationChip.tsx  # Klickbare Zitat-Badges
│           ├── PdfViewer.tsx     # react-pdf mit Seiten-Sprung
│           └── AudioOverview.tsx # Web Speech API Player
```

---

## Datenbank-Schema (SQLite via SQLModel)

```python
# Notebook — Sammlung von Quellen
class Notebook(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    title: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Source — eine hochgeladene Datei oder URL
class Source(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    notebook_id: str = Field(foreign_key="notebook.id")
    name: str                    # Dateiname oder URL
    type: str                    # "pdf" | "text" | "url"
    file_path: Optional[str]     # Pfad zur gespeicherten Datei
    summary: Optional[str]       # Auto-generiert beim Upload
    status: str = "processing"   # "processing" | "ready" | "error"
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Chunk — Textsegment mit Embedding
class Chunk(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    source_id: str = Field(foreign_key="source.id")
    notebook_id: str             # Denormalisiert für schnelle Queries
    text: str
    embedding: str               # JSON-serialisiertes float array
    page_number: Optional[int]
    char_start: Optional[int]
    char_end: Optional[int]

# ChatMessage — Chat-Verlauf
class ChatMessage(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    notebook_id: str = Field(foreign_key="notebook.id")
    role: str                    # "user" | "assistant"
    content: str                 # Markdown-Text
    citations: Optional[str]     # JSON: [{source_id, chunk_id, page}]
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

---

## RAG-Pipeline (Kernlogik)

### Upload-Flow
```
Datei/URL → Parser → Text pro Seite → Chunker → Chunks (500 Token, 50 Overlap)
→ Embedder (all-MiniLM-L6-v2) → float[384] → JSON in SQLite
→ Hintergrund: Auto-Summary via LLM → in Source.summary speichern
```

### Chat-Flow
```
User-Query → Embedding → Cosine Similarity gegen alle Chunks des Notebooks
→ Top 5 Chunks → System-Prompt aufbauen → Groq API (SSE Stream)
→ Response parsen: [Quelle: X, Seite Y] Tags → Citation-Objekte
→ SSE Stream an Frontend → UI rendert Zitat-Chips
```

### Chunking-Parameter
```python
CHUNK_SIZE = 500      # Tokens
CHUNK_OVERLAP = 50    # Tokens Überlapp
TOP_K_CHUNKS = 5      # Retrieval
MAX_CHUNKS_PER_SOURCE = 50  # Max pro Dokument (Demo-Limit)
```

### Cosine Similarity (kein ChromaDB)
```python
import numpy as np

def cosine_similarity(a: list[float], b: list[float]) -> float:
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def find_top_chunks(query_embedding, all_chunks, k=5):
    scored = [
        (chunk, cosine_similarity(query_embedding, json.loads(chunk.embedding)))
        for chunk in all_chunks
    ]
    return [c for c, _ in sorted(scored, key=lambda x: x[1], reverse=True)[:k]]
```

---

## LLM Client (Groq — OpenAI-kompatibel)

```python
from openai import AsyncOpenAI

client = AsyncOpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.environ["GROQ_API_KEY"]
)

# SSE Streaming
async def stream_chat(messages: list[dict]):
    stream = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",  # Primary
        # fallback: "llama3-8b-8192"       # Wenn Rate Limit
        messages=messages,
        stream=True,
        max_tokens=1500,
        temperature=0.3
    )
    async for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
```

### System-Prompt Template
```
Du bist ein präziser Forschungsassistent. Beantworte Fragen NUR basierend
auf den gegebenen Quellen. Wenn die Antwort nicht in den Quellen steht,
sage das explizit.

Zitiere immer mit dem Format [Quelle: DATEINAME, Seite X] direkt nach
der relevanten Aussage. Mehrere Zitate möglich.

Quellen:
{chunks_als_text}
```

---

## Frontend-Architektur

### Routing
```
/ → NotebookList (alle Notebooks als Cards)
/notebook/:id → NotebookDetail (Sources links, Chat rechts)
```

### State (Zustand)
```typescript
interface AppStore {
  notebooks: Notebook[]
  currentNotebook: Notebook | null
  sources: Source[]
  messages: ChatMessage[]
  isStreaming: boolean
  // Actions
  fetchNotebooks: () => Promise<void>
  createNotebook: (title: string) => Promise<void>
  uploadSource: (file: File | string) => Promise<void>
  sendMessage: (text: string) => Promise<void>  // SSE
}
```

### SSE Chat (Frontend)
```typescript
const eventSource = new EventSource(`/api/chat/${notebookId}/stream?q=${query}`)
eventSource.onmessage = (e) => {
  if (e.data === '[DONE]') { eventSource.close(); return }
  appendToLastMessage(e.data)
}
```

### Zitat-Rendering
LLM gibt `[Quelle: document.pdf, Seite 3]` zurück → Frontend parsed mit Regex
→ rendert als klickbarer `<CitationChip>` → Klick öffnet PDF-Viewer auf Seite 3

---

## Killer-Features (Tag 4)

### Audio Overview (Web Speech API — kein TTS-Service nötig)
```typescript
// LLM generiert Podcast-Skript mit zwei Sprechern
// Frontend liest es mit unterschiedlichen Stimmen vor
const synth = window.speechSynthesis
const voices = synth.getVoices()
// Host-Stimme: voices[0], Expert-Stimme: voices[1]
```

### Mind Map (D3.js Force Graph)
```
LLM extrahiert Konzepte als JSON → D3 Force-Simulation → interaktiver Graph
Prompt: "Gib mir die 10 wichtigsten Konzepte und ihre Verbindungen als JSON:
{nodes: [{id, label}], edges: [{source, target, relation}]}"
```

---

## Deployment

### Render (Backend)

**Dockerfile:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# sentence-transformers Modell pre-downloaden
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Environment Variables auf Render:**
```
GROQ_API_KEY=gsk_...
HF_TOKEN=hf_...          # Optional
ENVIRONMENT=production
```

**⚠ Render Free Tier schläft nach 15 Minuten Inaktivität.**
→ README und Demo-Email darauf hinweisen.
→ Wake-up-Ping im Frontend: alle 14 Minuten GET /health aufrufen.

```typescript
// In App.tsx — hält Render wach
useEffect(() => {
  const ping = () => fetch(`${API_URL}/health`)
  ping()
  const interval = setInterval(ping, 14 * 60 * 1000)
  return () => clearInterval(interval)
}, [])
```

### Vercel (Frontend)

**Environment Variable:**
```
VITE_API_URL=https://dein-service.onrender.com
```

**vercel.json** (falls nötig):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### CORS (Backend muss Vercel-Domain erlauben)
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://dein-projekt.vercel.app", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 5-Tage Sprint

### Tag 1 — Backend Foundation
- [ ] Repo-Setup (Monorepo), Docker Compose für lokal
- [ ] FastAPI + SQLite + SQLModel (alle 4 Tabellen)
- [ ] PyMuPDF PDF-Parser + Text-Extraktion
- [ ] Chunking-Pipeline (500 Token, 50 Overlap)
- [ ] sentence-transformers Embedder
- [ ] Cosine Similarity Retriever
- [ ] Groq Client (SSE Streaming)
- **✓ Tagesabschluss:** curl-Test — PDF hochladen, Frage stellen, zitierte Antwort im Terminal

### Tag 2 — Chat-API + React-Grundgerüst
- [ ] SSE Chat-Endpoint (`/api/chat/{notebook_id}/stream`)
- [ ] Notebooks CRUD Endpoints
- [ ] Sources Upload Endpoint
- [ ] React + Vite + Tailwind Setup
- [ ] NotebookList Page (Grid-View)
- [ ] NotebookDetail Page (2-Spalten-Layout)
- [ ] Drag-and-Drop Upload mit Progress
- [ ] Chat-UI mit SSE-Streaming (Typewriter-Effekt)
- **✓ Tagesabschluss:** Im Browser PDF hochladen + Frage stellen, Streaming-Antwort sehen

### Tag 3 — Zitierungen + Source-Viewer
- [ ] System-Prompt mit [Quelle: X, Seite Y] Format
- [ ] Backend parsed Zitate aus LLM-Response
- [ ] CitationChip Komponente (klickbar)
- [ ] react-pdf Integration mit Seiten-Sprung
- [ ] PDF-Highlight bei zitierter Stelle
- [ ] Auto-Summary beim Upload (Hintergrund-Job)
- [ ] Summary-Card über Source-Liste
- **✓ Tagesabschluss:** Zitat anklicken → PDF öffnet auf richtiger Seite

### Tag 4 — Killer-Features
- [ ] Audio Overview: LLM generiert 2-Sprecher Podcast-Skript
- [ ] Audio-Player UI (Play/Pause, Speed, Skript-Anzeige)
- [ ] Web Speech API Integration (2 Stimmen)
- [ ] Konzept-Extraktion via LLM (JSON)
- [ ] Mind Map via D3.js Force Graph
- [ ] URL-Import (BeautifulSoup Scraper)
- **✓ Tagesabschluss:** Notebook als Podcast hören + Mind Map explorieren

### Tag 5 — Polish + Deploy
- [ ] Dark Mode (Tailwind dark:)
- [ ] Loading Skeletons, Transitions
- [ ] Empty States, Error Handling, Toast Notifications
- [ ] Wake-up-Ping im Frontend (Render nicht schlafen lassen)
- [ ] Dockerfile finalisieren + auf Render deployen
- [ ] Frontend auf Vercel deployen
- [ ] README mit Setup + Demo-Hinweis schreiben
- [ ] Demo-Email schreiben (mit Render-Sleep-Hinweis)
- **✓ Tagesabschluss:** Beide URLs live, README fertig, Demo funktioniert

---

## Aktueller Stand (2026-06-29)

### Fertig (Tag 1 + 2 vollständig)
- Backend: FastAPI + SQLite + alle 4 Tabellen, PDF/Text/URL-Ingestion, Chunking, Embedder, Retriever, Groq SSE, alle CRUD-Endpoints
- Frontend: React + Vite + Tailwind, NotebookList, NotebookDetail, Drag-and-Drop Upload, SSE Chat mit Typewriter-Effekt, CitationChip (geparst + gerendert)
- Auto-Summary beim Upload (Hintergrund-Job) ✓
- Render keep-alive Ping in App.tsx ✓

### Offen (Tag 3–5)
- **CitationChip → PdfViewer verknüpfen** — Klick auf Zitat soll PDF auf Seite X öffnen (react-pdf importiert, PdfViewer.tsx existiert, aber click handler fehlt)
- **Audio Overview UI** — LLM-Endpoint existiert (`/chat/{id}/audio-overview`), AudioOverview.tsx ist Stub
- **Mind Map** — D3.js in package.json, Komponente existiert, aber nicht verdrahtet
- **README.md** — fehlt noch
- **Dark Mode** — Tailwind bereits konfiguriert, nur `dark:` Klassen fehlen
- **Loading Skeletons + Toast Notifications** — react-hot-toast importiert, kaum verwendet
- **Deploy** — Dockerfile fertig, noch nicht auf Render/Vercel deployed

---

## Cut-Scope (wenn Zeit knapp)

**Weglassen wenn nötig (Priorität aufsteigend):**
1. Mind Map (D3.js) — schönes Feature, aber nicht kern
2. URL-Import — PDFs reichen für Demo
3. Dark Mode — nice-to-have
4. Audio Overview — WOW-Feature, aber aufwändig

**Nie weglassen:**
- RAG-Chat mit Zitierungen — das IST das Produkt
- PDF-Viewer mit Seiten-Sprung — der Wow-Moment
- Auto-Summary — kleiner Aufwand, große Wirkung

---

## Requirements

### backend/requirements.txt
```
fastapi>=0.111.0
uvicorn[standard]>=0.29.0
sqlmodel>=0.0.18
python-multipart>=0.0.9
PyMuPDF>=1.24.0
beautifulsoup4>=4.12.0
requests>=2.31.0
sentence-transformers>=3.0.0
numpy>=1.26.0
openai>=1.30.0
python-dotenv>=1.0.0
tiktoken>=0.7.0
aiofiles>=23.2.1
```

### frontend/package.json (dependencies)
```json
{
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "react-router-dom": "^6.23.0",
  "zustand": "^4.5.0",
  "react-pdf": "^9.0.0",
  "react-dropzone": "^14.2.0",
  "react-hot-toast": "^2.4.0",
  "d3": "^7.9.0",
  "marked": "^12.0.0",
  "clsx": "^2.1.0"
}
```

---

## Demo-Hinweis für README + Email

```
⚠️ Wichtiger Hinweis zum Demo-Zugang:

Das Backend läuft auf Render Free Tier. Nach 15 Minuten Inaktivität
wechselt der Server in den Sleep-Mode und braucht beim ersten Aufruf
ca. 30-60 Sekunden zum Aufwachen.

→ Bitte beim ersten Besuch kurz warten — danach reagiert alles sofort.
→ Die App weckt sich selbst auf sobald jemand die Seite öffnet.

Alternativ: Das Projekt lokal starten (siehe README → Local Setup).
```

---

## Lokale Entwicklung

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # GROQ_API_KEY eintragen
uvicorn main:app --reload --port 8000

# Frontend (neues Terminal)
cd frontend
npm install
cp .env.example .env  # VITE_API_URL=http://localhost:8000
npm run dev
```

Oder mit Docker Compose:
```bash
docker-compose up
# Backend: http://localhost:8000
# Frontend: http://localhost:5173
```

---

## Wichtige Coding-Regeln für Claude Code

1. **Immer diese Datei zuerst lesen** bevor du Code schreibst
2. **Kein ChromaDB** — numpy für Cosine Similarity
3. **Kein WebSocket** — nur SSE via `StreamingResponse`
4. **Kein Ollama** — immer Groq API
5. **SQLite bleibt** — kein PostgreSQL, kein Supabase
6. **sentence-transformers läuft lokal** — kein HF API-Call für Embeddings zur Laufzeit
7. **Embeddings werden beim Upload generiert und in SQLite gespeichert** — nie zur Chat-Zeit neu berechnen
8. **Zitate immer im Format `[Quelle: DATEINAME, Seite X]`** im System-Prompt erzwingen
9. **CORS konfigurieren** — Frontend-URL in allow_origins eintragen
10. **Wake-up Ping** im Frontend implementieren (alle 14 Minuten)
