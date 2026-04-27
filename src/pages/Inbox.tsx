import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import TaskItem from "@/components/TaskItem";
import { cn, energyLabels, isoDate } from "@/lib/utils";
import type { EnergyTag, Recurrence } from "@/lib/types";
import { Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Inbox() {
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const addTask = useStore((s) => s.addTask);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<string | "">("");
  const [energy, setEnergy] = useState<EnergyTag | "">("");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [filter, setFilter] = useState<
    "all" | "standalone" | "recurring" | "today" | "open"
  >("all");

  const today = isoDate(new Date());

  const filtered = useMemo(() => {
    let list = [...tasks];
    if (filter === "standalone") list = list.filter((t) => !t.projectId);
    if (filter === "recurring") list = list.filter((t) => t.recurrence !== "none");
    if (filter === "today")
      list = list.filter((t) => t.scheduledFor === today && t.status !== "done");
    if (filter === "open") list = list.filter((t) => t.status !== "done");
    return list.sort((a, b) => {
      const order = (t: typeof a) =>
        t.status === "doing" ? 0 : t.status === "todo" ? 1 : 2;
      if (order(a) !== order(b)) return order(a) - order(b);
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [tasks, filter, today]);

  const grouped = useMemo(() => {
    const open = filtered.filter((t) => t.status !== "done");
    const done = filtered.filter((t) => t.status === "done");
    return { open, done };
  }, [filtered]);

  return (
    <div className="p-4 md:p-8 pb-16 max-w-[1000px]">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500 font-mono mb-1">
            Everything, one place
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Inbox</h1>
        </div>
      </div>

      {/* Quick add */}
      <motion.form
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          addTask({
            title,
            projectId: projectId || undefined,
            energyTag: (energy || undefined) as any,
            recurrence,
            scheduledFor: recurrence !== "none" ? today : undefined,
          });
          setTitle("");
          setEnergy("");
          setRecurrence("none");
        }}
        className="p-4 bg-ink-900/60 border border-ink-800 rounded-2xl mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-accent-amber" />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs doing?"
            className="flex-1 bg-transparent outline-none text-base placeholder:text-ink-500"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-ink-50 text-ink-950 rounded-lg text-sm font-medium hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-6">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="bg-ink-950 border border-ink-800 rounded-md px-2 py-1 text-xs text-ink-200 outline-none"
          >
            <option value="">No project</option>
            {projects
              .filter((p) => p.state !== "shipped")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
          <select
            value={energy}
            onChange={(e) => setEnergy(e.target.value as any)}
            className="bg-ink-950 border border-ink-800 rounded-md px-2 py-1 text-xs text-ink-200 outline-none"
          >
            <option value="">Energy</option>
            {(Object.entries(energyLabels) as any).map(([k, v]: any) => (
              <option key={k} value={k}>
                {v.icon} {v.label}
              </option>
            ))}
          </select>
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as Recurrence)}
            className="bg-ink-950 border border-ink-800 rounded-md px-2 py-1 text-xs text-ink-200 outline-none"
          >
            <option value="none">Once</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </motion.form>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1 mb-4">
        {[
          { key: "all", label: "All" },
          { key: "open", label: "Open" },
          { key: "today", label: "Today" },
          { key: "standalone", label: "Standalone" },
          { key: "recurring", label: "Recurring" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={cn(
              "px-2.5 py-1 text-xs rounded font-mono uppercase tracking-wider transition",
              filter === f.key
                ? "bg-ink-700 text-ink-50"
                : "text-ink-500 hover:text-ink-200 hover:bg-ink-800/60"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Open tasks */}
      <div className="bg-ink-900/40 border border-ink-800 rounded-2xl p-3 mb-6">
        <div className="px-3 py-2 text-[10px] uppercase tracking-wider font-mono text-ink-500">
          Open · {grouped.open.length}
        </div>
        {grouped.open.length === 0 ? (
          <div className="px-3 py-6 text-sm text-ink-500">Inbox zero ✨</div>
        ) : (
          <div className="space-y-0.5">
            {grouped.open.map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </div>
        )}
      </div>

      {grouped.done.length > 0 && (
        <div className="bg-ink-900/20 border border-ink-800/60 rounded-2xl p-3">
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider font-mono text-ink-600">
            Done · {grouped.done.length}
          </div>
          <div className="space-y-0.5 opacity-70">
            {grouped.done.slice(0, 20).map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
