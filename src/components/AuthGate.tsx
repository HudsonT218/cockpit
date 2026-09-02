import { useStore } from "@/lib/store";
import { supabaseConfigured } from "@/lib/supabase/client";
import Login from "@/pages/Login";
import { Sparkles } from "lucide-react";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const authStatus = useStore((s) => s.authStatus);
  const loaded = useStore((s) => s.loaded);

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950 text-ink-100 p-6">
        <div className="max-w-md w-full p-6 rounded-2xl border border-ink-800 bg-ink-900/60">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-accent-amber" />
            <div className="text-sm font-semibold">Cockpit needs local env</div>
          </div>
          <p className="text-sm text-ink-400 leading-relaxed mb-4">
            There is no <code className="font-mono text-ink-200">.env.local</code> in
            this folder, so the app cannot talk to Supabase. Vercel has the keys.
            Local does not.
          </p>
          <ol className="text-sm text-ink-300 space-y-2 list-decimal pl-5 mb-4">
            <li>
              Open the Vercel project → Settings → Environment Variables
            </li>
            <li>
              Copy <span className="font-mono text-ink-100">VITE_SUPABASE_URL</span> and{" "}
              <span className="font-mono text-ink-100">VITE_SUPABASE_ANON_KEY</span>
            </li>
            <li>
              Create <span className="font-mono text-ink-100">.env.local</span> in the
              project root with those two lines
            </li>
            <li>Restart the dev server, then refresh</li>
          </ol>
          <pre className="text-[11px] font-mono text-ink-400 bg-ink-950 border border-ink-800 rounded-lg p-3 overflow-x-auto">
{`VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
          </pre>
        </div>
      </div>
    );
  }

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950 text-ink-500">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-accent-amber animate-pulse" />
          <span>Warming up…</span>
        </div>
      </div>
    );
  }

  if (authStatus === "guest") return <Login />;

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950 text-ink-500">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-accent-amber animate-pulse" />
          <span>Loading your cockpit…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
