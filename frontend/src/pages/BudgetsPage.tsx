import React, { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Budget, Category } from '../types';
import { ProgressRing } from '../components/ProgressRing';
import { CategoryIcon } from '../components/CategoryIcon';
import { BudgetModal } from '../components/BudgetModal';
import { formatCurrency } from '../utils/currency';
import * as budgetRepository from '../data/budgetRepository';
import { Plus, Edit2, Trash2, Tag, ArrowRight, Sparkles } from 'lucide-react';

interface BudgetsPageProps {
  categories: Category[];
  userCurrency: string;
  onNavigateToCategories: () => void;
  refreshKey?: number;
}

export const BudgetsPage: React.FC<BudgetsPageProps> = ({
  categories,
  userCurrency,
  onNavigateToCategories,
  refreshKey = 0,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalInitialBudgetId, setModalInitialBudgetId] = useState<string | null>(null);
  const [modalInitialCat, setModalInitialCat] = useState<string | null>(null);
  const [modalInitialAmt, setModalInitialAmt] = useState<number>(2000);

  const periodMonth = new Date().toISOString().slice(0, 7);

  const fetchBudgets = useCallback(async () => {
    try {
      const data = await budgetRepository.getBudgets(periodMonth);
      setBudgets(data);
    } catch (err) {
      console.error('Failed to load budgets', err);
    } finally {
      setLoading(false);
    }
  }, [periodMonth]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets, refreshKey]);

  const overallBudget = budgets.find((b) => !b.category) || null;
  const categoryBudgets = budgets.filter((b) => b.category != null);

  const openSetBudgetModal = (
    budgetId: string | null = null,
    categoryId: string | null = null,
    currentAmount: number = 2000
  ) => {
    setModalInitialBudgetId(budgetId);
    setModalInitialCat(categoryId);
    setModalInitialAmt(currentAmount);
    setIsModalOpen(true);
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!window.confirm('Are you sure you want to remove this budget limit?')) return;
    try {
      await budgetRepository.deleteBudget(budgetId);
      fetchBudgets();
    } catch (err) {
      console.error('Failed to delete budget limit', err);
    }
  };

  const getStatusBadge = (status: 'SAFE' | 'APPROACHING' | 'OVER') => {
    switch (status) {
      case 'SAFE':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">Safe</span>;
      case 'APPROACHING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">Approaching</span>;
      case 'OVER':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">Exceeded</span>;
    }
  };

  const getProgressBarColor = (status: 'SAFE' | 'APPROACHING' | 'OVER') => {
    switch (status) {
      case 'SAFE': return 'bg-gradient-to-r from-emerald-500 to-teal-400';
      case 'APPROACHING': return 'bg-gradient-to-r from-amber-500 to-orange-400';
      case 'OVER': return 'bg-gradient-to-r from-rose-500 to-pink-500';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-black tracking-tight text-ink-primary dark:text-ink-darkPrimary">
              Monthly Budgets
            </h2>
            <Sparkles size={18} className="text-emerald-500" />
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
            Spendio budget control & target allocations for {periodMonth}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onNavigateToCategories}
            className="px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-stone-600 dark:text-stone-300 text-xs font-bold hover:border-emerald-500/40 transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Tag size={14} className="text-emerald-500" />
            <span>Manage Categories</span>
            <ArrowRight size={13} />
          </button>

          <motion.button
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
            onClick={() => openSetBudgetModal(null, null, 2000)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white dark:text-neutral-900 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
          >
            <Plus size={16} />
            <span>Set New Budget</span>
          </motion.button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-stone-400 dark:text-stone-500 font-medium">Loading budget targets...</p>
        </div>
      ) : (
        <>
          {/* Overall Monthly Budget Hero Card */}
          {overallBudget && (
            <motion.div
              whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="bg-gradient-to-br from-neutral-900 via-slate-900 to-emerald-950/40 dark:from-neutral-950 dark:via-neutral-900 dark:to-emerald-950/60 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.12)] text-white flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden"
            >
              <div className="space-y-3 text-center sm:text-left z-10">
                <div className="flex items-center justify-center sm:justify-start space-x-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400/90">
                    Overall Monthly Budget
                  </span>
                  {getStatusBadge(overallBudget.status)}
                </div>

                <h3 className="text-4xl sm:text-5xl font-black tracking-tight text-white tabular-nums">
                  {formatCurrency(overallBudget.remainingAmount, userCurrency)}
                </h3>
                <p className="text-xs text-stone-300">
                  remaining of <strong className="text-white">{formatCurrency(overallBudget.amount, userCurrency)}</strong> total allocation
                </p>

                <div className="pt-2 flex items-center justify-center sm:justify-start space-x-4">
                  <button
                    onClick={() => openSetBudgetModal(overallBudget.id, null, overallBudget.amount)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors flex items-center space-x-1.5 cursor-pointer backdrop-blur-xs"
                  >
                    <Edit2 size={13} />
                    <span>Edit Limit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteBudget(overallBudget.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-xs font-bold text-rose-300 transition-colors flex items-center space-x-1.5 cursor-pointer backdrop-blur-xs"
                  >
                    <Trash2 size={13} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              <div className="z-10 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
                <ProgressRing
                  progress={(overallBudget.spentAmount / overallBudget.amount) * 100 || 0}
                  status={overallBudget.status}
                  radius={56}
                  strokeWidth={8}
                />
              </div>
            </motion.div>
          )}

          {/* Category Budgets Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Category Spending Limits ({categoryBudgets.length})
              </h3>
            </div>

            {categoryBudgets.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-neutral-900 border border-dashed border-hairline-light dark:border-hairline-dark rounded-3xl">
                <p className="text-xs text-stone-400 dark:text-stone-500 font-medium">
                  No category limits set yet. Click "Set New Budget" to assign monthly limits per category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categoryBudgets.map((b) => {
                  const pct = Math.min(100, Math.round((b.spentAmount / b.amount) * 100) || 0);
                  const catColor = b.category?.color || '#84CC16';

                  return (
                    <motion.div
                      key={b.id}
                      whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.015 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="bg-white dark:bg-neutral-900 border rounded-3xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.2)] hover:shadow-lg transition-all space-y-3.5 relative group"
                      style={{ borderColor: `${catColor}35` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CategoryIcon
                            name={b.category?.name || 'Category'}
                            color={catColor}
                            size={16}
                          />
                          <div>
                            <p className="text-sm font-bold text-ink-primary dark:text-ink-darkPrimary">
                              {b.category?.name}
                            </p>
                            <p className="text-[11px] text-stone-400 dark:text-stone-500 font-medium">
                              {formatCurrency(b.remainingAmount, userCurrency)} remaining
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {getStatusBadge(b.status)}

                          {/* EDIT & DELETE ACTION BUTTONS */}
                          <div className="flex items-center space-x-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openSetBudgetModal(b.id, b.category?.id || null, b.amount)}
                              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors"
                              title="Edit budget limit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteBudget(b.id)}
                              className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Delete budget limit"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Thicker, glowing progress bar */}
                      <div className="w-full bg-stone-100 dark:bg-neutral-850 rounded-full h-2.5 overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(b.status)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 pt-1 font-medium">
                        <span className="tabular-nums font-semibold">
                          {formatCurrency(b.spentAmount, userCurrency)} spent
                        </span>
                        <span className="font-bold tabular-nums text-ink-primary dark:text-ink-darkPrimary">
                          Target {formatCurrency(b.amount, userCurrency)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Budget Modal */}
      <BudgetModal
        categories={categories}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBudgetUpdated={fetchBudgets}
        initialBudgetId={modalInitialBudgetId}
        initialCategoryId={modalInitialCat}
        initialAmount={modalInitialAmt}
      />
    </div>
  );
};
