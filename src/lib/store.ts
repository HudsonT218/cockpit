import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import type {
  Project,
  Task,
  Decision,
  TimeBlock,
  CalendarEvent,
  ProjectState,
  TaskStatus,
  DayReflection,
  Routine,
} from "./types";
import { supabase } from "./supabase/client";
import {
  projectFromRow,
  projectToRow,
  taskFromRow,
  taskToRow,
  decisionFromRow,
  blockFromRow,
  blockToRow,
  reflectionFromRow,
  routineFromRow,
  routineToRow,
} from "./supabase/mappers";
import {
  seedProjects,
  seedTasks,
  seedDecisions,
  seedBlocks,
} from "./seed";
import {
  ghMe,
  ghRepoInfo,
  ghRepoCommitsSince,
  parseGithubRepo,
  type GhUser,
} from "./github";
import { fetchEvents, GoogleCalendarAuthError } from "./googleCalendar";

const GOOGLE_TOKEN_KEY = "cockpit-google-token";
const GOOGLE_EMAIL_KEY = "cockpit-google-email";

function readLocal(key: string): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(key);
}

export type AuthStatus = "loading" | "authed" | "guest";

interface StoreState {
  // auth
  session: Session | null;
  user: User | null;
  authStatus: AuthStatus;
  displayName: string | null;

  // data
  projects: Project[];
  tasks: Task[];
  decisions: Decision[];
  blocks: TimeBlock[];
  routines: Routine[];
  calendar: CalendarEvent[];
  reflections: DayReflection[];
  focusProjectId: string | null;
  loaded: boolean;

  // integrations
  githubToken: string | null;
  githubUser: GhUser | null;
  githubRepoCache: Record<
    string,
    { pushedAt: string; openIssuesCount: number; syncedAt: number }
  >;
  githubCommitCounts: Record<string, number>; // date (YYYY-MM-DD) → count
  githubSyncing: boolean;
  githubLastSyncedAt: number | null;

  // Google Calendar
  googleToken: string | null;
  googleEmail: string | null;
  googleSyncedAt: number | null;
  googleSyncing: boolean;

  // auth actions
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;

  // data loading
  loadAll: () => Promise<void>;
  importFromLocalStorage: () => Promise<{ imported: number }>;
  loadDemoData: () => Promise<{ imported: number }>;

  // project actions
  addProject: (p: Omit<Project, "id" | "createdAt" | "lastTouchedAt">) => Promise<string>;
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>;
  setProjectState: (id: string, state: ProjectState, resumeNote?: string) => Promise<void>;
  touchProject: (id: string) => Promise<void>;
  setFocusProject: (id: string | null) => Promise<void>;
  deleteProject: (id: string, opts?: { deleteTasks?: boolean }) => Promise<void>;

  // task actions
  addTask: (t: Partial<Task> & { title: string }) => Promise<string>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setTaskStatus: (id: string, status: TaskStatus) => Promise<void>;

  // decision actions
  addDecision: (d: Omit<Decision, "id">) => Promise<void>;

  // block actions
  addBlock: (b: Omit<TimeBlock, "id">) => Promise<string>;
  updateBlock: (id: string, patch: Partial<TimeBlock>) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  assignTaskToBlock: (blockId: string, taskId: string) => Promise<void>;

  // reflections
  saveReflection: (date: string, text: string) => Promise<void>;

  // routines
  addRoutine: (r: Omit<Routine, "id">) => Promise<string>;
  updateRoutine: (id: string, patch: Partial<Routine>) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;

  // profile + integrations
  setDisplayName: (name: string) => Promise<void>;
  connectGithub: (token: string) => Promise<{ error?: string }>;
  disconnectGithub: () => Promise<void>;
  syncGithubActivity: (force?: boolean) => Promise<void>;
  syncGoogleCalendar: () => Promise<void>;
  refreshGoogleAccessToken: () => Promise<string | null>;
  disconnectGoogleCalendar: () => Promise<void>;
}

function uidOf(): string | undefined {
  return useStore.getState().user?.id;
}

export const useStore = create<StoreState>()((set, get) => ({
  session: null,
  user: null,
  authStatus: "loading",
  displayName: null,
  projects: [],
  tasks: [],
  decisions: [],
  blocks: [],
  routines: [],
  calendar: [],
  reflections: [],
  focusProjectId: null,
  loaded: false,
  githubToken: null,
  githubUser: null,
  githubRepoCache: {},
  githubCommitCounts: {},
  githubSyncing: false,
  githubLastSyncedAt: null,
  googleToken: readLocal(GOOGLE_TOKEN_KEY),
  googleEmail: readLocal(GOOGLE_EMAIL_KEY),
  googleSyncedAt: null,
  googleSyncing: false,

  // ============== AUTH ==============
  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    return {};
  },
  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };
    return {};
  },
  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        scopes: "https://www.googleapis.com/auth/calendar.readonly",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) return { error: error.message };
    return {};
  },
  signOut: async () => {
    await supabase.auth.signOut();
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(GOOGLE_TOKEN_KEY);
      localStorage.removeItem(GOOGLE_EMAIL_KEY);
    }
    set({
      projects: [],
      tasks: [],
      decisions: [],
      blocks: [],
      routines: [],
      calendar: [],
      reflections: [],
      focusProjectId: null,
      loaded: false,
      googleToken: null,
      googleEmail: null,
      googleSyncedAt: null,
    });
  },

  // ============== LOAD ==============
  loadAll: async () => {
    const uid = get().user?.id;
    if (!uid) return;
    const [
      projectsRes,
      tasksRes,
      decisionsRes,
      blocksRes,
      routinesRes,
      reflRes,
      profileRes,
    ] = await Promise.all([
      supabase.from("projects").select("*").order("last_touched_at", { ascending: false }),
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("decisions").select("*").order("date", { ascending: false }),
      supabase.from("time_blocks").select("*, time_block_tasks(task_id)").order("date", { ascending: true }),
      supabase.from("routines").select("*").order("start_time", { ascending: true }),
      supabase.from("reflections").select("*").order("date", { ascending: false }),
      supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
    ]);
    set({
      projects: (projectsRes.data ?? []).map(projectFromRow),
      tasks: (tasksRes.data ?? []).map(taskFromRow),
      decisions: (decisionsRes.data ?? []).map(decisionFromRow),
      blocks: (blocksRes.data ?? []).map(blockFromRow),
      routines: (routinesRes.data ?? []).map(routineFromRow),
      reflections: (reflRes.data ?? []).map(reflectionFromRow),
      focusProjectId: profileRes.data?.focus_project_id ?? null,
      displayName: profileRes.data?.display_name ?? null,
      githubToken: profileRes.data?.github_token ?? null,
      loaded: true,
    });

    // fire-and-forget: verify github token + fetch user, then sync activity
    const token = profileRes.data?.github_token;
    if (token) {
      ghMe(token)
        .then((u) => {
          set({ githubUser: u });
          // Kick off activity sync in background
          void get().syncGithubActivity();
        })
        .catch(() => set({ githubUser: null }));
    }

    // fire-and-forget: pull Google Calendar events
    if (get().googleToken) {
      void get().syncGoogleCalendar();
    }
  },

  importFromLocalStorage: async () => {
    const uid = get().user?.id;
    if (!uid) return { imported: 0 };
    const raw = localStorage.getItem("cockpit-dashboard-v1");
    if (!raw) return { imported: 0 };
    try {
      const parsed = JSON.parse(raw);
      const s = parsed.state ?? parsed;
      return await importData(uid, s);
    } catch {
      return { imported: 0 };
    }
  },

  loadDemoData: async () => {
    const uid = get().user?.id;
    if (!uid) return { imported: 0 };
    return await importData(uid, {
      projects: seedProjects,
      tasks: seedTasks,
      decisions: seedDecisions,
      blocks: seedBlocks,
      reflections: [],
      focusProjectId: "proj_side_app",
    });
  },

  // ============== PROJECTS ==============
  addProject: async (p) => {
    const uid = uidOf();
    if (!uid) throw new Error("not authed");
    const { data, error } = await supabase
      .from("projects")
      .insert({ ...projectToRow(p as Partial<Project>), user_id: uid })
      .select()
      .single();
    if (error) throw error;
    const project = projectFromRow(data);
    set((s) => ({ projects: [project, ...s.projects] }));
    return project.id;
  },

  updateProject: async (id, patch) => {
    const row = projectToRow(patch);
    row.last_touched_at = new Date().toISOString();
    const { data, error } = await supabase
      .from("projects")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    const project = projectFromRow(data);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? project : p)),
    }));
  },

  setProjectState: async (id, state, resumeNote) => {
    await get().updateProject(id, {
      state,
      resumeNote: state === "on_hold" ? resumeNote ?? "" : undefined,
    });
  },

  touchProject: async (id) => {
    await get().updateProject(id, {});
  },

  setFocusProject: async (id) => {
    const uid = uidOf();
    if (!uid) return;
    await supabase
      .from("profiles")
      .upsert({ user_id: uid, focus_project_id: id }, { onConflict: "user_id" });
    set({ focusProjectId: id });
  },

  deleteProject: async (id, opts) => {
    // Option: hard-delete the project's tasks too. Otherwise they become standalone
    // (project_id is SET NULL by the FK). Decisions + blocks cascade/null per schema.
    if (opts?.deleteTasks) {
      await supabase.from("tasks").delete().eq("project_id", id);
    }
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      decisions: s.decisions.filter((d) => d.projectId !== id),
      tasks: opts?.deleteTasks
        ? s.tasks.filter((t) => t.projectId !== id)
        : s.tasks.map((t) =>
            t.projectId === id ? { ...t, projectId: undefined } : t
          ),
      blocks: s.blocks.map((b) =>
        b.projectId === id ? { ...b, projectId: undefined } : b
      ),
      focusProjectId: s.focusProjectId === id ? null : s.focusProjectId,
    }));
  },

  // ============== TASKS ==============
  addTask: async (t) => {
    const uid = uidOf();
    if (!uid) throw new Error("not authed");
    const row = {
      ...taskToRow({ ...t, recurrence: t.recurrence ?? "none", status: t.status ?? "todo" }),
      user_id: uid,
    };
    const { data, error } = await supabase.from("tasks").insert(row).select().single();
    if (error) throw error;
    const task = taskFromRow(data);
    set((s) => ({ tasks: [task, ...s.tasks] }));
    return task.id;
  },

  updateTask: async (id, patch) => {
    const { data, error } = await supabase
      .from("tasks")
      .update(taskToRow(patch))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    const task = taskFromRow(data);
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? task : t)) }));
  },

  toggleTask: async (id) => {
    const t = get().tasks.find((x) => x.id === id);
    if (!t) return;
    const isDone = t.status === "done";
    await get().updateTask(id, {
      status: isDone ? "todo" : "done",
      completedAt: isDone ? undefined : new Date().toISOString(),
    });
  },

  deleteTask: async (id) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  setTaskStatus: async (id, status) => {
    await get().updateTask(id, {
      status,
      completedAt: status === "done" ? new Date().toISOString() : undefined,
    });
  },

  // ============== DECISIONS ==============
  addDecision: async (d) => {
    const uid = uidOf();
    if (!uid) throw new Error("not authed");
    const { data, error } = await supabase
      .from("decisions")
      .insert({
        user_id: uid,
        project_id: d.projectId,
        date: d.date,
        what: d.what,
        why: d.why,
      })
      .select()
      .single();
    if (error) throw error;
    set((s) => ({ decisions: [decisionFromRow(data), ...s.decisions] }));
  },

  // ============== BLOCKS ==============
  addBlock: async (b) => {
    const uid = uidOf();
    if (!uid) throw new Error("not authed");
    const { data, error } = await supabase
      .from("time_blocks")
      .insert({ ...blockToRow(b), user_id: uid })
      .select("*, time_block_tasks(task_id)")
      .single();
    if (error) throw error;
    // insert join rows for taskIds
    if (b.taskIds.length) {
      await supabase.from("time_block_tasks").insert(
        b.taskIds.map((tid) => ({ block_id: data.id, task_id: tid }))
      );
    }
    const block: TimeBlock = { ...blockFromRow(data), taskIds: b.taskIds };
    set((s) => ({ blocks: [...s.blocks, block] }));
    return block.id;
  },

  updateBlock: async (id, patch) => {
    const { data, error } = await supabase
      .from("time_blocks")
      .update(blockToRow(patch))
      .eq("id", id)
      .select("*, time_block_tasks(task_id)")
      .single();
    if (error) throw error;
    // update join table if taskIds provided
    let taskIds = blockFromRow(data).taskIds;
    if (patch.taskIds) {
      await supabase.from("time_block_tasks").delete().eq("block_id", id);
      if (patch.taskIds.length) {
        await supabase
          .from("time_block_tasks")
          .insert(patch.taskIds.map((tid) => ({ block_id: id, task_id: tid })));
      }
      taskIds = patch.taskIds;
    }
    const block: TimeBlock = { ...blockFromRow(data), taskIds };
    set((s) => ({ blocks: s.blocks.map((b) => (b.id === id ? block : b)) }));
  },

  deleteBlock: async (id) => {
    const { error } = await supabase.from("time_blocks").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ blocks: s.blocks.filter((b) => b.id !== id) }));
  },

  assignTaskToBlock: async (blockId, taskId) => {
    const block = get().blocks.find((b) => b.id === blockId);
    if (!block || block.taskIds.includes(taskId)) return;
    await supabase
      .from("time_block_tasks")
      .insert({ block_id: blockId, task_id: taskId });
    await get().updateTask(taskId, { scheduledFor: block.date });
    set((s) => ({
      blocks: s.blocks.map((b) =>
        b.id === blockId ? { ...b, taskIds: [...b.taskIds, taskId] } : b
      ),
    }));
  },

  // ============== REFLECTIONS ==============
  saveReflection: async (date, text) => {
    const uid = uidOf();
    if (!uid) return;
    const { data, error } = await supabase
      .from("reflections")
      .upsert(
        { user_id: uid, date, text },
        { onConflict: "user_id,date" }
      )
      .select()
      .single();
    if (error) throw error;
    const refl = reflectionFromRow(data);
    set((s) => ({
      reflections: [
        refl,
        ...s.reflections.filter((r) => r.date !== date),
      ],
    }));
  },

  // ============== ROUTINES ==============
  addRoutine: async (r) => {
    const uid = uidOf();
    if (!uid) throw new Error("not authed");
    const { data, error } = await supabase
      .from("routines")
      .insert({ ...routineToRow(r as Partial<Routine>), user_id: uid })
      .select()
      .single();
    if (error) throw error;
    const routine = routineFromRow(data);
    set((s) => ({ routines: [...s.routines, routine] }));
    return routine.id;
  },

  updateRoutine: async (id, patch) => {
    const { data, error } = await supabase
      .from("routines")
      .update(routineToRow(patch))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    const routine = routineFromRow(data);
    set((s) => ({
      routines: s.routines.map((r) => (r.id === id ? routine : r)),
    }));
  },

  deleteRoutine: async (id) => {
    const { error } = await supabase.from("routines").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ routines: s.routines.filter((r) => r.id !== id) }));
  },

  // ============== PROFILE + INTEGRATIONS ==============
  setDisplayName: async (name) => {
    const uid = uidOf();
    if (!uid) return;
    await supabase
      .from("profiles")
      .upsert(
        { user_id: uid, display_name: name },
        { onConflict: "user_id" }
      );
    set({ displayName: name });
  },

  connectGithub: async (token) => {
    const uid = uidOf();
    if (!uid) return { error: "not authed" };
    // validate the token by fetching /user
    try {
      const user = await ghMe(token);
      const { error } = await supabase
        .from("profiles")
        .upsert(
          { user_id: uid, github_token: token },
          { onConflict: "user_id" }
        );
      if (error) {
        // Most common: the github_token column doesn't exist yet.
        if (
          error.message.toLowerCase().includes("github_token") ||
          error.code === "PGRST204" ||
          error.code === "42703"
        ) {
          return {
            error:
              "Database missing github_token column. Run supabase/migration_github.sql in the Supabase SQL Editor.",
          };
        }
        return { error: error.message };
      }
      set({ githubToken: token, githubUser: user });
      // kick off initial sync immediately
      void get().syncGithubActivity(true);
      return {};
    } catch (err: any) {
      return { error: err?.message ?? "Failed to verify token" };
    }
  },

  disconnectGithub: async () => {
    const uid = uidOf();
    if (!uid) return;
    await supabase
      .from("profiles")
      .upsert(
        { user_id: uid, github_token: null },
        { onConflict: "user_id" }
      );
    set({
      githubToken: null,
      githubUser: null,
      githubRepoCache: {},
      githubCommitCounts: {},
      githubLastSyncedAt: null,
    });
  },

  syncGithubActivity: async (force = false) => {
    const state = get();
    const { githubToken, githubUser, projects } = state;
    if (!githubToken || !githubUser) return;

    // throttle: if synced in the last 5 min, skip (unless forced)
    if (
      !force &&
      state.githubLastSyncedAt &&
      Date.now() - state.githubLastSyncedAt < 5 * 60 * 1000
    ) {
      return;
    }
    set({ githubSyncing: true });

    const now = new Date();
    const twelveWeeksAgo = new Date(
      now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000
    );
    const sinceISO = twelveWeeksAgo.toISOString();

    const repoCache: typeof state.githubRepoCache = {};
    const commitCounts: Record<string, number> = {};
    const touchUpdates: { id: string; pushedAt: string }[] = [];

    // Fire all per-project syncs concurrently
    await Promise.all(
      projects.map(async (project) => {
        const repo = parseGithubRepo(project.repoUrl);
        if (!repo) return;
        try {
          const info = await ghRepoInfo(githubToken, repo);
          repoCache[repo] = {
            pushedAt: info.pushed_at,
            openIssuesCount: info.open_issues_count,
            syncedAt: Date.now(),
          };

          // Touch project if GitHub push is newer than our last_touched_at
          if (info.pushed_at > project.lastTouchedAt) {
            touchUpdates.push({ id: project.id, pushedAt: info.pushed_at });
          }

          // Gather commits for the heatmap. No author filter — we count every
          // commit on repos the user has explicitly linked.
          const commits = await ghRepoCommitsSince(
            githubToken,
            repo,
            sinceISO
          );
          commits.forEach((c) => {
            const date = c.commit.author.date.slice(0, 10);
            commitCounts[date] = (commitCounts[date] ?? 0) + 1;
          });
        } catch (err) {
          // Silently skip broken repos (renamed, deleted, access revoked)
          // eslint-disable-next-line no-console
          console.warn(`[github sync] ${repo}:`, err);
        }
      })
    );

    // Persist the touch updates
    if (touchUpdates.length) {
      await Promise.all(
        touchUpdates.map((u) =>
          supabase
            .from("projects")
            .update({ last_touched_at: u.pushedAt })
            .eq("id", u.id)
        )
      );
    }

    set((s) => ({
      githubRepoCache: repoCache,
      githubCommitCounts: commitCounts,
      githubSyncing: false,
      githubLastSyncedAt: Date.now(),
      projects: s.projects.map((p) => {
        const upd = touchUpdates.find((u) => u.id === p.id);
        return upd ? { ...p, lastTouchedAt: upd.pushedAt } : p;
      }),
    }));
  },

  syncGoogleCalendar: async () => {
    if (get().googleSyncing) return;
    let token = get().googleToken;
    if (!token) return;
    set({ googleSyncing: true });

    const dateRange = (): readonly [Date, Date] => {
      const from = new Date();
      from.setDate(from.getDate() - 7);
      from.setHours(0, 0, 0, 0);
      const to = new Date();
      to.setDate(to.getDate() + 60);
      to.setHours(23, 59, 59, 999);
      return [from, to] as const;
    };

    const tryFetch = async (accessToken: string) => {
      const [from, to] = dateRange();
      return fetchEvents(accessToken, from, to);
    };

    try {
      const events = await tryFetch(token);
      set({ calendar: events, googleSyncedAt: Date.now(), googleSyncing: false });
      return;
    } catch (err) {
      if (!(err instanceof GoogleCalendarAuthError)) {
        // eslint-disable-next-line no-console
        console.warn("[google calendar] sync failed:", err);
        set({ googleSyncing: false });
        return;
      }
    }

    // Token rejected — try a refresh and retry once.
    const newToken = await get().refreshGoogleAccessToken();
    if (!newToken) {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(GOOGLE_TOKEN_KEY);
      }
      set({
        googleToken: null,
        calendar: [],
        googleSyncing: false,
      });
      return;
    }

    try {
      const events = await tryFetch(newToken);
      set({ calendar: events, googleSyncedAt: Date.now(), googleSyncing: false });
    } catch (err) {
      set({ googleSyncing: false });
      if (err instanceof GoogleCalendarAuthError) {
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem(GOOGLE_TOKEN_KEY);
        }
        set({ googleToken: null, calendar: [] });
      } else {
        // eslint-disable-next-line no-console
        console.warn("[google calendar] retry failed:", err);
      }
    }
  },

  refreshGoogleAccessToken: async () => {
    const uid = get().user?.id;
    if (!uid) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("google_refresh_token")
      .eq("user_id", uid)
      .maybeSingle();

    if (error || !data?.google_refresh_token) return null;
    const refreshToken = data.google_refresh_token as string;

    let res: Response;
    try {
      res = await fetch(`${window.location.origin}/api/refresh-google-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[google calendar] refresh request failed", e);
      return null;
    }

    if (!res.ok) {
      // Refresh token was revoked or invalid — clear it so the user reconnects.
      await supabase
        .from("profiles")
        .update({ google_refresh_token: null })
        .eq("user_id", uid);
      return null;
    }

    const payload = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
    };
    const newToken = payload.access_token;

    set({ googleToken: newToken });
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(GOOGLE_TOKEN_KEY, newToken);
    }

    if (payload.refresh_token && payload.refresh_token !== refreshToken) {
      await supabase
        .from("profiles")
        .update({ google_refresh_token: payload.refresh_token })
        .eq("user_id", uid);
    }

    return newToken;
  },

  disconnectGoogleCalendar: async () => {
    const uid = get().user?.id;
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(GOOGLE_TOKEN_KEY);
      localStorage.removeItem(GOOGLE_EMAIL_KEY);
    }
    set({
      googleToken: null,
      googleEmail: null,
      googleSyncedAt: null,
      calendar: [],
    });
    if (uid) {
      await supabase
        .from("profiles")
        .update({ google_refresh_token: null })
        .eq("user_id", uid);
    }
  },
}));

// ================================================================
// Auth bootstrap — wire Supabase session into the store
// ================================================================
function captureGoogleToken(session: Session | null) {
  if (!session?.provider_token) return;
  // Supabase exposes provider_token + provider_refresh_token only on the
  // initial OAuth callback. Persist the access token to localStorage and
  // the refresh token to the user's profile (RLS-scoped) so we can mint
  // new access tokens via /api/refresh-google-token without re-prompting.
  const email = session.user?.email ?? null;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(GOOGLE_TOKEN_KEY, session.provider_token);
    if (email) localStorage.setItem(GOOGLE_EMAIL_KEY, email);
  }
  useStore.setState({
    googleToken: session.provider_token,
    googleEmail: email,
  });

  if (session.provider_refresh_token && session.user?.id) {
    void supabase
      .from("profiles")
      .upsert(
        {
          user_id: session.user.id,
          google_refresh_token: session.provider_refresh_token,
        },
        { onConflict: "user_id" }
      );
  }
}

supabase.auth.getSession().then(({ data }) => {
  const session = data.session;
  useStore.setState({
    session,
    user: session?.user ?? null,
    authStatus: session ? "authed" : "guest",
  });
  captureGoogleToken(session);
  if (session) void useStore.getState().loadAll();
});

supabase.auth.onAuthStateChange((_event, session) => {
  useStore.setState({
    session,
    user: session?.user ?? null,
    authStatus: session ? "authed" : "guest",
  });
  captureGoogleToken(session);
  if (session) void useStore.getState().loadAll();
});

// ================================================================
// Importer — push a seed/localStorage blob into Supabase
// ================================================================
async function importData(
  uid: string,
  s: {
    projects?: Project[];
    tasks?: Task[];
    decisions?: Decision[];
    blocks?: TimeBlock[];
    reflections?: DayReflection[];
    focusProjectId?: string | null;
  }
): Promise<{ imported: number }> {
  let count = 0;
  const idMap = new Map<string, string>(); // old id → new uuid

  // projects first
  if (s.projects?.length) {
    const rows = s.projects.map((p) => ({
      ...projectToRow(p),
      last_touched_at: p.lastTouchedAt ?? new Date().toISOString(),
      user_id: uid,
    }));
    const { data, error } = await supabase.from("projects").insert(rows).select();
    if (!error && data) {
      s.projects.forEach((old, i) => idMap.set(old.id, data[i].id));
      count += data.length;
    }
  }

  // tasks (remap project_id)
  if (s.tasks?.length) {
    const rows = s.tasks.map((t) => ({
      ...taskToRow(t),
      project_id: t.projectId ? idMap.get(t.projectId) ?? null : null,
      user_id: uid,
    }));
    const { data, error } = await supabase.from("tasks").insert(rows).select();
    if (!error && data) {
      s.tasks.forEach((old, i) => idMap.set(old.id, data[i].id));
      count += data.length;
    }
  }

  // decisions (remap project_id)
  if (s.decisions?.length) {
    const rows = s.decisions
      .map((d) => {
        const pid = idMap.get(d.projectId);
        if (!pid) return null;
        return {
          user_id: uid,
          project_id: pid,
          date: d.date,
          what: d.what,
          why: d.why,
        };
      })
      .filter(Boolean);
    if (rows.length) {
      const { data, error } = await supabase.from("decisions").insert(rows as any).select();
      if (!error && data) count += data.length;
    }
  }

  // blocks + join rows
  if (s.blocks?.length) {
    const blockRows = s.blocks.map((b) => ({
      ...blockToRow(b),
      project_id: b.projectId ? idMap.get(b.projectId) ?? null : null,
      user_id: uid,
    }));
    const { data, error } = await supabase.from("time_blocks").insert(blockRows).select();
    if (!error && data) {
      const joinRows: any[] = [];
      s.blocks.forEach((old, i) => {
        idMap.set(old.id, data[i].id);
        old.taskIds?.forEach((oldTid) => {
          const newTid = idMap.get(oldTid);
          if (newTid) joinRows.push({ block_id: data[i].id, task_id: newTid });
        });
      });
      if (joinRows.length) {
        await supabase.from("time_block_tasks").insert(joinRows);
      }
      count += data.length;
    }
  }

  // reflections
  if (s.reflections?.length) {
    const rows = s.reflections.map((r) => ({
      user_id: uid,
      date: r.date,
      text: r.text,
    }));
    await supabase
      .from("reflections")
      .upsert(rows, { onConflict: "user_id,date" });
    count += rows.length;
  }

  // focus project
  if (s.focusProjectId) {
    const newFocus = idMap.get(s.focusProjectId) ?? null;
    if (newFocus) {
      await supabase
        .from("profiles")
        .upsert(
          { user_id: uid, focus_project_id: newFocus },
          { onConflict: "user_id" }
        );
    }
  }

  // reload
  await useStore.getState().loadAll();
  return { imported: count };
}
