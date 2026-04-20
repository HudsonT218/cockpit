import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  width = 440,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            style={{ width }}
            className="max-w-[92vw] bg-ink-900 border border-ink-700 rounded-xl shadow-2xl shadow-black/40 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-ink-800">
              <div className="text-sm font-medium text-ink-100">{title}</div>
              <button
                onClick={onClose}
                className="text-ink-500 hover:text-ink-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function FormRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-3">
      <div className="text-[10px] uppercase tracking-wider font-mono text-ink-500 mb-1">
        {label}
      </div>
      {children}
    </label>
  );
}

export function ModalActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-ink-800">
      {children}
    </div>
  );
}

export function inputCls() {
  return "w-full bg-ink-950 border border-ink-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-ink-600";
}
