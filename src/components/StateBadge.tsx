import { cn, stateLabels } from "@/lib/utils";
import type { ProjectState } from "@/lib/types";

const stateStyles: Record<ProjectState, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  on_hold: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  waiting: "bg-ink-700/40 text-ink-300 border-ink-700",
  shipped: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  idea: "bg-sky-500/10 text-sky-400 border-sky-500/20",
};

export default function StateBadge({
  state,
  className,
}: {
  state: ProjectState;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono rounded border",
        stateStyles[state],
        className
      )}
    >
      {state === "active" && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-glow-pulse" />
      )}
      {stateLabels[state]}
    </span>
  );
}
