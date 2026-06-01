import { create } from "zustand";
import type {
  LearningTrack,
  Milestone,
  DailyHabit,
  HabitCompletion,
} from "./types";
import { supabase } from "./supabase/client";
import { useStore } from "./store";
import { uid as genId, isoDate, addDays } from "./utils";
import {
  trackFromRow,
  trackToRow,
  milestoneFromRow,
  milestoneToRow,
  habitFromRow,
  habitToRow,
  completionFromRow,
} from "./supabase/learningMappers";

const FINANCE_TRACK_NAME = "Finance & Macro Literacy";

// Learning data lives in its own store so the main store.ts stays lean. It reads
// the authenticated user id from the main store (one-way dependency) and is
// loaded lazily the first time a Learning page mounts.
function uidOf(): string | undefined {
  return useStore.getState().user?.id;
}

interface LearningState {
  tracks: LearningTrack[];
  milestones: Milestone[];
  habits: DailyHabit[];
  completions: HabitCompletion[];
  loaded: boolean;

  loadLearning: () => Promise<void>;

  // tracks
  addTrack: (
    t: Omit<LearningTrack, "id" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  updateTrack: (id: string, patch: Partial<LearningTrack>) => Promise<void>;
  archiveTrack: (id: string, archived?: boolean) => Promise<void>;
  deleteTrack: (id: string) => Promise<void>;

  // milestones
  addMilestone: (m: Omit<Milestone, "id" | "createdAt">) => Promise<string>;
  updateMilestone: (id: string, patch: Partial<Milestone>) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;
  toggleMilestoneComplete: (id: string) => Promise<void>;
  toggleSubItem: (milestoneId: string, subItemId: string) => Promise<void>;

  // habits
  addHabit: (h: Omit<DailyHabit, "id" | "createdAt">) => Promise<string>;
  updateHabit: (id: string, patch: Partial<DailyHabit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;

  // completions
  toggleHabitCompletion: (
    habitId: string,
    date: string,
    minutes?: number
  ) => Promise<void>;
  setHabitMinutes: (
    habitId: string,
    date: string,
    minutes: number | undefined
  ) => Promise<void>;

  // seed
  seedFinanceTrack: () => Promise<{ created: boolean }>;
}

export const useLearningStore = create<LearningState>()((set, get) => ({
  tracks: [],
  milestones: [],
  habits: [],
  completions: [],
  loaded: false,

  // ============== LOAD ==============
  loadLearning: async () => {
    const uid = uidOf();
    if (!uid) return;
    if (get().loaded) return; // guard: don't refetch on revisit
    const [tracksRes, milestonesRes, habitsRes, completionsRes] =
      await Promise.all([
        supabase
          .from("learning_tracks")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase
          .from("milestones")
          .select("*")
          .order("order_index", { ascending: true }),
        supabase
          .from("daily_habits")
          .select("*")
          .order("order_index", { ascending: true }),
        supabase
          .from("habit_completions")
          .select("*")
          .order("completed_on", { ascending: true }),
      ]);
    set({
      tracks: (tracksRes.data ?? []).map(trackFromRow),
      milestones: (milestonesRes.data ?? []).map(milestoneFromRow),
      habits: (habitsRes.data ?? []).map(habitFromRow),
      completions: (completionsRes.data ?? []).map(completionFromRow),
      loaded: true,
    });
  },

  // ============== TRACKS ==============
  addTrack: async (t) => {
    const uid = uidOf();
    if (!uid) throw new Error("not authed");
    const { data, error } = await supabase
      .from("learning_tracks")
      .insert({ ...trackToRow(t as Partial<LearningTrack>), user_id: uid })
      .select()
      .single();
    if (error) throw error;
    const track = trackFromRow(data);
    set((s) => ({ tracks: [...s.tracks, track] }));
    return track.id;
  },

  updateTrack: async (id, patch) => {
    const { data, error } = await supabase
      .from("learning_tracks")
      .update(trackToRow(patch))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    const track = trackFromRow(data);
    set((s) => ({ tracks: s.tracks.map((t) => (t.id === id ? track : t)) }));
  },

  archiveTrack: async (id, archived = true) => {
    await get().updateTrack(id, { archived });
  },

  deleteTrack: async (id) => {
    // milestones + daily_habits cascade via FK; habit_completions cascade via habit.
    const { error } = await supabase
      .from("learning_tracks")
      .delete()
      .eq("id", id);
    if (error) throw error;
    set((s) => {
      const habitIds = new Set(
        s.habits.filter((h) => h.trackId === id).map((h) => h.id)
      );
      return {
        tracks: s.tracks.filter((t) => t.id !== id),
        milestones: s.milestones.filter((m) => m.trackId !== id),
        habits: s.habits.filter((h) => h.trackId !== id),
        completions: s.completions.filter((c) => !habitIds.has(c.habitId)),
      };
    });
  },

  // ============== MILESTONES ==============
  addMilestone: async (m) => {
    const uid = uidOf();
    if (!uid) throw new Error("not authed");
    const { data, error } = await supabase
      .from("milestones")
      .insert({ ...milestoneToRow(m as Partial<Milestone>), user_id: uid })
      .select()
      .single();
    if (error) throw error;
    const milestone = milestoneFromRow(data);
    set((s) => ({ milestones: [...s.milestones, milestone] }));
    return milestone.id;
  },

  updateMilestone: async (id, patch) => {
    const { data, error } = await supabase
      .from("milestones")
      .update(milestoneToRow(patch))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    const milestone = milestoneFromRow(data);
    set((s) => ({
      milestones: s.milestones.map((m) => (m.id === id ? milestone : m)),
    }));
  },

  deleteMilestone: async (id) => {
    const { error } = await supabase.from("milestones").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ milestones: s.milestones.filter((m) => m.id !== id) }));
  },

  toggleMilestoneComplete: async (id) => {
    const m = get().milestones.find((x) => x.id === id);
    if (!m) return;
    await get().updateMilestone(id, {
      completedAt: m.completedAt ? undefined : new Date().toISOString(),
    });
  },

  // Flip one sub-item, persist the whole jsonb array, and auto-set completed_at
  // when (and only when) every sub-item is done. Keeps an existing stamp so the
  // completion date doesn't drift; clears it if a box is later unchecked.
  toggleSubItem: async (milestoneId, subItemId) => {
    const m = get().milestones.find((x) => x.id === milestoneId);
    if (!m) return;

    const nextSubItems = m.subItems.map((si) =>
      si.id === subItemId ? { ...si, done: !si.done } : si
    );
    const allDone =
      nextSubItems.length > 0 && nextSubItems.every((si) => si.done);
    const nextCompletedAt = allDone
      ? m.completedAt ?? new Date().toISOString()
      : undefined;

    const { data, error } = await supabase
      .from("milestones")
      .update({
        sub_items: nextSubItems,
        completed_at: nextCompletedAt ?? null,
      })
      .eq("id", milestoneId)
      .select()
      .single();
    if (error) throw error;
    const milestone = milestoneFromRow(data);
    set((s) => ({
      milestones: s.milestones.map((x) =>
        x.id === milestoneId ? milestone : x
      ),
    }));
  },

  // ============== HABITS ==============
  addHabit: async (h) => {
    const uid = uidOf();
    if (!uid) throw new Error("not authed");
    const { data, error } = await supabase
      .from("daily_habits")
      .insert({ ...habitToRow(h as Partial<DailyHabit>), user_id: uid })
      .select()
      .single();
    if (error) throw error;
    const habit = habitFromRow(data);
    set((s) => ({ habits: [...s.habits, habit] }));
    return habit.id;
  },

  updateHabit: async (id, patch) => {
    const { data, error } = await supabase
      .from("daily_habits")
      .update(habitToRow(patch))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    const habit = habitFromRow(data);
    set((s) => ({ habits: s.habits.map((h) => (h.id === id ? habit : h)) }));
  },

  deleteHabit: async (id) => {
    const { error } = await supabase.from("daily_habits").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({
      habits: s.habits.filter((h) => h.id !== id),
      completions: s.completions.filter((c) => c.habitId !== id),
    }));
  },

  // ============== COMPLETIONS ==============
  // True optimistic toggle. Respects unique(habit_id, completed_on): a second
  // click on an already-completed day removes the completion. Rolls back to the
  // pre-click snapshot on error.
  toggleHabitCompletion: async (habitId, date, minutes) => {
    const uid = uidOf();
    if (!uid) throw new Error("not authed");

    const prev = get().completions;
    const existing = prev.find(
      (c) => c.habitId === habitId && c.completedOn === date
    );

    if (existing) {
      set({ completions: prev.filter((c) => c.id !== existing.id) });
      const { error } = await supabase
        .from("habit_completions")
        .delete()
        .eq("id", existing.id);
      if (error) {
        set({ completions: prev });
        throw error;
      }
      return;
    }

    const tempId = genId("tmp");
    const optimistic: HabitCompletion = {
      id: tempId,
      habitId,
      completedOn: date,
      minutesSpent: minutes,
      createdAt: new Date().toISOString(),
    };
    set({ completions: [...prev, optimistic] });

    const { data, error } = await supabase
      .from("habit_completions")
      .insert({
        user_id: uid,
        habit_id: habitId,
        completed_on: date,
        minutes_spent: minutes ?? null,
      })
      .select()
      .single();
    if (error) {
      set({ completions: prev });
      throw error;
    }
    const real = completionFromRow(data);
    set((s) => ({
      completions: s.completions.map((c) => (c.id === tempId ? real : c)),
    }));
  },

  // Log/clear actual minutes for a day. If the day isn't completed yet, this
  // creates the completion (logging minutes implies you did it). Optimistic.
  setHabitMinutes: async (habitId, date, minutes) => {
    const uid = uidOf();
    if (!uid) throw new Error("not authed");

    const prev = get().completions;
    const existing = prev.find(
      (c) => c.habitId === habitId && c.completedOn === date
    );

    if (existing) {
      set({
        completions: prev.map((c) =>
          c.id === existing.id ? { ...c, minutesSpent: minutes } : c
        ),
      });
      const { error } = await supabase
        .from("habit_completions")
        .update({ minutes_spent: minutes ?? null })
        .eq("id", existing.id);
      if (error) {
        set({ completions: prev });
        throw error;
      }
      return;
    }

    const tempId = genId("tmp");
    const optimistic: HabitCompletion = {
      id: tempId,
      habitId,
      completedOn: date,
      minutesSpent: minutes,
      createdAt: new Date().toISOString(),
    };
    set({ completions: [...prev, optimistic] });
    const { data, error } = await supabase
      .from("habit_completions")
      .insert({
        user_id: uid,
        habit_id: habitId,
        completed_on: date,
        minutes_spent: minutes ?? null,
      })
      .select()
      .single();
    if (error) {
      set({ completions: prev });
      throw error;
    }
    set((s) => ({
      completions: s.completions.map((c) =>
        c.id === tempId ? completionFromRow(data) : c
      ),
    }));
  },

  // ============== SEED ==============
  // Idempotent: no-op if a track named FINANCE_TRACK_NAME already exists.
  seedFinanceTrack: async () => {
    const uid = uidOf();
    if (!uid) throw new Error("not authed");

    if (get().tracks.some((t) => t.name === FINANCE_TRACK_NAME)) {
      return { created: false };
    }
    const { data: existing } = await supabase
      .from("learning_tracks")
      .select("id")
      .eq("name", FINANCE_TRACK_NAME)
      .maybeSingle();
    if (existing) return { created: false };

    const today = new Date();
    const startedOn = isoDate(today);

    // 1) track
    const { data: trackRow, error: trackErr } = await supabase
      .from("learning_tracks")
      .insert({
        user_id: uid,
        name: FINANCE_TRACK_NAME,
        description:
          "Build deep knowledge in finance, economics, global macro, and investing. Bias macro for the first quarter. Long-horizon goal: use AI fluency + finance literacy to make real money in markets.",
        color_accent: "amber",
        started_on: startedOn,
        target_finish_on: isoDate(addDays(today, 90)),
        archived: false,
      })
      .select()
      .single();
    if (trackErr) throw trackErr;
    const track = trackFromRow(trackRow);
    const trackId = track.id;

    // 2) milestones (remap the new trackId onto each child)
    const milestoneRows = financeMilestoneSeed(today).map((m) => ({
      user_id: uid,
      track_id: trackId,
      title: m.title,
      description: m.description ?? null,
      order_index: m.orderIndex,
      target_date: m.targetDate ?? null,
      completed_at: null,
      sub_items: m.subItems,
    }));
    const { data: mData, error: mErr } = await supabase
      .from("milestones")
      .insert(milestoneRows)
      .select();
    if (mErr) throw mErr;

    // 3) habits
    const habitRows = financeHabitSeed().map((h) => ({
      user_id: uid,
      track_id: trackId,
      name: h.name,
      description: h.description ?? null,
      cadence: h.cadence,
      days_of_week: h.daysOfWeek ?? [],
      target_minutes: h.targetMinutes ?? null,
      order_index: h.orderIndex,
      active: true,
    }));
    const { data: hData, error: hErr } = await supabase
      .from("daily_habits")
      .insert(habitRows)
      .select();
    if (hErr) throw hErr;

    set((s) => ({
      tracks: [...s.tracks, track],
      milestones: [...s.milestones, ...(mData ?? []).map(milestoneFromRow)],
      habits: [...s.habits, ...(hData ?? []).map(habitFromRow)],
    }));
    return { created: true };
  },
}));

// ---- Finance & Macro seed content (verbatim from the build spec) ----
function sub(label: string) {
  return { id: genId("sub"), label, done: false };
}

function financeMilestoneSeed(today: Date) {
  return [
    {
      orderIndex: 0,
      title: "Month 1 — Foundations",
      targetDate: isoDate(addDays(today, 30)),
      description:
        "Establish the daily rhythm. Get the math gap unblocked. Start building macro vocabulary.",
      subItems: [
        sub("Pre-algebra refresh complete on Khan Academy"),
        sub("Khan Macroeconomics course ~50% complete"),
        sub(
          "Read 4 chapters of Dalio's Principles for Dealing with the Changing World Order"
        ),
        sub(
          "Write 4 Sunday tie-in notes (one macro concept → memecoin-agent or ladder bot connection)"
        ),
      ],
    },
    {
      orderIndex: 1,
      title: "Month 2 — Build depth",
      targetDate: isoDate(addDays(today, 60)),
      description:
        "Math levels up. Macro framework complete. Begin financial history.",
      subItems: [
        sub("Algebra 1 underway on Khan Academy"),
        sub("Khan Macroeconomics course complete"),
        sub("Dalio book ~75% done"),
        sub("Start book #2: The Ascent of Money — Niall Ferguson"),
      ],
    },
    {
      orderIndex: 2,
      title: "Month 3 — Reassess + level up",
      targetDate: isoDate(addDays(today, 90)),
      description:
        "Move from intro material to graduate-level macro. Reassess the plan for Q2.",
      subItems: [
        sub("Algebra 1 ~50% complete"),
        sub("Dalio book finished"),
        sub("Start Yale's Financial Markets w/ Robert Shiller (free, Coursera/YouTube)"),
        sub("90-day retro written in the hudson-brain vault"),
      ],
    },
  ];
}

function financeHabitSeed() {
  return [
    {
      orderIndex: 0,
      name: "Khan Academy Math",
      cadence: "mon_thu" as const,
      daysOfWeek: [] as number[],
      targetMinutes: 15,
      description: "Pre-algebra → Algebra 1 → Algebra 2 → Stats. 15 min/day compounds.",
    },
    {
      orderIndex: 1,
      name: "Khan Macroeconomics",
      cadence: "mon_wed" as const,
      daysOfWeek: [],
      targetMinutes: 45,
      description: "Structured macro course — GDP, inflation, central banks, FX.",
    },
    {
      orderIndex: 2,
      name: "Book reading",
      cadence: "sat_sun" as const,
      daysOfWeek: [],
      targetMinutes: 45,
      description: "Currently: Dalio's Changing World Order. One chapter/week.",
    },
    {
      orderIndex: 3,
      name: "AI-projects macro tie-in",
      cadence: "sun" as const,
      daysOfWeek: [],
      targetMinutes: 30,
      description:
        "Pick one macro concept from this week. Write 3–5 sentences connecting it to memecoin-agent or the ladder bot. Save to hudson-brain vault under 30-areas/finance-learning/tie-ins/.",
    },
  ];
}

// ---- reset learning state on auth change (sign-in/out) ----
// One narrow subscription to the main store; resets only (no fetch) so the next
// Learning page mount triggers a fresh load for the new user.
let lastUid: string | undefined = useStore.getState().user?.id;
useStore.subscribe((s) => {
  const uid = s.user?.id;
  if (uid !== lastUid) {
    lastUid = uid;
    useLearningStore.setState({
      tracks: [],
      milestones: [],
      habits: [],
      completions: [],
      loaded: false,
    });
  }
});
