import React, { useState } from 'react';
import { SavingsGoal } from '../types';
import api from '../api/client';
import { X, Target } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  userCurrency: string;
}

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  userCurrency,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [name, setName] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  const [currency, setCurrency] = useState<string>(userCurrency);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Goal name is required');
      return;
    }
    const num = parseFloat(targetAmount);
    if (isNaN(num) || num <= 0) {
      setError('Target amount must be a positive number');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.post('/goals', {
        name: name.trim(),
        targetAmount: num,
        targetDate: targetDate ? targetDate : null,
        currency,
      });
      onSaved();
      onClose();
      setName('');
      setTargetAmount('');
      setTargetDate('');
    } catch (err: any) {
      console.error('Failed to create goal', err);
      setError(err.response?.data?.message || 'Failed to create goal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5"
        >
          <div className="flex items-center justify-between border-b border-hairline-light dark:border-hairline-dark pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Target size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-ink-primary dark:text-ink-darkPrimary">
                  Create Savings Goal
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  Set a target amount and track contributions over time
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                Goal Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Emergency Fund, Japan Trip, New Macbook"
                className="w-full px-4 py-2.5 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-sm font-medium text-ink-primary dark:text-ink-darkPrimary focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                  Target Amount
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-sm font-medium text-ink-primary dark:text-ink-darkPrimary focus:outline-hidden focus:ring-2 focus:ring-emerald-500 tabular-nums"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-sm font-bold text-ink-primary dark:text-ink-darkPrimary focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                Target Date (Optional)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-sm font-medium text-ink-primary dark:text-ink-darkPrimary focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-hairline-light dark:border-hairline-dark">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <motion.button
                whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-ink-primary text-white dark:bg-white dark:text-neutral-900 text-xs font-extrabold shadow-md hover:bg-stone-800 dark:hover:bg-stone-100 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Creating Goal...' : 'Create Savings Goal'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
