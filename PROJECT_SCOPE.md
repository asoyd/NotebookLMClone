# Feature-Vergleich: Google NotebookLM vs. unser Klon

> Stand: 2026-06-30 | Sprint-Tag 2 abgeschlossen, Tag 3–5 geplant

---

## Quellenformate

| Format | Google NotebookLM | Unser Klon |
|---|---|---|
| PDFs | ✅ | ✅ |
| Textdateien | ✅ | ✅ |
| Webseiten / URLs | ✅ | ✅ BeautifulSoup |
| Google Docs | ✅ | ❌ kein Google-API-Zugang |
| YouTube-Videos | ✅ | ❌ |
| Audiodateien | ✅ | ❌ |
| Max. Quellen pro Notebook | 50 | unbegrenzt (konfigurierbar) |

---

## Kernfunktionen

| Feature | Google NotebookLM | Unser Klon |
|---|---|---|
| Fragen mit Quellenverweisen | ✅ | ✅ `[Quelle: datei.pdf, Seite X]` |
| Klickbare Zitate → Quelle öffnen | ✅ | ✅ CitationChip-Komponente |
| PDF auf richtiger Seite öffnen | ✅ | ✅ react-pdf mit Seiten-Sprung |
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
| Lernkarten / Quiz | ✅ | ❌ nicht geplant |
| Gliederungen generieren | ✅ | ❌ nicht geplant |
| Präsentationen erstellen | ✅ | ❌ nicht geplant |
| Dark Mode | ✅ | ✅ Tailwind (Tag 5) |

---

## Was unser Klon besser macht

- **Datenkontrolle** — selbst hostbar, kein Google-Lock-in
- **Embeddings lokal** — sentence-transformers läuft im Container, kein API-Call zur Laufzeit
- **Echtes SSE-Streaming** — schnellere gefühlte Antwortzeit als polling-basierte Lösungen
- **Open Source** — vollständig anpassbar

---

## Fazit

Bei vollständiger Umsetzung deckt unser Klon **~70% der NotebookLM-Funktionalität** ab — und genau die Kernfunktionen, die den eigentlichen Mehrwert ausmachen:

**RAG-Chat mit Quellenverweisen → klickbare Zitate → PDF-Viewer auf der richtigen Seite → Auto-Summary → Audio-Podcast**

Nicht enthalten sind Google-spezifische Quellformate (Docs, YouTube, Audio) und edu-spezifische Ausgaben (Lernkarten, Quiz, Präsentationen). Für einen 5-Tage-Sprint als Demo-MVP ist das Ergebnis vollständig wettbewerbsfähig.
