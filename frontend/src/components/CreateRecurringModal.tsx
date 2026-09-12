import React, { useState, useEffect } from 'react';
import { Category, Cadence, RecurringTemplate, CreateRecurringRequest } from '../types';
import api from '../api/client';
import { X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface CreateRecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
  userCurrency: string;
  editingTemplate?: RecurringTemplate | null;
}

export const CreateRecurringModal: React.FC<CreateRecurringModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  categories,
  userCurrency,
  editingTemplate,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>(userCurrency);
  const [cadence, setCadence] = useState<Cadence>('MONTHLY');
  const [nextDueDate, setNextDueDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingTemplate) {
      setDescription(editingTemplate.description);
      setCategoryId(editingTemplate.category?.id || '');
      setAmount(editingTemplate.amount.toString());
      setCurrency(editingTemplate.currency || userCurrency);
      setCadence(editingTemplate.cadence);
      setNextDueDate(editingTemplate.nextDueDate.split('T')[0]);
    } else {
      setDescription('');
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setAmount('');
      setCurrency(userCurrency);
      setCadence('MONTHLY');
      setNextDueDate(new Date().toISOString().split('T')[0]);
    }
    setError(null);
  }, [editingTemplate, isOpen, categories, userCurrency]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }
    if (!categoryId) {
      setError('Please select a category');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: CreateRecurringRequest = {
      description: description.trim(),
      categoryId,
      amount: numAmount,
      currency,
      cadence,
      nextDueDate,
    };

    try {
      if (editingTemplate) {
        await api.put(`/recurring/${editingTemplate.id}`, payload);
      } else {
        await api.post('/recurring', payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save recurring template', err);
      setError(err.response?.data?.message || 'Failed to save recurring template');
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
          {/* Header */}
          <div className="flex items-center justify-between border-b border-hairline-light dark:border-hairline-dark pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <RefreshCw size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-ink-primary dark:text-ink-darkPrimary">
                  {editingTemplate ? 'Edit Recurring Template' : 'Add Recurring Template'}
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  {editingTemplate ? 'Update charge terms' : 'Set up auto-repeating expenses'}
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
            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                Description / Vendor Name
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Rent, Netflix, Gym Membership"
                className="w-full px-4 py-2.5 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-sm font-medium text-ink-primary dark:text-ink-darkPrimary focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-sm font-medium text-ink-primary dark:text-ink-darkPrimary focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="" disabled>Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount and Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-sm font-medium text-ink-primary dark:text-ink-darkPrimary focus:outline-hidden focus:ring-2 focus:ring-indigo-500 tabular-nums"
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
                  className="w-full px-3 py-2.5 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-sm font-bold text-ink-primary dark:text-ink-darkPrimary focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            {/* Cadence and Next Due Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                  Cadence
                </label>
                <select
                  value={cadence}
                  onChange={(e) => setCadence(e.target.value as Cadence)}
                  className="w-full px-4 py-2.5 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-sm font-medium text-ink-primary dark:text-ink-darkPrimary focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="DAILY">Daily</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                  Next Charge Date
                </label>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-sm font-medium text-ink-primary dark:text-ink-darkPrimary focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Actions */}
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
                {submitting ? 'Saving...' : editingTemplate ? 'Update Template' : 'Save Template'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
