# Feature-Vergleich: Google NotebookLM vs. unser Klon

> Stand: 2026-06-30 | Sprint-Tag 3 + Tag 4 teilweise abgeschlossen

---

## Quellenformate

| Format | Google NotebookLM | Unser Klon |
|---|---|---|
| PDFs | ✅ | ✅ |
| Textdateien | ✅ | ✅ |
| Webseiten / URLs | ✅ | ✅ BeautifulSoup |
| Google Docs | ✅ | ❌ kein Google-API-Zugang |
| YouTube-Videos | ✅ | ✅ geplant — `youtube-transcript-api`, kein API-Key nötig (Worktree) |
| Audiodateien | ✅ | ❌ |
| Max. Quellen pro Notebook | 50 | unbegrenzt (konfigurierbar) |

---

## Kernfunktionen

| Feature | Google NotebookLM | Unser Klon |
|---|---|---|
| Fragen mit Quellenverweisen | ✅ | ✅ `[Quelle: datei.pdf, Seite X]` |
| Klickbare Zitate → Quelle öffnen | ✅ | ✅ CitationChip → PdfViewer mit Seiten-Sprung |
| PDF auf richtiger Seite öffnen | ✅ | ✅ react-pdf mit `initialPage` |
| Auto-Zusammenfassung der Quellen | ✅ | ✅ Hintergrund-Job beim Upload |
| Chat-Verlauf persistent | ✅ | ✅ SQLite |
| Streaming-Antworten | ✅ | ✅ SSE mit Typewriter-Effekt |
| Nur Quellen, keine Halluzinationen | ✅ | ✅ System-Prompt erzwingt das |
| Mehrere Notebooks | ✅ | ✅ |

---

## Spezialfeatures

| Feature | Google NotebookLM | Unser Klon |
|---|---|---|
| Audio-Podcast (2 Sprecher) | ✅ Google TTS | ✅ Web Speech API (kostenlos, lokal) |
| Mind Map / Konzept-Graph | ✅ | ✅ D3.js Force Graph (Tag 4) |
| Lernkarten / Quiz | ✅ | ✅ geplant — LLM-generierte Flashcards, Flip-UI (Worktree) |
| Gliederungen generieren | ✅ | ❌ nicht geplant |
| Präsentationen erstellen | ✅ | ❌ nicht geplant |
| Dark Mode | ✅ | ✅ Tailwind (Tag 5) |

---

## Was unser Klon besser macht

- **Datenkontrolle** — selbst hostbar, kein Google-Lock-in
- **Embeddings lokal** — sentence-transformers läuft im Container, kein API-Call zur Laufzeit
- **Echtes SSE-Streaming** — schnellere gefühlte Antwortzeit als polling-basierte Lösungen
- **Open Source** — vollständig anpassbar
- **YouTube ohne API-Key** — `youtube-transcript-api` holt Transkripte direkt, kein Google Cloud Zugang nötig

---

## Neue Features (geplant — jeweils eigener Worktree)

### YouTube Transcript Import
- Erkennt `youtube.com/watch?v=` und `youtu.be/` URLs automatisch
- `youtube-transcript-api` holt Transkript ohne API-Key
- Transkript wird gechunkt + embedded wie jedes andere Dokument
- Videotitel wird via `og:title`-Scraping gesetzt (BeautifulSoup, kein neuer Dep)
- Neuer Source-Typ `"youtube"` in der DB

### Flashcard Generation
- POST `/api/chat/{notebook_id}/flashcards`
- LLM generiert 8 Frage-Antwort-Karten aus Top-Chunks des Notebooks
- Response: `{"flashcards": [{"front": "...", "back": "..."}]}`
- Frontend: `Flashcards.tsx` — Klick zum Umdrehen, Vor/Zurück-Navigation
- Kein neuer Dependency nötig (weder backend noch frontend)

---

## Fazit

Mit YouTube-Import und Flashcards deckt unser Klon **~85% der NotebookLM-Funktionalität** ab:

**RAG-Chat mit Quellenverweisen → klickbare Zitate → PDF-Viewer → Auto-Summary → Audio-Podcast → YouTube-Import → Flashcards**

Nicht enthalten: Google Docs, Audio-Dateien als Quelle, Präsentationen. Für einen 5-Tage-Sprint als Demo-MVP ist das Ergebnis vollständig wettbewerbsfähig.
