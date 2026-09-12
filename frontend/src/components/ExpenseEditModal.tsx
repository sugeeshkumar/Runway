import React, { useState, useEffect } from 'react';
import { Expense, Category } from '../types';
import api from '../api/client';
import { X, Trash2, Check } from 'lucide-react';

interface ExpenseEditModalProps {
  expense: Expense | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onExpenseUpdated: () => void;
}

export const ExpenseEditModal: React.FC<ExpenseEditModalProps> = ({
  expense,
  categories,
  isOpen,
  onClose,
  onExpenseUpdated,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('INR');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [occurredAt, setOccurredAt] = useState<string>('');

  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (expense) {
      setAmount(expense.amount);
      setCurrency(expense.currency || 'INR');
      setCategoryId(expense.category.id);
      setDescription(expense.description);
      setMerchant(expense.merchant || '');
      setOccurredAt(new Date(expense.occurredAt).toISOString().slice(0, 16));
    }
  }, [expense]);

  if (!isOpen || !expense) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !categoryId) return;

    setSaving(true);
    try {
      await api.put(`/expenses/${expense.id}`, {
        amount,
        currency,
        categoryId,
        description,
        merchant: merchant.trim() ? merchant : null,
        occurredAt: new Date(occurredAt).toISOString(),
        source: expense.source,
      });

      onExpenseUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to update expense', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    setDeleting(true);
    try {
      await api.delete(`/expenses/${expense.id}`);
      onExpenseUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to delete expense', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-canvas-light dark:bg-canvas-dark border border-hairline-light dark:border-hairline-dark rounded-xl p-6 w-full max-w-md shadow-lg transition-all">
        <div className="flex items-center justify-between pb-3.5 border-b border-hairline-light dark:border-hairline-dark">
          <h3 className="font-serif text-lg font-normal text-ink-primary dark:text-ink-darkPrimary">
            Edit Expense
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ink-secondary dark:text-ink-darkSecondary hover:text-ink-primary dark:hover:text-ink-darkPrimary"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-sans text-xs font-medium text-ink-secondary dark:text-ink-darkSecondary mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-hairline-light dark:border-hairline-dark bg-transparent font-mono text-xs font-medium text-ink-primary dark:text-ink-darkPrimary focus:outline-none focus:border-clay-600 dark:focus:border-clay-500"
              >
                <option value="INR" className="bg-canvas-light dark:bg-canvas-dark">INR (₹)</option>
                <option value="USD" className="bg-canvas-light dark:bg-canvas-dark">USD ($)</option>
                <option value="EUR" className="bg-canvas-light dark:bg-canvas-dark">EUR (€)</option>
                <option value="GBP" className="bg-canvas-light dark:bg-canvas-dark">GBP (£)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block font-sans text-xs font-medium text-ink-secondary dark:text-ink-darkSecondary mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-hairline-light dark:border-hairline-dark bg-transparent font-mono text-xs font-bold text-ink-primary dark:text-ink-darkPrimary tabular-nums focus:outline-none focus:border-clay-600 dark:focus:border-clay-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-sans text-xs font-medium text-ink-secondary dark:text-ink-darkSecondary mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-hairline-light dark:border-hairline-dark bg-transparent font-sans text-xs font-medium text-ink-primary dark:text-ink-darkPrimary focus:outline-none focus:border-clay-600 dark:focus:border-clay-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-canvas-light dark:bg-canvas-dark">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-sans text-xs font-medium text-ink-secondary dark:text-ink-darkSecondary mb-1">Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-hairline-light dark:border-hairline-dark bg-transparent font-sans text-xs text-ink-primary dark:text-ink-darkPrimary focus:outline-none focus:border-clay-600 dark:focus:border-clay-500"
            />
          </div>

          <div>
            <label className="block font-sans text-xs font-medium text-ink-secondary dark:text-ink-darkSecondary mb-1">Merchant (Optional)</label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Swiggy, Whole Foods"
              className="w-full px-3 py-2 rounded-lg border border-hairline-light dark:border-hairline-dark bg-transparent font-sans text-xs text-ink-primary dark:text-ink-darkPrimary focus:outline-none focus:border-clay-600 dark:focus:border-clay-500"
            />
          </div>

          <div>
            <label className="block font-sans text-xs font-medium text-ink-secondary dark:text-ink-darkSecondary mb-1">Date & Time</label>
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-hairline-light dark:border-hairline-dark bg-transparent font-mono text-xs text-ink-primary dark:text-ink-darkPrimary focus:outline-none focus:border-clay-600 dark:focus:border-clay-500"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-hairline-light dark:border-hairline-dark">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-sans text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg font-sans text-xs font-medium text-ink-secondary dark:text-ink-darkSecondary hover:bg-stone-200/50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-clay-600 hover:bg-clay-700 text-white font-sans text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={14} />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
