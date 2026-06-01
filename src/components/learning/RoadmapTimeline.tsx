import type { Milestone } from "@/lib/types";
import type { AccentClasses } from "@/lib/learningAccent";
import MilestoneCard from "./MilestoneCard";
import { cn } from "@/lib/utils";

export default function RoadmapTimeline({
  milestones,
  accent,
}: {
  milestones: Milestone[];
  accent: AccentClasses;
}) {
  const sorted = [...milestones].sort((a, b) => a.orderIndex - b.orderIndex);
  // The "in progress" milestone is the first one (by order) not yet completed.
  const currentIdx = sorted.findIndex((m) => m.completedAt == null);

  if (sorted.length === 0) {
    return (
      <div className="text-sm text-ink-500 py-8 text-center border border-dashed border-ink-800 rounded-xl">
        No milestones yet.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* vertical rail behind the dots */}
      <div
        aria-hidden
        className="absolute left-[6px] top-2 bottom-2 w-px bg-ink-800"
      />
      <div className="space-y-5">
        {sorted.map((m, i) => {
          const state =
            m.completedAt != null
              ? "done"
              : i === currentIdx
                ? "current"
                : "future";
          return (
            <div key={m.id} className="relative pl-9">
              <span
                className={cn(
                  "absolute left-0 top-1.5 w-3 h-3 rounded-full",
                  state === "done" && cn(accent.bg, accent.ring),
                  state === "current" &&
                    cn(
                      "border-2 border-current bg-ink-950 animate-glow-pulse",
                      accent.text
                    ),
                  state === "future" && "border-2 border-ink-700 bg-ink-950"
                )}
              />
              <MilestoneCard
                milestone={m}
                accent={accent}
                monthLabel={`Month ${i + 1}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
