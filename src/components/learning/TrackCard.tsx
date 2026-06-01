import { Link } from "react-router-dom";
import type { LearningTrack } from "@/lib/types";
import { useLearningStore } from "@/lib/learningStore";
import { accentOf } from "@/lib/learningAccent";
import {
  getTrackProgress,
  getStreakForHabit,
  dayNumber,
} from "@/lib/learningSelectors";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Flame } from "lucide-react";

export default function TrackCard({ track }: { track: LearningTrack }) {
  const milestones = useLearningStore((s) => s.milestones);
  const habits = useLearningStore((s) => s.habits);
  const completions = useLearningStore((s) => s.completions);
  const accent = accentOf(track.colorAccent);

  const trackMilestones = milestones.filter((m) => m.trackId === track.id);
  const doneCount = trackMilestones.filter((m) => m.completedAt != null).length;
  const progress = Math.round(getTrackProgress(track.id, milestones) * 100);

  const trackHabits = habits.filter((h) => h.trackId === track.id && h.active);
  const maxStreak = trackHabits.reduce(
    (best, h) => Math.max(best, getStreakForHabit(h.id, h, completions)),
    0
  );

  return (
    <Link
      to={`/learning/${track.id}`}
      className="group relative block p-5 bg-ink-900/60 border border-ink-800 rounded-xl hover:border-ink-700 hover:bg-ink-900 transition-all overflow-hidden"
    >
      {/* accent glow */}
      <div
        className="absolute -top-px left-5 right-5 h-px opacity-80"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(${accent.rgb},1), transparent)`,
        }}
      />
      <div
        className="absolute top-0 left-0 w-20 h-20 opacity-10 blur-2xl rounded-full"
        style={{ background: `rgb(${accent.rgb})` }}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn("w-2 h-2 rounded-full shrink-0", accent.bg)} />
            <h3 className="text-base font-semibold text-ink-50 truncate group-hover:text-white transition">
              {track.name}
            </h3>
          </div>
          <ArrowUpRight className="w-4 h-4 text-ink-600 opacity-0 group-hover:opacity-100 group-hover:text-ink-300 transition shrink-0" />
        </div>

        <p className="text-sm text-ink-400 line-clamp-2 mb-4 min-h-[2.5em]">
          {track.description ?? "No description yet."}
        </p>

        {/* progress */}
        <div className="flex items-center justify-between text-[11px] font-mono text-ink-500 mb-1.5">
          <span>
            {doneCount}/{trackMilestones.length} milestones
          </span>
          <span className={accent.text}>{progress}%</span>
        </div>
        <div className="h-1.5 bg-ink-800 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", accent.bg)}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* stat row */}
        <div className="mt-4 flex items-center gap-4 text-[11px] font-mono text-ink-500">
          <span>Day {dayNumber(track.startedOn)}</span>
          {maxStreak > 0 && (
            <span className="inline-flex items-center gap-1">
              <Flame className={cn("w-3 h-3", accent.text)} />
              {maxStreak} day streak
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
