import { Link } from "react-router-dom";
import type { Project } from "@/lib/types";
import { relativeTime } from "@/lib/utils";
import StateBadge from "./StateBadge";
import TypeBadge from "./TypeBadge";
import { ArrowUpRight, GitBranch, CircleDot } from "lucide-react";
import { useStore } from "@/lib/store";
import { parseGithubRepo } from "@/lib/github";

export default function ProjectCard({ project }: { project: Project }) {
  const tasks = useStore((s) => s.tasks);
  const repoCache = useStore((s) => s.githubRepoCache);
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const openCount = projectTasks.filter((t) => t.status !== "done").length;
  const doneCount = projectTasks.filter((t) => t.status === "done").length;
  const total = openCount + doneCount;
  const progress = total > 0 ? (doneCount / total) * 100 : 0;
  const repoFullName = parseGithubRepo(project.repoUrl);
  const repoInfo = repoFullName ? repoCache[repoFullName] : null;
  const openIssues = repoInfo?.openIssuesCount ?? 0;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="group relative block p-5 bg-ink-900/60 border border-ink-800 rounded-xl hover:border-ink-700 hover:bg-ink-900 transition-all overflow-hidden"
    >
      {/* accent glow */}
      <div
        className="absolute -top-px left-5 right-5 h-px opacity-80"
        style={{
          background: `linear-gradient(90deg, transparent, ${project.accentColor}, transparent)`,
        }}
      />
      <div
        className="absolute top-0 left-0 w-20 h-20 opacity-10 blur-2xl rounded-full"
        style={{ background: project.accentColor }}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: project.accentColor }}
            />
            <TypeBadge type={project.type} />
          </div>
          <StateBadge state={project.state} />
        </div>

        <h3 className="text-base font-semibold text-ink-50 mb-1 group-hover:text-white transition">
          {project.name}
        </h3>
        <p className="text-sm text-ink-400 line-clamp-2 mb-4">
          {project.oneLiner}
        </p>

        {project.nextAction && (
          <div className="mb-4 p-3 bg-ink-950/60 border border-ink-800 rounded-lg">
            <div className="text-[10px] uppercase tracking-wider text-ink-500 font-mono mb-1">
              Next action
            </div>
            <div className="text-sm text-ink-200 line-clamp-2">
              {project.nextAction}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-ink-500 font-mono">
          <div className="flex items-center gap-3">
            {total > 0 && (
              <span>
                {doneCount}/{total} tasks
              </span>
            )}
            <span>{relativeTime(project.lastTouchedAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            {openIssues > 0 && (
              <span
                className="inline-flex items-center gap-0.5"
                title={`${openIssues} open issues/PRs`}
              >
                <CircleDot className="w-3 h-3" />
                {openIssues}
              </span>
            )}
            {project.repoUrl && <GitBranch className="w-3 h-3" />}
          </div>
        </div>

        {total > 0 && (
          <div className="mt-3 h-1 bg-ink-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: project.accentColor,
              }}
            />
          </div>
        )}

        <ArrowUpRight className="absolute top-0 right-0 w-4 h-4 text-ink-600 opacity-0 group-hover:opacity-100 group-hover:text-ink-300 transition" />
      </div>
    </Link>
  );
}
