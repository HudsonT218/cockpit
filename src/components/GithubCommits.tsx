import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import {
  ghRepoCommits,
  parseGithubRepo,
  type GhCommit,
} from "@/lib/github";
import { GitCommit, ExternalLink, AlertCircle, Github } from "lucide-react";
import { relativeTime } from "@/lib/utils";

export default function GithubCommits({ repoUrl }: { repoUrl?: string }) {
  const token = useStore((s) => s.githubToken);
  const repoFullName = parseGithubRepo(repoUrl);
  const [commits, setCommits] = useState<GhCommit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !repoFullName) {
      setCommits(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    ghRepoCommits(token, repoFullName, 8)
      .then(setCommits)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, repoFullName]);

  if (!repoFullName) {
    return null;
  }

  return (
    <section className="col-span-12 p-6 rounded-2xl border border-ink-800 bg-ink-900/40">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500 font-mono flex items-center gap-2">
          <GitCommit className="w-3 h-3" /> Recent commits
        </div>
        <a
          href={repoUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-mono text-ink-500 hover:text-ink-200 inline-flex items-center gap-1"
        >
          <Github className="w-3 h-3" /> {repoFullName}{" "}
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>

      {!token && (
        <div className="text-sm text-ink-500 inline-flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-ink-500" />
          Connect GitHub in Settings to see commit history.
        </div>
      )}

      {token && loading && (
        <div className="text-sm text-ink-500">Loading commits…</div>
      )}

      {token && error && (
        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {token && commits && commits.length === 0 && (
        <div className="text-sm text-ink-500">No commits yet.</div>
      )}

      {token && commits && commits.length > 0 && (
        <div className="space-y-2">
          {commits.map((c) => {
            const line = c.commit.message.split("\n")[0];
            return (
              <a
                key={c.sha}
                href={c.html_url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-ink-800/40 transition"
              >
                <span className="font-mono text-[10px] text-ink-500 bg-ink-950 border border-ink-800 px-1.5 py-0.5 rounded">
                  {c.sha.slice(0, 7)}
                </span>
                <span className="flex-1 text-sm text-ink-100 truncate">
                  {line}
                </span>
                {c.author?.avatar_url && (
                  <img
                    src={c.author.avatar_url}
                    alt=""
                    className="w-4 h-4 rounded-full"
                  />
                )}
                <span className="text-[10px] font-mono text-ink-500 shrink-0">
                  {relativeTime(c.commit.author.date)}
                </span>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
