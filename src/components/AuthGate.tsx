import { useStore } from "@/lib/store";
import Login from "@/pages/Login";
import { Sparkles } from "lucide-react";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const authStatus = useStore((s) => s.authStatus);
  const loaded = useStore((s) => s.loaded);

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
