import { useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface Toast {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
}

let current: Toast | null = null;
let seq = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function showToast(text: string, action?: Toast['action']) {
  current = { id: ++seq, text, action };
  emit();
  clearTimeout(timer);
  timer = setTimeout(() => {
    current = null;
    emit();
  }, action ? 4500 : 2600);
}

export function ToastHost() {
  const t = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
  return (
    <div className="toast-host" aria-live="polite">
      <AnimatePresence mode="popLayout">
        {t && (
          <motion.div
            key={t.id}
            className="toast"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
          >
            <span>{t.text}</span>
            {t.action && (
              <button
                className="toast-action press"
                onClick={() => {
                  t.action?.run();
                  current = null;
                  emit();
                }}
              >
                {t.action.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
