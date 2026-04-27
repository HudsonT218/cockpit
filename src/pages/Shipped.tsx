import { useStore } from "@/lib/store";
import TypeBadge from "@/components/TypeBadge";
import { formatDate } from "@/lib/utils";
import { Trophy, ExternalLink, GitBranch } from "lucide-react";
import { motion } from "framer-motion";

export default function Shipped() {
  const projects = useStore((s) => s.projects);
  const shipped = projects
    .filter((p) => p.state === "shipped")
    .sort((a, b) => b.lastTouchedAt.localeCompare(a.lastTouchedAt));

  return (
    <div className="p-4 md:p-8 pb-16 max-w-[1400px]">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500 font-mono mb-1 inline-flex items-center gap-1.5">
            <Trophy className="w-3 h-3" /> Trophy case
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Shipped</h1>
        </div>
        <div className="text-sm text-ink-500 font-mono">
          {shipped.length} shipped
        </div>
      </div>

      {shipped.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-ink-800 rounded-2xl">
          <Trophy className="w-10 h-10 text-ink-700 mx-auto mb-3" />
          <div className="text-ink-500">
            Nothing shipped yet. Your first win lives here.
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {shipped.map((p) => (
            <div
              key={p.id}
              className="group relative p-5 bg-ink-900/40 border border-ink-800 rounded-2xl hover:border-ink-700 transition overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${p.accentColor} 0%, transparent 60%)`,
                }}
              />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: `${p.accentColor}20`,
                      border: `1px solid ${p.accentColor}40`,
                    }}
                  >
                    <Trophy
                      className="w-4 h-4"
                      style={{ color: p.accentColor }}
                    />
                  </div>
                  <TypeBadge type={p.type} />
                </div>
                <h3 className="text-lg font-semibold text-ink-50 mb-1">
                  {p.name}
                </h3>
                <p className="text-sm text-ink-400 line-clamp-2 mb-4">
                  {p.oneLiner}
                </p>
                <div className="flex items-center justify-between text-[11px] font-mono text-ink-500">
                  <span>{formatDate(p.lastTouchedAt, { month: "short", year: "numeric" })}</span>
                  <div className="flex items-center gap-2">
                    {p.liveUrl && (
                      <a
                        href={p.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-ink-200"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {p.repoUrl && (
                      <a
                        href={p.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-ink-200"
                      >
                        <GitBranch className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
