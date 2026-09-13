import React, { useState, useEffect, useCallback } from 'react';
import { RecurringTemplate, CommittedSummary, Category } from '../types';
import { formatCurrency } from '../utils/currency';
import * as recurringRepository from '../data/recurringRepository';
import { CategoryIcon } from '../components/CategoryIcon';
import { CreateRecurringModal } from '../components/CreateRecurringModal';
import {
  RefreshCw,
  Plus,
  Play,
  Pause,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

interface RecurringExpensesPageProps {
  categories: Category[];
  userCurrency: string;
  onNavigateToSettings: () => void;
}

export const RecurringExpensesPage: React.FC<RecurringExpensesPageProps> = ({
  categories,
  userCurrency,
  onNavigateToSettings,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [committedSummary, setCommittedSummary] = useState<CommittedSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resTemplates, resSummary] = await Promise.all([
        recurringRepository.getRecurringExpenses(),
        recurringRepository.getCommittedSummary(userCurrency),
      ]);
      setTemplates(resTemplates);
      setCommittedSummary(resSummary);
    } catch (err) {
      console.error('Failed to load recurring data', err);
    } finally {
      setLoading(false);
    }
  }, [userCurrency]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTogglePause = async (id: string) => {
    // Optimistic UI update
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isPaused: !t.isPaused } : t))
    );
    try {
      await recurringRepository.togglePauseRecurringExpense(id);
      await fetchData();
    } catch (err) {
      console.error('Failed to toggle pause state', err);
      // Revert on error
      await fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this recurring template?')) return;
    try {
      await recurringRepository.deleteRecurringExpense(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete template', err);
    }
  };

  const handleProcessNow = async () => {
    try {
      setProcessing(true);
      const res = await recurringRepository.processDueRecurringExpenses(true);
      setToastMessage(res.message || `Processed recurring expenses!`);
      fetchData();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Failed to process recurring charges', err);
      setToastMessage('Failed to process charges');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setProcessing(false);
    }
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const openEditModal = (template: RecurringTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-12 flex justify-center">
        <div className="w-6 h-6 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currency = committedSummary?.currency || userCurrency;
  const committedTotal = committedSummary?.totalCommittedMonthly || 0;
  const monthlyIncome = committedSummary?.monthlyIncome;
  const committedPct = committedSummary?.committedPercentage;

  let progressColor = 'bg-emerald-500';
  if (committedPct != null) {
    if (committedPct > 80) progressColor = 'bg-rose-500';
    else if (committedPct > 50) progressColor = 'bg-amber-500';
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink-primary dark:text-ink-darkPrimary">
            Recurring Expenses
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Subscriptions, fixed bills, and scheduled auto-charges
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <motion.button
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
            onClick={handleProcessNow}
            disabled={processing}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-hairline-light dark:border-hairline-dark text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-50"
            title="Force run scheduler now to generate due charges"
          >
            <RefreshCw size={14} className={processing ? 'animate-spin' : ''} />
            <span>Process Now</span>
          </motion.button>

          <motion.button
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
            onClick={openCreateModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-ink-primary text-white dark:bg-white dark:text-neutral-900 text-xs font-extrabold shadow-sm hover:bg-stone-800 dark:hover:bg-stone-100 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Template</span>
          </motion.button>
        </div>
      </div>

      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </div>
        </motion.div>
      )}

      {/* TOP COMMITTED MONTHLY TOTAL HERO CARD */}
      <div className="bg-gradient-to-br from-stone-900 via-neutral-900 to-stone-950 text-white rounded-3xl p-6 shadow-xl border border-stone-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest font-bold text-stone-400">
              Committed Monthly Expenses
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 text-[11px] font-mono font-bold">
              {templates.length} {templates.length === 1 ? 'Template' : 'Templates'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-white tabular-nums">
                {formatCurrency(committedTotal, currency)}
                <span className="text-xs font-semibold text-stone-400 ml-2">/ month</span>
              </div>
            </div>

            {monthlyIncome && monthlyIncome > 0 ? (
              <div className="text-right sm:text-right">
                <span className="text-xs text-stone-400 block font-medium">
                  Monthly Net Income: {formatCurrency(monthlyIncome, currency)}
                </span>
                <span className="text-sm font-extrabold text-lime-400">
                  {committedPct != null ? `${committedPct.toFixed(1)}% of income committed` : ''}
                </span>
              </div>
            ) : (
              <button
                onClick={onNavigateToSettings}
                className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition-all cursor-pointer"
              >
                <span>Set monthly income to compute committed ratio</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>

          {/* Progress bar for committed percentage */}
          {monthlyIncome && monthlyIncome > 0 && (
            <div className="space-y-1.5 pt-2">
              <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                  style={{ width: `${Math.min(100, committedPct || 0)}%` }}
                />
              </div>
              <p className="text-[11px] text-stone-400 font-medium">
                {committedPct != null && committedPct > 50
                  ? 'Over 50% of monthly income is committed to recurring expenses.'
                  : 'Healthy committed ratio under 50% of monthly income.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* TEMPLATES LIST */}
      <div className="space-y-3">
        <h3 className="text-xs uppercase tracking-wider font-bold text-stone-400 dark:text-stone-500 px-1">
          Active & Paused Subscriptions
        </h3>

        {templates.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 rounded-3xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-neutral-800 text-stone-400 flex items-center justify-center mx-auto">
              <RefreshCw size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-ink-primary dark:text-ink-darkPrimary">
                No recurring expenses
              </h4>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 max-w-sm mx-auto">
                Add subscriptions like Netflix, Spotify, rent, or gym memberships to automatically track recurring charges.
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-ink-primary text-white dark:bg-white dark:text-neutral-900 text-xs font-bold shadow-xs hover:bg-stone-800 dark:hover:bg-stone-100 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Recurring Expense</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {templates.map((tpl) => (
              <motion.div
                key={tpl.id}
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                className={`bg-white dark:bg-neutral-900 border rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                  tpl.isPaused
                    ? 'border-amber-200 dark:border-amber-950/60 bg-amber-50/20 dark:bg-amber-950/10'
                    : 'border-stone-200/80 dark:border-neutral-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <CategoryIcon
                      name={tpl.category?.name || 'Recurring'}
                      color={tpl.category?.color || '#6366F1'}
                      size={18}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-ink-primary dark:text-ink-darkPrimary">
                        {tpl.description}
                      </h4>
                      <span className="text-[11px] text-stone-400 dark:text-stone-500 font-medium">
                        {tpl.category?.name || 'General'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-extrabold text-ink-primary dark:text-ink-darkPrimary tabular-nums block">
                      {formatCurrency(tpl.amount, tpl.currency)}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-400">
                      {tpl.cadence}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-hairline-light dark:border-hairline-dark">
                  <div className="flex items-center space-x-2">
                    {tpl.isPaused ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                        Paused
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                        Active
                      </span>
                    )}

                    <span className="text-[11px] text-stone-400 dark:text-stone-500 flex items-center gap-1 font-medium">
                      <Calendar size={11} />
                      Next: {new Date(tpl.nextDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleTogglePause(tpl.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      title={tpl.isPaused ? 'Resume auto-charge' : 'Pause auto-charge'}
                    >
                      {tpl.isPaused ? <Play size={14} className="text-emerald-600 dark:text-emerald-400" /> : <Pause size={14} />}
                    </button>
                    <button
                      onClick={() => openEditModal(tpl)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Edit template"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Delete template"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <CreateRecurringModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchData}
        categories={categories}
        userCurrency={userCurrency}
        editingTemplate={editingTemplate}
      />
    </div>
  );
};
