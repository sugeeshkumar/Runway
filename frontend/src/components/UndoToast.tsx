import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, RotateCcw, X } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

export interface UndoToastData {
  id: string;
  amount: number;
  currency: string;
  categoryName: string;
}

interface UndoToastProps {
  toast: UndoToastData | null;
  onUndo: (id: string) => void;
  onDismiss: () => void;
  durationMs?: number;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  toast,
  onUndo,
  onDismiss,
  durationMs = 5000,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [progress, setProgress] = useState<number>(100);

  useEffect(() => {
    if (!toast) return;

    setProgress(100);
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remainingPct);

      if (remainingPct <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast, durationMs, onDismiss]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50 max-w-md w-auto bg-stone-900 border border-hairline-dark text-stone-100 rounded-xl overflow-hidden shadow-lg"
        >
          <div className="p-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-clay-600/20 border border-clay-500/30 flex items-center justify-center text-clay-500 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="font-mono text-xs text-stone-400">Logged automatically</div>
                <div className="font-mono font-bold text-xs text-stone-100 tabular-nums">
                  {formatCurrency(toast.amount, toast.currency)}{' '}
                  <span className="font-sans font-normal text-stone-400">· {toast.categoryName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onUndo(toast.id)}
                className="px-3 py-1.5 bg-clay-600 hover:bg-clay-700 text-white text-xs font-mono font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Undo
              </button>
              <button
                onClick={onDismiss}
                className="p-1 text-stone-400 hover:text-stone-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Countdown Progress Bar */}
          <div className="w-full bg-stone-800 h-1 overflow-hidden">
            <div
              className="h-full bg-clay-600 transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
