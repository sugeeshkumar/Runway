import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Category } from '../types';
import * as budgetRepository from '../data/budgetRepository';
import { X, Check, Trash2 } from 'lucide-react';

interface BudgetModalProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onBudgetUpdated: () => void;
  initialBudgetId?: string | null;
  initialCategoryId?: string | null;
  initialAmount?: number;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  categories,
  isOpen,
  onClose,
  onBudgetUpdated,
  initialBudgetId = null,
  initialCategoryId = null,
  initialAmount = 2000,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [categoryId, setCategoryId] = useState<string>(initialCategoryId || 'overall');
  const [amount, setAmount] = useState<number>(initialAmount);
  const [periodMonth, setPeriodMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    setCategoryId(initialCategoryId || 'overall');
    setAmount(initialAmount || 2000);
  }, [initialCategoryId, initialAmount, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    setSaving(true);
    try {
      await budgetRepository.createBudget({
        categoryId: categoryId === 'overall' ? null : categoryId,
        periodMonth,
        amount,
      });

      onBudgetUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to save budget', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLimit = async () => {
    if (!initialBudgetId) return;
    if (!window.confirm('Are you sure you want to remove this budget limit?')) return;

    setDeleting(true);
    try {
      await budgetRepository.deleteBudget(initialBudgetId);
      onBudgetUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to delete budget limit', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl transition-all"
      >
        <div className="flex items-center justify-between pb-4 border-b border-hairline-light dark:border-hairline-dark">
          <h3 className="text-lg font-bold text-ink-primary dark:text-ink-darkPrimary">
            {initialBudgetId ? 'Edit Budget Limit' : 'Set Monthly Budget'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Target Budget</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-hairline-light dark:border-hairline-dark bg-stone-50 dark:bg-neutral-850 text-sm font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="overall">Overall Monthly Budget</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} Category
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Month Period</label>
            <input
              type="month"
              value={periodMonth}
              onChange={(e) => setPeriodMonth(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-hairline-light dark:border-hairline-dark bg-stone-50 dark:bg-neutral-850 text-sm font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Monthly Budget Limit</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-hairline-light dark:border-hairline-dark bg-stone-50 dark:bg-neutral-850 text-base font-bold tabular-nums focus:outline-none focus:border-emerald-500 text-emerald-600 dark:text-emerald-400"
              placeholder="e.g. 50000"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-hairline-light dark:border-hairline-dark">
            {initialBudgetId ? (
              <button
                type="button"
                onClick={handleDeleteLimit}
                disabled={deleting}
                className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>{deleting ? 'Removing...' : 'Remove Limit'}</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <Check size={14} />
                <span>{saving ? 'Saving...' : 'Save Limit'}</span>
              </motion.button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
