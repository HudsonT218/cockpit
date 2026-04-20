import { useState } from "react";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

export default function Login() {
  const signIn = useStore((s) => s.signIn);
  const signUp = useStore((s) => s.signUp);
  const signInWithGoogle = useStore((s) => s.signInWithGoogle);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fn = mode === "in" ? signIn : signUp;
    const res = await fn(email, password);
    if (res.error) setError(res.error);
    setBusy(false);
  };

  const google = async () => {
    setError(null);
    setBusy(true);
    const res = await signInWithGoogle();
    if (res.error) {
      setError(res.error);
      setBusy(false);
    }
    // on success the browser redirects to Google, no need to reset busy
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 text-ink-100 relative overflow-hidden">
      {/* ambient glow */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] opacity-[0.08] blur-3xl rounded-full bg-accent-amber pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] opacity-[0.06] blur-3xl rounded-full bg-accent-rose pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-[380px] max-w-[92vw] p-8 bg-ink-900/60 border border-ink-800 rounded-2xl backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-amber to-accent-rose shadow-lg shadow-accent-amber/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Cockpit</div>
            <div className="text-[10px] uppercase tracking-wider text-ink-500 font-mono">
              personal dashboard
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-semibold mb-1">
          {mode === "in" ? "Welcome back." : "Get started."}
        </h1>
        <p className="text-sm text-ink-400 mb-6">
          {mode === "in"
            ? "Sign in to pick up where you left off."
            : "Create your account to save everything to the cloud."}
        </p>

        <button
          type="button"
          onClick={google}
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white text-ink-950 rounded-lg text-sm font-medium hover:bg-ink-100 transition disabled:opacity-40"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-ink-800" />
          <span className="text-[10px] uppercase tracking-wider font-mono text-ink-600">
            or
          </span>
          <div className="h-px flex-1 bg-ink-800" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider font-mono text-ink-500 block mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ink-950 border border-ink-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-ink-600"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider font-mono text-ink-500 block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-ink-950 border border-ink-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-ink-600"
            />
          </div>
          {error && (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-ink-50 text-ink-950 rounded-lg text-sm font-medium hover:bg-white transition disabled:opacity-40"
          >
            {busy
              ? "..."
              : mode === "in"
                ? "Sign in"
                : "Create account"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-ink-800 text-center">
          <button
            onClick={() => {
              setMode(mode === "in" ? "up" : "in");
              setError(null);
            }}
            className="text-xs text-ink-400 hover:text-ink-100 transition"
          >
            {mode === "in"
              ? "Need an account? Sign up."
              : "Have an account? Sign in."}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
