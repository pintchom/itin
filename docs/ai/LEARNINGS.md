# Agent learnings (feedback loop)

Rules added when humans correct agent mistakes. **Read this file** at session start (after [TODO.md](TODO.md)) so past lessons stick.

Agents: when corrected, append a new bullet under the best category using the format below.

## Format

```markdown
- **YYYY-MM-DD** — Rule: … Context: (optional one line)
```

## Conventions & process

_(none yet)_

## Code & architecture

_(none yet)_

## Auth, API, and data

_(none yet)_

## UI / UX

_(none yet)_

## Local dev & tooling

- **2026-05-24** — Rule: Never disable editor save/confirm safeguards (e.g. do not set `files.confirmSaveUntitled` or similar) to work around REST Client UX. Context: user flagged as dangerous; setting may not exist in Cursor anyway. Use split editor + `.vscode/api-response.http` tasks or Request History instead.
