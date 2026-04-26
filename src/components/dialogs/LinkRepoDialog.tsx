import { useEffect, useMemo, useState } from "react";
import Modal, { FormRow, ModalActions, inputCls } from "../Modal";
import { useStore } from "@/lib/store";
import { ghListRepos, type GhRepo } from "@/lib/github";
import { Search, GitBranch, Lock, Globe, ExternalLink } from "lucide-react";
import { relativeTime } from "@/lib/utils";

export default function LinkRepoDialog({
  open,
  onClose,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
}) {
  const githubToken = useStore((s) => s.githubToken);
  const projects = useStore((s) => s.projects);
  const updateProject = useStore((s) => s.updateProject);
  const syncGithubActivity = useStore((s) => s.syncGithubActivity);
  const project = projects.find((p) => p.id === projectId);

  const [repos, setRepos] = useState<GhRepo[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [manualUrl, setManualUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    setQ("");
    setManualUrl(project?.repoUrl ?? "");
    if (!githubToken) return;
    setLoading(true);
    setError(null);
    ghListRepos(githubToken)
      .then(setRepos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, githubToken, project?.repoUrl]);

  const filtered = useMemo(() => {
    if (!repos) return [];
    const query = q.toLowerCase().trim();
    const list = query
      ? repos.filter(
          (r) =>
            r.name.toLowerCase().includes(query) ||
            r.full_name.toLowerCase().includes(query) ||
            (r.description ?? "").toLowerCase().includes(query)
        )
      : repos;
    return list.slice(0, 60);
  }, [repos, q]);

  const link = async (repo: GhRepo) => {
    await updateProject(projectId, { repoUrl: repo.html_url });
    void syncGithubActivity(true);
    onClose();
  };

  const saveManual = async () => {
    await updateProject(projectId, { repoUrl: manualUrl || undefined });
    void syncGithubActivity(true);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Link a GitHub repo" width={560}>
      {!githubToken && (
        <div className="mb-4 p-3 border border-amber-500/20 bg-amber-500/[0.04] rounded-lg text-sm text-amber-300">
          Connect GitHub in Settings to browse your repos. You can still paste
          a URL below.
        </div>
      )}

      {githubToken && (
        <>
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg">
            <Search className="w-3.5 h-3.5 text-ink-500" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search your repos…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-ink-500"
            />
            {loading && (
              <span className="text-[10px] font-mono text-ink-500">loading…</span>
            )}
          </div>

          {error && (
            <div className="mb-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="max-h-[320px] overflow-y-auto -mx-1 px-1 space-y-1">
            {filtered.map((r) => {
              const isLinked = project?.repoUrl === r.html_url;
              return (
                <button
                  key={r.id}
                  onClick={() => link(r)}
                  className="w-full text-left p-2.5 rounded-lg border border-ink-800 bg-ink-950/40 hover:border-ink-700 hover:bg-ink-900 transition group"
                >
                  <div className="flex items-center gap-2">
                    {r.private ? (
                      <Lock className="w-3 h-3 text-ink-500 shrink-0" />
                    ) : (
                      <Globe className="w-3 h-3 text-ink-500 shrink-0" />
                    )}
                    <span className="text-sm text-ink-100 truncate">
                      {r.full_name}
                    </span>
                    {isLinked && (
                      <span className="ml-auto text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                        linked
                      </span>
                    )}
                    {!isLinked && (
                      <span className="ml-auto text-[10px] font-mono text-ink-600">
                        {relativeTime(r.pushed_at)}
                      </span>
                    )}
                  </div>
                  {r.description && (
                    <div className="text-xs text-ink-500 truncate mt-0.5 ml-5">
                      {r.description}
                    </div>
                  )}
                  {r.language && (
                    <div className="text-[10px] font-mono text-ink-600 ml-5 mt-0.5">
                      {r.language}
                    </div>
                  )}
                </button>
              );
            })}
            {!loading && githubToken && filtered.length === 0 && (
              <div className="text-sm text-ink-500 py-6 text-center">
                No repos match "{q}".
              </div>
            )}
          </div>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-ink-800" />
            <span className="text-[10px] uppercase tracking-wider font-mono text-ink-600">
              or paste a URL
            </span>
            <div className="h-px flex-1 bg-ink-800" />
          </div>
        </>
      )}

      <FormRow label="Repo URL">
        <input
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className={inputCls()}
        />
      </FormRow>

      <ModalActions>
        {project?.repoUrl && (
          <button
            onClick={async () => {
              await updateProject(projectId, { repoUrl: undefined });
              onClose();
            }}
            className="mr-auto px-3 py-1.5 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
          >
            Unlink
          </button>
        )}
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm text-ink-300 hover:bg-ink-800 rounded-lg transition"
        >
          Cancel
        </button>
        <button
          onClick={saveManual}
          className="px-3 py-1.5 text-sm bg-ink-50 text-ink-950 rounded-lg font-medium hover:bg-white transition"
        >
          Save URL
        </button>
      </ModalActions>
    </Modal>
  );
}
