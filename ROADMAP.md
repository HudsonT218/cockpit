# Cockpit — Roadmap

## Shipped

**Foundation**
- Projects (CRUD, 3 types, 5 states, Park dialog with resume note, project accent colors, delete with task-preserve option)
- Tasks (project-linked or standalone, recurrence, energy tags, description/notes, detail modal, kanban drag-drop)
- Today view (hero focus + calendar strip + active-project strip + day blocks + tasks + reflection)
- Projects grid (grouped by state, filters, search, new-project dialog)
- Project detail (next action, kanban, decision log, resume notes, meta, delete)
- Inbox (quick-add, filters, open/done groupings)
- Week Planner (drag-to-schedule, new/edit block dialog, block drag between days)
- Day Planner (single-day focus, task pool with carryover + inbox + by-project, time-grid, now-line)
- Shipped wall
- Command palette (⌘K)

**Auth + Backend**
- Supabase schema (8 tables, RLS, indexes, triggers, auto-profile)
- Email/password + Google OAuth
- Auth gate, login screen, user chip + sign out
- One-time import from localStorage + demo data loader
- Settings dialog (display name + GitHub)

**GitHub integration**
- PAT-based connection, auto-verification
- Repo picker modal (searchable list of your repos)
- Link repo to any code project
- Recent commits widget on project detail
- 12-week commit heatmap on Today (aggregated across linked repos)
- Auto-touch `last_touched_at` when GitHub has newer activity
- Open issues/PR badge on project cards

---

## Next up — pick any of these

### Phase 5 finale — Deploy it
- Deploy to Vercel with custom domain
- Add production redirect URL to Supabase + Google OAuth
- Wire production env vars
- **~30 min of work**

### Calendar (Phase 6)
- Google Calendar read-only sync (OAuth + event pull + caching)
- Events on Today + Day + Week views come from your real cal
- **~2-3 hours**

### GitHub follow-ups
- "Stalled" nudge: active project + no commits/tasks in 30+ days → suggest parking
- Per-project mini-heatmap on project detail
- Issues + PRs list on project detail (with links)

### Polish grab-bag (Phase 7)
- [ ] Accent color picker on *existing* projects (currently only at creation)
- [ ] Settings: timezone + week start day + default energy tag
- [ ] Undo toast for destructive actions (delete task/project, park, etc.)
- [ ] Mobile layout pass — works but cramped on small screens
- [ ] Keyboard shortcuts beyond ⌘K (G-T for Today, G-P for Projects, etc.)
- [ ] Drag-resize time blocks on the Planner (stretch to change duration)
- [ ] Drag tasks between Today sections, inbox, and kanban (currently kanban-only)
- [ ] Inline sub-tasks / checklist inside task description
- [ ] Block collision detection on Day Planner

### Long horizon (Phase 8)
- [ ] Quarterly review page (shipped / stalled / killed + reflections aggregated)
- [ ] Project templates ("New client project", "Weekly newsletter" — prefills fields)
- [ ] Export to markdown (backup + journaling)
- [ ] Light theme
- [ ] Month view for the Week Planner
- [ ] Obsidian link per project (read-only preview of a vault file)
- [ ] Pomodoro / session timer (you said "pure planning" originally — flag only if you change your mind)

---

## Dependencies between these

```
Deploy ──────► (production-ready, sharable)
                                                   
Google Cal ──► Calendar on Today/Day/Week becomes real
                                                   
GitHub momentum ──► heatmap + auto-touch needs no new deps
```

None of these block each other. Pick by what would make you *use* the app more.
