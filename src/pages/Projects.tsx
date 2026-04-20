import { useState } from "react";
import { useStore } from "@/lib/store";
import ProjectCard from "@/components/ProjectCard";
import type { ProjectState, ProjectType } from "@/lib/types";
import { cn, stateLabels, typeLabels } from "@/lib/utils";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import NewProjectDialog from "@/components/dialogs/NewProjectDialog";

const states: (ProjectState | "all")[] = [
  "all",
  "active",
  "on_hold",
  "waiting",
  "shipped",
  "idea",
];
const types: (ProjectType | "all")[] = ["all", "code", "business", "life"];

export default function Projects() {
  const projects = useStore((s) => s.projects);
  const [stateFilter, setStateFilter] = useState<ProjectState | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ProjectType | "all">("all");
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  const filtered = projects.filter(
    (p) =>
      (stateFilter === "all" || p.state === stateFilter) &&
      (typeFilter === "all" || p.type === typeFilter) &&
      (!search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.oneLiner.toLowerCase().includes(search.toLowerCase()))
  );

  const byState = states
    .filter((s) => s !== "all")
    .map((s) => ({
      state: s as ProjectState,
      items: filtered.filter((p) => p.state === s),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="p-8 pb-16 max-w-[1400px]">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500 font-mono mb-1">
            Portfolio
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Projects
            <span className="text-ink-500 font-normal ml-3 text-xl">
              {filtered.length}
            </span>
          </h1>
        </div>
        <button
          onClick={() => setNewOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-ink-50 text-ink-950 rounded-lg text-sm font-medium hover:bg-white transition"
        >
          <Plus className="w-4 h-4" /> New project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects…"
          className="bg-ink-900 border border-ink-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-ink-600 w-60"
        />
        <div className="h-6 w-px bg-ink-800 mx-1" />
        <div className="flex gap-1">
          {states.map((s) => (
            <button
              key={s}
              onClick={() => setStateFilter(s as any)}
              className={cn(
                "px-2.5 py-1 text-xs rounded font-mono uppercase tracking-wider transition",
                stateFilter === s
                  ? "bg-ink-700 text-ink-50"
                  : "text-ink-500 hover:text-ink-200 hover:bg-ink-800/60"
              )}
            >
              {s === "all" ? "all" : stateLabels[s]}
            </button>
          ))}
        </div>
        <div className="h-6 w-px bg-ink-800 mx-1" />
        <div className="flex gap-1">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t as any)}
              className={cn(
                "px-2.5 py-1 text-xs rounded font-mono uppercase tracking-wider transition",
                typeFilter === t
                  ? "bg-ink-700 text-ink-50"
                  : "text-ink-500 hover:text-ink-200 hover:bg-ink-800/60"
              )}
            >
              {t === "all" ? "all types" : typeLabels[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid grouped by state */}
      {stateFilter === "all" ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {byState.map((g) => (
            <div key={g.state}>
              <div className="flex items-center gap-3 mb-3">
                <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono">
                  {stateLabels[g.state]}
                </div>
                <div className="h-px flex-1 bg-ink-800" />
                <div className="text-[10px] font-mono text-ink-600">
                  {g.items.length}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {g.items.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </motion.div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-ink-500">
          No projects match these filters.
        </div>
      )}

      <NewProjectDialog open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
