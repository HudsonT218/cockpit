import { useState } from "react";
import Modal, { FormRow, ModalActions, inputCls } from "../Modal";
import { useStore } from "@/lib/store";
import { Github, Check, ExternalLink, AlertCircle } from "lucide-react";

export default function SettingsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const displayName = useStore((s) => s.displayName);
  const user = useStore((s) => s.user);
  const setDisplayName = useStore((s) => s.setDisplayName);
  const githubUser = useStore((s) => s.githubUser);
  const githubToken = useStore((s) => s.githubToken);
  const connectGithub = useStore((s) => s.connectGithub);
  const disconnectGithub = useStore((s) => s.disconnectGithub);

  const [name, setName] = useState(displayName ?? "");
  const [token, setToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveName = async () => {
    if (name !== displayName) await setDisplayName(name);
  };

  const onConnect = async () => {
    setError(null);
    setConnecting(true);
    const res = await connectGithub(token.trim());
    if (res.error) setError(res.error);
    else setToken("");
    setConnecting(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings" width={520}>
      {/* Profile */}
      <FormRow label="Display name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          placeholder="What should Cockpit call you?"
          className={inputCls()}
        />
      </FormRow>
      <FormRow label="Email">
        <div className={`${inputCls()} opacity-60 flex items-center`}>
          {user?.email}
        </div>
      </FormRow>

      {/* GitHub */}
      <div className="mt-6 pt-5 border-t border-ink-800">
        <div className="flex items-center gap-2 mb-3">
          <Github className="w-4 h-4 text-ink-300" />
          <span className="text-sm font-medium text-ink-100">GitHub</span>
        </div>

        {githubUser ? (
          <div className="p-3 border border-emerald-500/20 bg-emerald-500/[0.04] rounded-lg">
            <div className="flex items-center gap-3">
              <img
                src={githubUser.avatar_url}
                alt=""
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-ink-100 inline-flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-400" />
                  Connected as{" "}
                  <a
                    href={githubUser.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline"
                  >
                    @{githubUser.login}
                  </a>
                </div>
                {githubUser.name && (
                  <div className="text-xs text-ink-500">{githubUser.name}</div>
                )}
              </div>
              <button
                onClick={() => disconnectGithub()}
                className="text-xs text-ink-500 hover:text-rose-400 transition"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : githubToken ? (
          <div className="p-3 border border-amber-500/20 bg-amber-500/[0.04] rounded-lg text-sm text-amber-300 inline-flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" />
            Token saved but couldn't verify. It may have expired.
            <button
              onClick={() => disconnectGithub()}
              className="ml-auto text-xs hover:underline"
            >
              Clear
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-ink-400 mb-3 leading-relaxed">
              Paste a Personal Access Token to link repos to projects and see
              recent commits. Classic or fine-grained tokens both work —{" "}
              <code className="font-mono text-ink-300">repo</code> scope only
              (or <code className="font-mono text-ink-300">public_repo</code>{" "}
              if all your work is public).
            </p>
            <FormRow label="Personal access token">
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_..."
                className={inputCls()}
              />
            </FormRow>
            {error && (
              <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 mb-3">
                {error}
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={onConnect}
                disabled={!token || connecting}
                className="px-3 py-1.5 text-sm bg-ink-50 text-ink-950 rounded-lg font-medium hover:bg-white transition disabled:opacity-40"
              >
                {connecting ? "Verifying…" : "Connect"}
              </button>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=Cockpit%20Dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-ink-400 hover:text-ink-100 inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Create a token
              </a>
            </div>
          </>
        )}
      </div>

      <ModalActions>
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm bg-ink-50 text-ink-950 rounded-lg font-medium hover:bg-white transition"
        >
          Done
        </button>
      </ModalActions>
    </Modal>
  );
}
