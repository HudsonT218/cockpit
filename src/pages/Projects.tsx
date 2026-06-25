import { useState } from "react";
import { useStore } from "@/lib/store";
import ProjectCard from "@/components/ProjectCard";
import type { ProjectState } from "@/lib/types";
import { cn, stateLabels } from "@/lib/utils";
import {
  BUILTIN_TYPE_SLUGS,
  typeLabelFor,
  isUncategorized,
  UNCATEGORIZED_LABEL,
} from "@/lib/projectTypes";
import { Plus, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import NewProjectDialog from "@/components/dialogs/NewProjectDialog";
import ManageTypesDialog from "@/components/dialogs/ManageTypesDialog";

const states: (ProjectState | "all")[] = [
  "all",
  "active",
  "waiting",
  "on_hold",
  "idea",
  "shipped",
];

export default function Projects() {
  const projects = useStore((s) => s.projects);
  const projectTypes = useStore((s) => s.projectTypes);
  const [stateFilter, setStateFilter] = useState<ProjectState | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [manageTypesOpen, setManageTypesOpen] = useState(false);

  const hasUncategorized = projects.some((p) =>
    isUncategorized(p.type, projectTypes)
  );
  const typeChips: string[] = [
    "all",
    ...BUILTIN_TYPE_SLUGS,
    ...projectTypes.map((t) => t.slug),
    ...(hasUncategorized ? ["uncategorized"] : []),
  ];

  const filtered = projects.filter(
    (p) =>
      (stateFilter === "all" || p.state === stateFilter) &&
      (typeFilter === "all" ||
        (typeFilter === "uncategorized"
          ? isUncategorized(p.type, projectTypes)
          : p.type === typeFilter)) &&
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
    <div className="p-4 md:p-8 pb-16 max-w-[1400px]">
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
        <div className="flex gap-1 flex-wrap items-center">
          {typeChips.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-2.5 py-1 text-xs rounded font-mono uppercase tracking-wider transition",
                typeFilter === t
                  ? "bg-ink-700 text-ink-50"
                  : "text-ink-500 hover:text-ink-200 hover:bg-ink-800/60"
              )}
            >
              {t === "all"
                ? "all types"
                : t === "uncategorized"
                ? UNCATEGORIZED_LABEL
                : typeLabelFor(t, projectTypes)}
            </button>
          ))}
          <button
            onClick={() => setManageTypesOpen(true)}
            title="Manage types"
            className="inline-flex items-center justify-center w-7 h-7 rounded text-ink-500 hover:text-ink-200 hover:bg-ink-800/60 transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
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
                  {g.state === "idea" ? "Future Projects" : stateLabels[g.state]}
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
      <ManageTypesDialog
        open={manageTypesOpen}
        onClose={() => setManageTypesOpen(false)}
      />
    </div>
  );
}
