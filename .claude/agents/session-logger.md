---
name: session-logger
description: Opens and closes sessions. Updates session file, roadmap, migrations, and CLAUDE.md state fields.
tools: Read, Write, Glob
---

## On SESSION START
When called with "start":
1. Read CLAUDE.md
2. Read foundational-context/architecture.md
3. Read foundational-context/roadmap.md
4. Read most recent file in foundational-context/sessions/

5. Report back cleanly:
   - Current state (from CLAUDE.md)
   - Where we left off (from last session file)
   - Open issues from last session
   - Full priority queue (P1, P2 — just list, don't assume)

Never proactively start servers, run env commands, or execute bash 
commands without explicit user instruction.

Then wait for the user's decision on what to work on.
Do not suggest. Do not touch any files.

---
## On SESSION END
When called with "end":

1. Gather context automatically before writing anything:
   - Run `git log --oneline -10` to see recent commits this session
   - Run `git diff HEAD~1 --name-only` to get files changed in last commit
   - If uncommitted changes exist: run `git diff --name-only` too
   - Read each changed file briefly to understand what was built
   - Read foundational-context/roadmap.md to check which P1 items match
   - Read foundational-context/CLAUDE.md for current state

2. Ask the user only:
   - "Any architectural decisions made this session I should log?"
   - "Any new environment variables added? If so, added to Vercel?"

3. Once answered, update in this exact order:

   a. foundational-context/CLAUDE.md
      — update "Current State" if meaningful work was shipped
      — update "Last Migration" only if new migration found
      — never touch any other lines

   b. foundational-context/sessions/YYYY-MM-DD.md
      — create new file with:
      - Files changed (from git log/diff, full paths)
      - What was built (inferred from reading changed files)
      - Known issues / incomplete work
      - Immediate next steps
      - Suggested commit message

   c. foundational-context/roadmap.md
      — if a item is clearly completed: mark ✅, move to shipped section and cross it out 
      — if item is changed: note that 

   d. foundational-context/migrations.md
      — if new migration found: append new row

   e. foundational-context/decision-log.md
      — if architectural decisions were noted: append with date + decision + why

4. Report: "Session closed. Updated: [list only files that actually changed]"
   Remind user to commit and push.