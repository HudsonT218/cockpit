import type { Milestone } from "@/lib/types";
import type { AccentClasses } from "@/lib/learningAccent";
import { useLearningStore } from "@/lib/learningStore";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, CheckCircle2 } from "lucide-react";

export default function MilestoneCard({
  milestone,
  accent,
  monthLabel,
}: {
  milestone: Milestone;
  accent: AccentClasses;
  monthLabel: string;
}) {
  const toggleSubItem = useLearningStore((s) => s.toggleSubItem);

  const total = milestone.subItems.length;
  const done = milestone.subItems.filter((si) => si.done).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isComplete = milestone.completedAt != null;

  return (
    <div
      className={cn(
        "rounded-xl border bg-ink-900/50 p-5 transition-colors",
        isComplete
          ? "border-ink-800"
          : "border-ink-800 hover:border-ink-600"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <h3 className="text-xl font-semibold tracking-tight text-ink-50">
          {milestone.title}
        </h3>
        <span
          className={cn(
            "shrink-0 px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono rounded border",
            accent.soft
          )}
        >
          {monthLabel}
        </span>
      </div>

      {milestone.description && (
        <p className="text-sm text-ink-400 leading-relaxed mb-4">
          {milestone.description}
        </p>
      )}

      {/* sub-items checklist */}
      {total > 0 && (
        <div className="space-y-1 mb-4">
          {milestone.subItems.map((si) => (
            <button
              key={si.id}
              onClick={() => toggleSubItem(milestone.id, si.id)}
              className="group/sub w-full flex items-start gap-2.5 py-1 text-left"
            >
              <span
                className={cn(
                  "mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                  si.done
                    ? cn(accent.bg, "border-transparent")
                    : "border-ink-600 group-hover/sub:border-ink-400"
                )}
              >
                {si.done && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 28 }}
                  >
                    <Check className="w-3 h-3 text-ink-950" strokeWidth={3} />
                  </motion.span>
                )}
              </span>
              <span
                className={cn(
                  "text-sm leading-snug transition-colors",
                  si.done
                    ? "text-ink-500 line-through"
                    : "text-ink-200 group-hover/sub:text-ink-100"
                )}
              >
                {si.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* sub-item progress bar */}
      {total > 0 && (
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 bg-ink-800 rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", accent.bg)}
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <span className="text-[11px] font-mono text-ink-500 w-12 text-right">
            {done}/{total}
          </span>
        </div>
      )}

      {isComplete && (
        <div
          className={cn(
            "mt-4 inline-flex items-center gap-1.5 text-[11px] font-mono",
            accent.text
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Completed{" "}
          {new Intl.DateTimeFormat("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }).format(new Date(milestone.completedAt!))}
        </div>
      )}
    </div>
  );
}
