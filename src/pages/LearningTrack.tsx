import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useLearningStore } from "@/lib/learningStore";
import { accentOf } from "@/lib/learningAccent";
import {
  getTrackProgress,
  getActiveHabitsForDate,
  dayNumber,
  formatTrackDate,
} from "@/lib/learningSelectors";
import RoadmapTimeline from "@/components/learning/RoadmapTimeline";
import HabitHeatmap from "@/components/learning/HabitHeatmap";
import TodayHabitRow from "@/components/learning/TodayHabitRow";
import TrackDialog from "@/components/dialogs/TrackDialog";
import { cn, isoDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowLeft, MoreVertical, Pencil, Archive } from "lucide-react";

const SECTION_LABEL = "text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono";

export default function LearningTrack() {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const loaded = useLearningStore((s) => s.loaded);
  const loadLearning = useLearningStore((s) => s.loadLearning);
  const tracks = useLearningStore((s) => s.tracks);
  const milestones = useLearningStore((s) => s.milestones);
  const habits = useLearningStore((s) => s.habits);
  const archiveTrack = useLearningStore((s) => s.archiveTrack);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!loaded) void loadLearning();
  }, [loaded, loadLearning]);

  const track = tracks.find((t) => t.id === trackId);

  if (!track) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        {loaded ? (
          <div className="text-center py-20 text-ink-500">
            <div className="mb-3">This track doesn't exist.</div>
            <Link to="/learning" className="text-ink-300 hover:text-ink-100 text-sm">
              ← Back to Learning
            </Link>
          </div>
        ) : (
          <div className="text-center py-20 text-ink-600 text-sm">Loading…</div>
        )}
      </div>
    );
  }

  const accent = accentOf(track.colorAccent);
  const trackMilestones = milestones.filter((m) => m.trackId === track.id);
  const trackHabits = habits
    .filter((h) => h.trackId === track.id && h.active)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const progress = Math.round(getTrackProgress(track.id, milestones) * 100);
  const today = isoDate(new Date());
  const todayHabits = getActiveHabitsForDate(today, habits, track.id);
  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 md:p-8 pb-16 max-w-5xl mx-auto space-y-8"
    >
      {/* ============ Section 1 — Header ============ */}
      <div>
        <Link
          to="/learning"
          className="inline-flex items-center gap-1.5 text-[11px] font-mono text-ink-500 hover:text-ink-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Learning
        </Link>

        <div className="flex items-start justify-between gap-3 mt-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", accent.bg)} />
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-50 min-w-0 break-words">
                {track.name}
              </h1>
            </div>
            {track.description && (
              <p className="text-ink-400 mt-2 max-w-2xl leading-relaxed">
                {track.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={cn(
                "px-3 py-1 rounded-full text-sm font-semibold border tabular-nums",
                accent.soft
              )}
            >
              {progress}%
            </span>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="p-1.5 rounded-lg text-ink-400 hover:text-ink-100 hover:bg-ink-800 transition"
                aria-label="Track actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 z-20 w-36 bg-ink-900 border border-ink-700 rounded-lg shadow-xl shadow-black/40 py-1">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setEditOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-ink-200 hover:bg-ink-800 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        await archiveTrack(track.id);
                        navigate("/learning");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-ink-200 hover:bg-ink-800 transition"
                    >
                      <Archive className="w-3.5 h-3.5" /> Archive
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-ink-500">
          <span>Started {formatTrackDate(track.startedOn)}</span>
          {track.targetFinishOn && (
            <>
              <span className="text-ink-700">•</span>
              <span>Target {formatTrackDate(track.targetFinishOn)}</span>
            </>
          )}
          <span className="text-ink-700">•</span>
          <span>Day {dayNumber(track.startedOn)}</span>
        </div>
      </div>

      {/* ============ Section 2 — Roadmap (hero) ============ */}
      <section>
        <div className={cn(SECTION_LABEL, "mb-4")}>Roadmap</div>
        <RoadmapTimeline milestones={trackMilestones} accent={accent} />
      </section>

      {/* ============ Section 3 — Habits + streaks ============ */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Today */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <div className={SECTION_LABEL}>Today</div>
            <div className="text-[11px] text-ink-500">{todayLabel}</div>
          </div>
          {todayHabits.length === 0 ? (
            <div className="text-sm text-ink-500 py-4">
              No habits due today. Enjoy the breather.
            </div>
          ) : (
            <div className="space-y-0.5">
              {todayHabits.map((h) => (
                <TodayHabitRow
                  key={h.id}
                  habit={h}
                  date={today}
                  accent={accent}
                />
              ))}
            </div>
          )}
        </div>

        {/* Streak grid */}
        <div>
          <div className={cn(SECTION_LABEL, "mb-4")}>Streaks</div>
          {trackHabits.length === 0 ? (
            <div className="text-sm text-ink-500 py-4">No habits yet.</div>
          ) : (
            <div className="space-y-6">
              {trackHabits.map((h) => (
                <HabitHeatmap key={h.id} habit={h} accent={accent} />
              ))}
            </div>
          )}
        </div>
      </section>

      <TrackDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        track={track}
      />
    </motion.div>
  );
}
