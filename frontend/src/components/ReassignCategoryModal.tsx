import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Category } from '../types';
import api from '../api/client';
import { AlertTriangle, X, Check } from 'lucide-react';

interface ReassignCategoryModalProps {
  categoryToDelete: Category | null;
  allCategories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onCategoryDeleted: () => void;
}

export const ReassignCategoryModal: React.FC<ReassignCategoryModalProps> = ({
  categoryToDelete,
  allCategories,
  isOpen,
  onClose,
  onCategoryDeleted,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const availableTargets = allCategories.filter((c) => categoryToDelete && c.id !== categoryToDelete.id);

  const [targetId, setTargetId] = useState<string>(availableTargets[0]?.id || '');
  const [deleting, setDeleting] = useState<boolean>(false);

  if (!isOpen || !categoryToDelete) return null;

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId && availableTargets.length > 0) return;

    setDeleting(true);
    try {
      await api.delete(`/categories/${categoryToDelete.id}?reassignTo=${targetId}`);
      onCategoryDeleted();
      onClose();
    } catch (err) {
      console.error('Failed to delete category with reassignment', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl transition-all"
      >
        <div className="flex items-center justify-between pb-4 border-b border-hairline-light dark:border-hairline-dark">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
            <h3 className="text-base font-bold text-ink-primary dark:text-ink-darkPrimary">
              Reassign Expenses
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleConfirmDelete} className="space-y-4 pt-4">
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            Deleting <strong className="text-ink-primary dark:text-ink-darkPrimary">{categoryToDelete.name}</strong> will reassign all existing transactions to another category so your expense history stays clean and intact.
          </p>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
              Reassign transactions to:
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50 dark:bg-neutral-850 text-sm font-medium focus:outline-none focus:border-stone-400"
            >
              {availableTargets.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-hairline-light dark:border-hairline-dark">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-500 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="submit"
              disabled={deleting}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check size={14} />
              <span>{deleting ? 'Reassigning...' : 'Reassign & Delete'}</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
