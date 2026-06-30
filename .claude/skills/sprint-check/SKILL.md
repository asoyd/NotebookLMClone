---
name: sprint-check
description: Reviews the 5-day sprint checklist in CLAUDE.md against the current codebase state and reports what is done vs. pending. Run at the start or end of each sprint day.
---

Review the sprint progress for this NotebookLM clone project.

1. Read `CLAUDE.md` and extract all checklist items from the "5-Tage Sprint" section (Tag 1 through Tag 5), grouped by day.

2. Run `git status` and `git log --oneline` to understand what files exist and what has been committed.

3. For each checklist item, check whether the relevant file or feature exists in the codebase:
   - **Done** — file/feature exists and appears complete
   - **Partial** — file exists but the feature seems incomplete or stubbed
   - **Pending** — not started

4. Report grouped by sprint day:
   - Which day we're currently on (inferred from completion state)
   - Status of each item (Done / Partial / Pending)
   - Day completion percentage

5. Suggest the next 2–3 concrete tasks based on sprint plan priority.

Keep the report concise — one line per checklist item, grouped by day header.
