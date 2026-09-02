# Habits — design handoff

Contents:

- `HABITS.md` — the build plan. Schema, store, components, pages, tokens, build order, acceptance criteria. Start here.
- `habits-designs.html` — the designs, standalone. Open in any browser, no server or install. Pan and zoom the canvas.
- `source/` — the editable original (`Habits Pages.dc.html` + `support.js`). Keep the two files together.

## Reading the designs

Three screens, each shown at desktop 1280px and mobile 390px:

- `2a` — Habits page (`/habits`)
- `2b` — Build a habit (modal on desktop, full sheet on mobile)
- `2c` — Habit detail with the calendar heatmap (`/habits/:habitId`)

The designs are interactive: filter chips filter, check circles toggle, the form's category / cadence / day controls work, and the month calendar steps and toggles. The data is fixture data with a fixed "today" of 2026-08-31.

Screen ids (`2a`, `2b`, `2c`) are the same ids used in the build plan's route table, so a reference there points at a specific frame.

## What is not in the designs

Empty states, the category manager dialog, and archive flows are specified in `HABITS.md` but not drawn. Build them from the described patterns in the existing app (`Learning.tsx` empty state, `ManageTypesDialog.tsx`).
