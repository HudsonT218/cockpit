# Cockpit

A personal dashboard for vibe coders who juggle too many projects.

Keep track of what's active, what's on ice, what's shipped. Plan your day around real focus time, not a todo list. Sync with Supabase + GitHub so it works across devices.

## What it does

- **Portfolio view** of every project (active / on hold / waiting / shipped / idea)
- **Today view** with a single "focus" card, today's blocks, calendar events, and tasks
- **Day Planner** — single-day time-grid with drag-to-schedule from a pool of carryover tasks, inbox, and every open project task
- **Week Planner** — seven-day view with drag-between-days scheduling
- **Inbox** for standalone tasks + recurring routines
- **Project detail** with next action, kanban (Now / Next / Done), decision log, GitHub commits
- **GitHub integration** — link repos, see recent commits, aggregated 12-week activity heatmap
- **Command palette** (⌘K) for navigation and actions

## Stack

- Vite + React 18 + TypeScript
- Tailwind for styling
- Zustand for state
- Supabase (Postgres + Auth, email + Google OAuth)
- GitHub REST API via Personal Access Token

## Quick start

### 1. Supabase setup

Create a Supabase project, then run the schema from `supabase/schema.sql` in the SQL Editor. It's idempotent — safe to re-run.

Enable at least one auth provider:
- **Email/Password** — Authentication → Providers → Email. Turn off "Confirm email" for a personal dev setup.
- **Google** (optional) — Authentication → Providers → Google. Needs a Google Cloud OAuth client ([guide](https://supabase.com/docs/guides/auth/social-login/auth-google)).

Also set your URL config:
- Site URL: `http://localhost:5173` (or your production URL)
- Redirect URLs: add `http://localhost:5173/**`

### 2. Env

```bash
cp .env.example .env.local
```

Fill in:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Install + run

```bash
npm install
npm run dev
```

Open http://localhost:5173 — sign up, then use the command palette (`⌘K`) to load demo data if you want a populated dashboard to poke around.

## Schema migrations

- `supabase/schema.sql` — full schema, idempotent
- `supabase/migration_github.sql` — adds GitHub token column
- `supabase/migration_task_description.sql` — adds description column to tasks

## GitHub integration

1. Create a Personal Access Token at [github.com/settings/tokens](https://github.com/settings/tokens/new?scopes=repo&description=Cockpit%20Dashboard) with `repo` scope (or `public_repo` if all your work is public).
2. Open Settings in the app (click your user chip in the sidebar) → GitHub → paste the token → Connect.
3. On any code-type project, click **Link repo** → pick from your repos.
4. Recent commits appear on the project detail page.
5. The 12-week commit heatmap on the Today view aggregates commits across all linked repos.

All GitHub data is fetched client-side — no server proxy. Your token is stored in your `profiles` row, locked by RLS.

## Roadmap

See [ROADMAP.md](./ROADMAP.md).

## License

MIT
