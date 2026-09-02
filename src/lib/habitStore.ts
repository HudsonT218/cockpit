import { create } from "zustand";
import type { Habit, HabitCategory, HabitLog, TrackAccent } from "./types";
import { supabase } from "./supabase/client";
import { useStore } from "./store";
import { slugify } from "./projectTypes";
import {
  categoryFromRow,
  categoryToRow,
  habitFromRow,
  habitToRow,
  logFromRow,
} from "./supabase/habitMappers";

// Life-habit data lives in its own store so store.ts stays lean. It reads
// the authenticated user id from the main store (one-way dependency) and is
// loaded lazily the first time Layout or a Habits page mounts.
function uidOf(): string | undefined {
  return useStore.getState().user?.id;
}

const DEFAULT_CATEGORIES: {
  name: string;
  slug: string;
  accent: TrackAccent;
  orderIndex: number;
}[] = [
  { name: "Health", slug: "health", accent: "emerald", orderIndex: 0 },
  { name: "Mind", slug: "mind", accent: "violet", orderIndex: 1 },
  { name: "Home", slug: "home", accent: "sky", orderIndex: 2 },
];

export type HabitPayload = Omit<Habit, "id" | "createdAt">;

interface HabitState {
  categories: HabitCategory[];
  habits: Habit[];
  logs: HabitLog[];
  loaded: boolean;

  loadHabits: (force?: boolean) => Promise<void>;

  addHabit: (h: HabitPayload) => Promise<string>;
  updateHabit: (id: string, patch: Partial<Habit>) => Promise<void>;
  archiveHabit: (id: string, archived?: boolean) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;

  toggleHabitLog: (habitId: string, isoDate: string) => Promise<void>;

  addCategory: (name: string, accent?: TrackAccent) => Promise<string | null>;
  updateCategory: (id: string, patch: Partial<HabitCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (id: string, direction: -1 | 1) => Promise<void>;
}

export const useHabitStore = create<HabitState>()((set, get) => ({
  categories: [],
  habits: [],
  logs: [],
  loaded: false,

  loadHabits: async (force = false) => {
    const uid = uidOf();
    if (!uid) return;
    if (get().loaded && !force) return;

    const [catsRes, habitsRes, logsRes] = await Promise.all([
      supabase
        .from("habit_categories")
        .select("*")
        .order("order_index", { ascending: true }),
      supabase
        .from("habits")
        .select("*")
        .order("order_index", { ascending: true }),
      supabase
        .from("habit_logs")
        .select("*")
        .order("completed_on", { ascending: true }),
    ]);

    if (catsRes.error || habitsRes.error || logsRes.error) {
      // eslint-disable-next-line no-console
      console.warn(
        "[habits] load failed",
        catsRes.error ?? habitsRes.error ?? logsRes.error
      );
      return;
    }

    let categories = (catsRes.data ?? []).map(categoryFromRow);

    if (categories.length === 0) {
      const { data: seeded, error: seedErr } = await supabase
        .from("habit_categories")
        .insert(
          DEFAULT_CATEGORIES.map((c) => ({
            ...categoryToRow(c),
            user_id: uid,
          }))
        )
        .select();
      if (!seedErr && seeded) {
        categories = seeded.map(categoryFromRow);
      } else {
        const { data: retry } = await supabase
          .from("habit_categories")
          .select("*")
          .order("order_index", { ascending: true });
        categories = (retry ?? []).map(categoryFromRow);
      }
    }

    set({
      categories,
      habits: (habitsRes.data ?? []).map(habitFromRow),
      logs: (logsRes.data ?? []).map(logFromRow),
      loaded: true,
    });
  },

  addHabit: async (h) => {
    const uid = uidOf();
    if (!uid) throw new Error("not authed");
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const optimistic: Habit = { ...h, id, createdAt: now };
    const prev = get().habits;
    set({ habits: [...prev, optimistic] });

    // Don't use .select().single() here: the insert can succeed while the
    // representation round-trip hangs or errors, which used to roll back a
    // habit that was already in the database.
    const { error } = await supabase
      .from("habits")
      .insert({ id, ...habitToRow(h), user_id: uid });
    if (error) {
      const { data: found } = await supabase
        .from("habits")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (found) {
        const real = habitFromRow(found);
        set((s) => ({
          habits: s.habits.map((x) => (x.id === id ? real : x)),
        }));
        return real.id;
      }
      set({ habits: prev });
      throw error;
    }
    return id;
  },

  updateHabit: async (id, patch) => {
    const prev = get().habits;
    set({
      habits: prev.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    });
    const { error } = await supabase
      .from("habits")
      .update(habitToRow(patch))
      .eq("id", id);
    if (error) {
      const { data: found } = await supabase
        .from("habits")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (found) {
        set((s) => ({
          habits: s.habits.map((h) => (h.id === id ? habitFromRow(found) : h)),
        }));
        return;
      }
      set({ habits: prev });
      throw error;
    }
  },

  archiveHabit: async (id, archived = true) => {
    await get().updateHabit(id, { archived });
  },

  deleteHabit: async (id) => {
    const prevHabits = get().habits;
    const prevLogs = get().logs;
    set({
      habits: prevHabits.filter((h) => h.id !== id),
      logs: prevLogs.filter((l) => l.habitId !== id),
    });
    const { error } = await supabase.from("habits").delete().eq("id", id);
    if (error) {
      set({ habits: prevHabits, logs: prevLogs });
      throw error;
    }
  },

  toggleHabitLog: async (habitId, isoDate) => {
    const uid = uidOf();
    if (!uid) throw new Error("not authed");

    const prev = get().logs;
    const existing = prev.find(
      (l) => l.habitId === habitId && l.completedOn === isoDate
    );

    if (existing) {
      set({ logs: prev.filter((l) => l.id !== existing.id) });
      const { error } = await supabase
        .from("habit_logs")
        .delete()
        .eq("id", existing.id);
      if (error) {
        set({ logs: prev });
        throw error;
      }
      return;
    }

    const tempId = crypto.randomUUID();
    const optimistic: HabitLog = {
      id: tempId,
      habitId,
      completedOn: isoDate,
      createdAt: new Date().toISOString(),
    };
    set({ logs: [...prev, optimistic] });

    const { error } = await supabase.from("habit_logs").insert({
      id: tempId,
      user_id: uid,
      habit_id: habitId,
      completed_on: isoDate,
    });
    if (error) {
      const { data: found } = await supabase
        .from("habit_logs")
        .select("*")
        .eq("id", tempId)
        .maybeSingle();
      if (found) {
        set((s) => ({
          logs: s.logs.map((l) => (l.id === tempId ? logFromRow(found) : l)),
        }));
        return;
      }
      set({ logs: prev });
      throw error;
    }
  },

  addCategory: async (name, accent = "amber") => {
    const uid = uidOf();
    if (!uid) throw new Error("not authed");
    const trimmed = name.trim();
    if (!trimmed) return null;

    const taken = new Set(get().categories.map((c) => c.slug));
    const base = slugify(trimmed) || "category";
    let slug = base;
    let n = 2;
    while (taken.has(slug)) slug = `${base}-${n++}`;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const optimistic: HabitCategory = {
      id,
      name: trimmed,
      slug,
      accent,
      orderIndex: get().categories.length,
      createdAt: now,
    };
    const prev = get().categories;
    set({ categories: [...prev, optimistic] });

    const { error } = await supabase.from("habit_categories").insert({
      id,
      user_id: uid,
      ...categoryToRow(optimistic),
    });
    if (error) {
      const { data: found } = await supabase
        .from("habit_categories")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (found) {
        const real = categoryFromRow(found);
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? real : c)),
        }));
        return real.id;
      }
      set({ categories: prev });
      throw error;
    }
    return id;
  },

  updateCategory: async (id, patch) => {
    const prev = get().categories;
    set({
      categories: prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
    const { data, error } = await supabase
      .from("habit_categories")
      .update(categoryToRow(patch))
      .eq("id", id)
      .select()
      .single();
    if (error) {
      set({ categories: prev });
      throw error;
    }
    const real = categoryFromRow(data);
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? real : c)),
    }));
  },

  deleteCategory: async (id) => {
    const prevCats = get().categories;
    const prevHabits = get().habits;
    set({
      categories: prevCats.filter((c) => c.id !== id),
      habits: prevHabits.map((h) =>
        h.categoryId === id ? { ...h, categoryId: undefined } : h
      ),
    });
    const { error } = await supabase
      .from("habit_categories")
      .delete()
      .eq("id", id);
    if (error) {
      set({ categories: prevCats, habits: prevHabits });
      throw error;
    }
  },

  reorderCategories: async (id, direction) => {
    const ordered = [...get().categories].sort(
      (a, b) => a.orderIndex - b.orderIndex
    );
    const i = ordered.findIndex((c) => c.id === id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= ordered.length) return;
    const a = ordered[i];
    const b = ordered[j];
    const prev = get().categories;
    set({
      categories: prev.map((c) => {
        if (c.id === a.id) return { ...c, orderIndex: b.orderIndex };
        if (c.id === b.id) return { ...c, orderIndex: a.orderIndex };
        return c;
      }),
    });
    const results = await Promise.all([
      supabase
        .from("habit_categories")
        .update({ order_index: b.orderIndex })
        .eq("id", a.id),
      supabase
        .from("habit_categories")
        .update({ order_index: a.orderIndex })
        .eq("id", b.id),
    ]);
    const error = results.find((r) => r.error)?.error;
    if (error) {
      set({ categories: prev });
      throw error;
    }
  },
}));

let lastUid: string | undefined = useStore.getState().user?.id;
useStore.subscribe((s) => {
  const uid = s.user?.id;
  if (uid !== lastUid) {
    lastUid = uid;
    useHabitStore.setState({
      categories: [],
      habits: [],
      logs: [],
      loaded: false,
    });
  }
});
