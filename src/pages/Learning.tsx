import { useEffect, useState } from "react";
import { useLearningStore } from "@/lib/learningStore";
import TrackCard from "@/components/learning/TrackCard";
import TrackDialog from "@/components/dialogs/TrackDialog";
import { motion } from "framer-motion";
import { Plus, GraduationCap } from "lucide-react";

export default function Learning() {
  const tracks = useLearningStore((s) => s.tracks);
  const loaded = useLearningStore((s) => s.loaded);
  const loadLearning = useLearningStore((s) => s.loadLearning);
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    if (!loaded) void loadLearning();
  }, [loaded, loadLearning]);

  const active = tracks.filter((t) => !t.archived);

  return (
    <div className="p-4 md:p-8 pb-16 max-w-[1400px]">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500 font-mono mb-1">
            Long-horizon goals
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Learning
            {active.length > 0 && (
              <span className="text-ink-500 font-normal ml-3 text-xl">
                {active.length}
              </span>
            )}
          </h1>
        </div>
        <button
          onClick={() => setNewOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-ink-50 text-ink-950 rounded-lg text-sm font-medium hover:bg-white transition"
        >
          <Plus className="w-4 h-4" /> New track
        </button>
      </div>

      {loaded && active.length === 0 ? (
        <div className="text-center py-20">
          <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-ink-900 border border-ink-800 flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-ink-500" />
          </div>
          <div className="text-lg font-medium text-ink-200 mb-1">
            Start your first learning track
          </div>
          <p className="text-sm text-ink-500 mb-6 max-w-sm mx-auto">
            Track a long-horizon goal with a milestone roadmap, daily habits, and
            a streak heatmap.
          </p>
          <button
            onClick={() => setNewOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-ink-50 text-ink-950 rounded-lg text-sm font-medium hover:bg-white transition"
          >
            <Plus className="w-4 h-4" /> New track
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {active.map((t) => (
            <TrackCard key={t.id} track={t} />
          ))}
        </motion.div>
      )}

      <TrackDialog open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
