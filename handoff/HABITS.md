# Habits page — build plan

Handoff spec for Claude Code. Self-contained: everything needed to build the Habits module without seeing the design chat.

Design reference (Omelette): `Habits Pages.dc.html` — three screens, desktop and mobile.
Concept exploration (superseded, kept for reference): `Habits.dc.html`.

## Goal

A standalone Habits page for life habits: daily practice with categories, cadence, filtering, streaks, and a calendar heatmap. Separate from the Learning module. Learning's `daily_habits` stay exactly where they are, scoped to their track. Nothing in `learningStore.ts` or the Learning pages changes.

Scope decisions already made:
- Done / not done only. No minutes, no counts. (Learning already owns minutes.)
- Categories are user-defined, like custom project types, seeded with Health, Mind, Home.
- Filters: category and cadence. Plus a text search over name.
- The page opens on a due-today checklist grouped by category.

## Routes and screens

| Route | Screen | Design ref |
| --- | --- | --- |
| `/habits` | Habits page: due-today checklist, filters, this-week grid, consistency bars | `2a` |
| (dialog) | Build a habit: `Modal.tsx` dialog on desktop, full sheet on mobile | `2b` |
| `/habits/:habitId` | Habit detail: stats, month calendar heatmap, 12-week strip, recent log | `2c` |

Nav placement:
- `Layout.tsx` sidebar `navItems`: insert `{ to: "/habits", label: "Habits", icon: Repeat }` after Learning. Badge shows the count of habits due today that are not yet done, styled like the Inbox badge (amber pill, `text-ink-950`).
- `BottomNav.tsx` `tabs`: Habits replaces Learning in the five-tab thumb nav (Today, Projects, Habits, Inbox, Plan). Learning stays reachable from the drawer.
- `App.tsx`: two new routes inside the `Layout` route.
- `CommandPalette.tsx`: add "Go to Habits" and "New habit" actions alongside the existing navigation entries.

## Schema

New migration `supabase/migration_habits.sql`, idempotent, same idiom as `migration_learning.sql`: every table owns `user_id`, owner-only RLS, `set_updated_at()` trigger where the table has `updated_at`. Mirror the same statements into `supabase/schema.sql`.

```sql
create table if not exists public.habit_categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  slug        text not null,
  accent      text not null default 'amber'
                check (accent in ('amber','rose','emerald','sky','violet')),
  order_index int  not null default 0,
  created_at  timestamptz not null default now(),
  unique (user_id, slug)
);

create table if not exists public.habits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  category_id  uuid references public.habit_categories(id) on delete set null,
  name         text not null,
  why          text,
  cadence      text not null default 'daily'
                 check (cadence in ('daily','weekdays','x_per_week','weekly','custom')),
  days_of_week int[] not null default '{}',   -- 0=Sun..6=Sat; used for custom, weekly, x_per_week
  times_per_week int,                          -- only when cadence='x_per_week'
  reminder_at  time,
  started_on   date not null default current_date,
  archived     boolean not null default false,
  order_index  int  not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.habit_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  habit_id     uuid not null references public.habits(id) on delete cascade,
  completed_on date not null,
  created_at   timestamptz not null default now(),
  unique (habit_id, completed_on)
);
```

Indexes: `habits(user_id)`, `habits(user_id, archived)`, `habit_logs(user_id)`, `habit_logs(habit_id, completed_on)`. The unique constraint on `(habit_id, completed_on)` also serves the streak and heatmap scans.

Note the table is `habits`, not `daily_habits`. `daily_habits` belongs to Learning and is untouched.

Seed: on first load, if a user has zero `habit_categories` rows, insert Health (emerald), Mind (violet), Home (sky). Do this in the store loader, not in SQL, so it stays per-user and idempotent.

## Types and mappers

`src/lib/types.ts`:

```ts
export type HabitCadence = "daily" | "weekdays" | "x_per_week" | "weekly" | "custom";

export interface HabitCategory {
  id: string; name: string; slug: string;
  accent: TrackAccent; orderIndex: number;
}

export interface Habit {
  id: string; categoryId?: string; name: string; why?: string;
  cadence: HabitCadence; daysOfWeek: number[]; timesPerWeek?: number;
  reminderAt?: string; startedOn: string; archived: boolean; orderIndex: number;
}

export interface HabitLog { id: string; habitId: string; completedOn: string; }
```

Reuse `TrackAccent` and `src/lib/learningAccent.ts` for accent classes. Do not add palette colors and do not build a second accent map.

`src/lib/supabase/habitMappers.ts`: snake_case rows to camelCase and back, same shape as `learningMappers.ts`. No Supabase queries in components.

## Store

`src/lib/habitStore.ts`, a third Zustand store, lazy-loaded on first Habits page mount and reset on auth change, exactly like `learningStore.ts`.

State: `categories`, `habits`, `logs`, `loaded`.

Actions, all optimistic (update local state first, persist async, roll back on error):
- `loadHabits()` — fetch all three tables, seed default categories if empty
- `addHabit(payload)`, `updateHabit(id, patch)`, `archiveHabit(id)`, `deleteHabit(id)`
- `toggleHabitLog(habitId, isoDate)` — insert or delete one `habit_logs` row
- `addCategory`, `updateCategory`, `deleteCategory` (deleting sets member habits to no category)

`src/lib/habitSelectors.ts`, pure functions, no store access, mirroring `learningSelectors.ts`:
- `appliesOn(habit, isoDate)` — cadence to day-of-week rule
- `getHabitsDueOn(isoDate, habits)`
- `getStreak(habitId, habit, logs, todayIso)` — skips days the cadence does not apply
- `getWeeklyHeatmap(habitId, habit, logs, weeks, todayIso)` — reuse the `HeatmapCell` shape: `{ date, due, completed }`
- `getMonthGrid(habit, logs, year, month, todayIso)` — Monday-first, leading blanks, per-cell `due` / `completed` / `future`
- `getKeptRate(habitId, habit, logs, days)`

## Components

New, in `src/components/habits/`:
- `HabitRow.tsx` — one checklist row. Copy the interaction and classes from `learning/TodayHabitRow.tsx`, minus the minutes input: 20px round button, accent fill when done, `Check` icon with the same framer-motion spring, name dims to `text-ink-400` when done, cadence and streak in `font-mono text-[11px]`, `ChevronRight` at the end (the row links to detail).
- `HabitWeekGrid.tsx` — right-rail panel, one row per habit, 7 cells of `w-3.5 h-3.5 rounded-[3px]`, weekday letters M T W T F S S in `text-[9px] font-mono text-ink-600`.
- `ConsistencyBars.tsx` — per category, 30-day kept rate, `h-1.5 bg-ink-800` track with an accent fill.
- `HabitCalendar.tsx` — month grid, 44px cells desktop (40px mobile), month stepper with `ChevronLeft` / `ChevronRight`. Cell states: kept = accent fill with `text-ink-950`; due but missed = `bg-ink-800`; cadence does not apply = `bg-ink-900`; future = transparent with `border-ink-800/60`; today = `border-ink-500` ring when not kept. Cells are clickable and call `toggleHabitLog`.
- `HabitHeatmapStrip.tsx` — the 12-week strip. Same cell logic as `learning/HabitHeatmap.tsx`, with a less-to-more legend underneath.

New dialogs, in `src/components/dialogs/`:
- `HabitDialog.tsx` — create and edit, using the `Modal.tsx` wrapper at `width={520}` with `FormRow`, `ModalActions`, `inputCls()`. Fields: Name, Category (accent-tinted pills plus a dashed "New category" button), Cadence (four segments: daily / weekdays / 3x per wk / weekly), Repeats on (the S M T W T F S picker and the weekdays / weekend / daily / clear presets, copied from `RoutineDialog.tsx`), Reminder, Start date, Why this habit (optional textarea). Picking a cadence segment preselects the matching days. Save is disabled until name is non-empty and at least one day is selected. Intro row at the top: amber 32px icon box (`bg-accent-amber/10 border-accent-amber/20`) with the `Repeat` icon and one line of explanation, same as `RoutineDialog`.
- `ManageHabitCategoriesDialog.tsx` — rename, reorder, set accent, delete. Model it on `ManageTypesDialog.tsx`.

Mobile: `HabitDialog` renders as a full sheet under `md`, with Cancel and Save in the top bar and 44px minimum touch targets. Same component, responsive classes, not a second implementation.

New pages, in `src/pages/`:
- `Habits.tsx` — header block matching `Projects.tsx` (mono uppercase eyebrow "Daily practice", `text-3xl` title with a muted count, white "New habit" button). Filter row: search input, then category chips, then cadence chips, all `px-2.5 py-1 text-xs rounded font-mono uppercase tracking-wider`, active state `bg-ink-700 text-ink-50`, plus the `SlidersHorizontal` button that opens the category manager. Body: a 12-column grid, an 8-column Due today panel (`rounded-2xl border-ink-800 bg-ink-900/40`, `hero-glow` overlay, amber gradient hairline on the top edge, groups by category with a dot, mono uppercase label, hairline rule and count) and a 4-column rail holding the week grid and consistency bars. Mobile: chips scroll horizontally with the `-mx-4 px-4` bleed, the panel is full width, and the existing amber FAB opens `HabitDialog`.
- `HabitDetail.tsx` — back link to `/habits`, category dot plus title, category and cadence pills, started and day-number line, a "Mark done today" button (turns into a tinted "Done today" state), four stat cards (Current, Longest, 30-day kept, Total check-ins), the month calendar, the 12-week strip, and a recent log list. Mobile shows three stat cards and drops the log.

Empty state on `/habits`: the `Learning.tsx` pattern, a 56px `rounded-2xl bg-ink-900 border-ink-800` icon tile with `Repeat`, a headline, one line of copy, and a "New habit" button.

## Tokens

Everything comes from existing config, no new values.

- Surfaces: page `bg-ink-950`, panels `bg-ink-900/40` or `/60`, borders `border-ink-800`, hover `border-ink-700`
- Text: primary `text-ink-100`, headings `text-ink-50`, secondary `text-ink-400`, muted `text-ink-500`, faint `text-ink-600`
- Accents: category accents from `learningAccent.ts` (amber, rose, emerald, sky, violet). Page-level amber only, for streaks and the active thumb-nav tab.
- Type: Inter for UI, JetBrains Mono for labels, counts, cadence, and dates. Section labels are `text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono`.
- Motion: framer-motion `initial={{ opacity: 0 }} animate={{ opacity: 1 }}` on grids, the spring on the check mark, nothing else.

## Build order

1. Migration plus `schema.sql` mirror, types, mappers.
2. `habitStore.ts` and `habitSelectors.ts` with the category seed.
3. `Habits.tsx` with filters and the checklist. Wire nav, routes, palette.
4. `HabitDialog.tsx` and the category manager.
5. `HabitDetail.tsx` with the calendar and strip.
6. Mobile pass on both pages.

## Acceptance criteria

- `/habits` lists habits due today, grouped by category, and a tap toggles completion with an optimistic write that survives a reload.
- Category and cadence chips filter the list. Combining them narrows correctly. Search matches on name.
- Creating a habit from the dialog on desktop and the sheet on mobile produces a habit that appears in the right group with the right cadence.
- Streaks skip days the cadence does not apply, so a weekly habit kept every Sunday shows a growing streak.
- The month calendar renders the correct leading blanks for the month, marks today, and toggling a cell writes or deletes exactly one `habit_logs` row.
- The sidebar badge and the Learning module are unaffected: Learning habits do not appear on `/habits`, and habits do not appear on a learning track.
- Archiving a habit removes it from `/habits` without deleting its logs.

## Out of scope

Minutes and counts, reminders that actually fire, habit-to-project or habit-to-track linking, week-grid drag interactions, and any change to Learning. Each is a separate pass if wanted later.

## Verification

Run `npm run build` (`tsc -b` plus bundle, the only automated check in this repo). Then state what was manually verified: create a habit, toggle it on `/habits`, reload and confirm it persisted, open the detail page, step the calendar back a month, toggle a past day, and check `/learning` still renders its own habits.
