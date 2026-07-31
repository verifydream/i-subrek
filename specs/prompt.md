# iSubrek AI Coding Prompt — Full Phase 1–4

> Copy-paste this entire message to your AI coding agent. Self-contained.  
> Agent: read, plan, execute, commit. No human in the loop until final PR review.

---

You are an expert fullstack engineer. Your task: transform the iSubrek prototype into a production-ready, self-hostable portfolio-grade application by executing all 4 phases in `specs/plan.md`.

---

## 1. FIRST — Load Context

Before writing any code, read these 3 files. They contain everything you need.

```
specs/PRD.md       — Product assessment, 26 issues ranked, architecture decisions, risk matrix
specs/plan.md      — 20 tasks, exact code snippets, commands, verification steps, commit messages
specs/task-check.md — Trackable checklist with phase gates
```

**The plan is the source of truth.** Every task has exact file paths, code changes, verification commands, and expected outcomes.

---

## 2. Execution Order

Execute phases **sequentially**. Do not skip ahead. Each phase gates the next.

| Order | Phase | Tasks | Outcome |
|-------|-------|-------|---------|
| 1 | Critical Fixes | 1.1 → 1.7 | `npm run build` clean, `npm run test` all pass, `npm run lint` zero |
| 2 | Auth Migration | 2.1 → 2.3 | Login via Google + credentials works, data preserved |
| 3 | Core UX | 3.1 → 3.7 | Search, export, skeletons, auto-advance, unified categories |
| 4 | Production Polish | 4.1 → 4.6 | Docker, CI, charts, audit log, E2E, rate limiting |

### Per-Task Workflow

```
1. Read task in specs/plan.md
2. Make the exact code changes described
3. npm run test      (must pass)
4. npm run lint      (zero new warnings)
5. git add + git commit (use the commit message from plan.md)
6. Update specs/task-check.md — mark as ✅
7. Next task
```

Do NOT combine tasks. One commit per task.

---

## 3. Phase Gates — Do NOT Skip

After each phase, run the gate check:

| Phase | Gate |
|-------|------|
| 1 | `npm run build` clean, `npm run test` all pass, `npm run lint` zero errors, `npx tsc --noEmit` zero errors |
| 2 | Google OAuth + credentials login works, existing subscriptions still bound to user |
| 3 | All user-facing features functional, no CRUD regressions |
| 4 | `docker compose up` → app running on `localhost:3000`, CI green, E2E passing |

**If a gate fails:** fix the issue immediately. Do not proceed to next phase with a failing gate.

---

## 4. Auto-Decision Policy

You are working autonomously. The user is NOT available for questions.

**When you encounter ambiguity:**
1. Pick the most pragmatic, YAGNI-compliant option
2. Document the decision in a running `specs/decisions.md` file — one line per decision
3. Move on

**What counts as "pragmatic":**
- Prefer fewer dependencies
- Prefer simpler implementation
- Prefer the pattern already used in the codebase
- If the plan says "X or Y" — pick the first one
- If the plan is silent — match existing codebase conventions

**Do NOT:**
- Add abstractions "for later"
- Gold-plate with unnecessary features
- Rewrite working code that the plan didn't target
- Change the tech stack beyond what the plan specifies (Claude → NextAuth is the only approved stack change)

---

## 5. Tracking

At the end of each task, edit `specs/task-check.md` and mark it `✅`. The user will review this file.

At the end of each phase, add a section header in `specs/decisions.md`:

```markdown
## Phase N Decisions

- [task-id]: [decision] — [brief reason]
```

---

## 6. Final Handoff

When ALL 4 phases are complete and all gates pass:

1. Run `npm run test` one final time — all must pass
2. Run `npm run build` — zero errors
3. Run `npm run lint` — zero warnings
4. Create a Pull Request with this body:

```markdown
## Summary
Prototype → Production-ready. All 4 phases complete.

## What Changed
[Bulleted list of major changes, grouped by phase]

## Gates
- [x] `npm run build` — clean
- [x] `npm run test` — all passing
- [x] `npm run lint` — zero warnings
- [x] `npx tsc --noEmit` — zero errors
- [x] `docker compose up` — app accessible

## Auto-Approved Decisions
[Copy-paste contents of specs/decisions.md here]

## Testing
- Unit tests: [N] passing
- E2E tests: [N] passing
- Lighthouse score: [perf] / [a11y]

## Screenshots
[Optional — if you can take screenshots of the dashboard, settings, and search]
```

---

## 7. Reference Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run test       # Run unit tests
npm run lint       # ESLint
npx tsc --noEmit   # Type check
npm run db:generate # Generate migrations
npm run db:push    # Push schema to DB
docker compose up  # Production mode
```

---

**Begin.** Start with Task 1.1.
