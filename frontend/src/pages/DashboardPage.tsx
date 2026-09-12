import React, { useState, useEffect, useCallback } from 'react';
import { DashboardSummary, Category } from '../types';
import { QuickCapture } from '../components/QuickCapture';
import { CategoryIcon } from '../components/CategoryIcon';
import { formatCurrency } from '../utils/currency';
import api from '../api/client';
import { ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

interface DashboardPageProps {
  onNavigateToHistory: () => void;
  onNavigateToBudgets: () => void;
  onNavigateToRecurring?: () => void;
  refreshKey?: number;
  onExpenseAddedOrUpdated?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToHistory,
  onNavigateToBudgets,
  onNavigateToRecurring,
  refreshKey = 0,
  onExpenseAddedOrUpdated,
}) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, catRes] = await Promise.all([
        api.get<DashboardSummary>('/dashboard/summary'),
        api.get<Category[]>('/categories'),
      ]);
      setSummary(sumRes.data);
      setCategories(catRes.data);
    } catch (err: any) {
      console.error('Failed to load dashboard summary', err);
      setError(err.response?.data?.message || 'Unable to load financial summary. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshKey]);

  // Loading State
  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center space-y-3">
        <div className="w-5 h-5 border-2 border-clay-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-mono text-xs text-ink-secondary dark:text-ink-darkSecondary">
          Reading financial ledger...
        </p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="border border-hairline-light dark:border-hairline-dark rounded-xl p-6 bg-canvas-light dark:bg-canvas-dark space-y-3">
          <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-mono text-xs">
            <AlertCircle size={15} />
            <span>Connection Error</span>
          </div>
          <p className="font-sans text-xs text-ink-secondary dark:text-ink-darkSecondary">
            {error}
          </p>
          <button
            onClick={fetchDashboardData}
            className="px-3.5 py-1.5 rounded-lg bg-clay-600 hover:bg-clay-700 text-white font-sans text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13} />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const userCurrency = summary.userDefaultCurrency || 'INR';
  const progressPercentage = summary.overallBudget > 0
    ? Math.min(100, (summary.totalSpent / summary.overallBudget) * 100)
    : 0;

  const isDeltaNegative = summary.monthOverMonthDeltaPercentage < 0;
  const isOverBudget = summary.budgetStatus === 'OVER' || summary.remainingBudget < 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-10">
      {/* Primary Action: Restrained Quick Capture Bar */}
      <QuickCapture
        categories={categories}
        onExpenseAdded={() => {
          fetchDashboardData();
          if (onExpenseAddedOrUpdated) onExpenseAddedOrUpdated();
        }}
      />

      {/* HERO SECTION: Remaining Budget */}
      <div className="border-b border-hairline-light dark:border-hairline-dark pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-medium uppercase tracking-widest text-ink-secondary dark:text-ink-darkSecondary">
                Remaining Monthly Budget
              </span>
              <span className="font-mono text-[11px] text-ink-secondary dark:text-ink-darkSecondary">
                [{summary.budgetStatus.replace('_', ' ')} • {progressPercentage.toFixed(0)}% USED]
              </span>
            </div>

            {/* Signature Fraunces Serif Hero Amount */}
            <h1 className="font-serif text-5xl sm:text-7xl font-normal tracking-tight text-ink-primary dark:text-ink-darkPrimary tabular-nums leading-none pt-1">
              {formatCurrency(summary.remainingBudget, userCurrency)}
            </h1>
          </div>

          {/* Hero Metadata Summary */}
          <div className="space-y-3 shrink-0">
            <div className="flex items-center space-x-5 font-mono text-xs text-ink-secondary dark:text-ink-darkSecondary">
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-ink-muted dark:text-ink-darkMuted">Spent</span>
                <span className="font-bold text-ink-primary dark:text-ink-darkPrimary tabular-nums">
                  {formatCurrency(summary.totalSpent, userCurrency)}
                </span>
              </div>
              <div className="h-5 w-px bg-hairline-light dark:bg-hairline-dark" />
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-ink-muted dark:text-ink-darkMuted">Limit</span>
                <span className="font-bold text-ink-primary dark:text-ink-darkPrimary tabular-nums">
                  {formatCurrency(summary.overallBudget, userCurrency)}
                </span>
              </div>
              <div className="h-5 w-px bg-hairline-light dark:bg-hairline-dark" />
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-ink-muted dark:text-ink-darkMuted">Pace</span>
                <span className="font-bold text-ink-primary dark:text-ink-darkPrimary tabular-nums">
                  {isDeltaNegative ? '-' : '+'}{Math.abs(summary.monthOverMonthDeltaPercentage)}%
                </span>
              </div>
            </div>

            {/* Thin 2px Progress Rule */}
            <div className="w-full bg-stone-200 dark:bg-stone-800 h-[2px] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isOverBudget ? 'bg-rose-600' : 'bg-clay-600 dark:bg-clay-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ASYMMETRICAL EDITORIAL GRID: Top Categories & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Top Categories (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-hairline-light dark:border-hairline-dark pb-2">
            <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-ink-primary dark:text-ink-darkPrimary">
              Category Breakdown
            </h2>
            <button
              onClick={onNavigateToHistory}
              className="font-mono text-xs text-ink-secondary dark:text-ink-darkSecondary hover:text-clay-600 dark:hover:text-clay-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>View transactions</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {summary.topCategories.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-hairline-light dark:border-hairline-dark rounded-lg p-6">
              <p className="font-sans text-xs text-ink-secondary dark:text-ink-darkSecondary">
                No expenses logged for this period yet.
              </p>
              <p className="font-mono text-[11px] text-ink-muted dark:text-ink-darkMuted mt-1">
                Type an expense above (e.g. "₹450 lunch") to log your first transaction.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-hairline-light dark:divide-hairline-dark">
              {summary.topCategories.map((cat) => (
                <div
                  key={cat.categoryId}
                  className="py-3 px-2 -mx-2 rounded-lg hover:bg-stone-200/30 dark:hover:bg-neutral-800/30 transition-colors flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <CategoryIcon
                      name={cat.categoryName}
                      color={cat.color}
                      size={14}
                    />
                    <div className="truncate">
                      <div className="font-sans text-xs font-semibold text-ink-primary dark:text-ink-darkPrimary truncate">
                        {cat.categoryName}
                      </div>
                      {/* Ultra-thin 2px category bar */}
                      <div className="w-28 bg-stone-200 dark:bg-stone-800 h-[2px] overflow-hidden mt-1.5">
                        <div
                          className="h-full"
                          style={{
                            width: `${Math.min(100, cat.percentage)}%`,
                            backgroundColor: cat.color || '#C85A32',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-bold text-ink-primary dark:text-ink-darkPrimary tabular-nums">
                      {formatCurrency(cat.spentAmount, userCurrency)}
                    </div>
                    <div className="font-mono text-[10px] text-ink-secondary dark:text-ink-darkSecondary">
                      {cat.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: MoM Velocity & Upcoming Committed (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          {/* MoM Velocity Section (Unified on canvas, no box wrapper) */}
          <div className="border-b border-hairline-light dark:border-hairline-dark pb-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-ink-secondary dark:text-ink-darkSecondary">
                Monthly Pace
              </span>
              <span className="font-mono text-xs font-bold text-ink-primary dark:text-ink-darkPrimary tabular-nums">
                {isDeltaNegative ? '-' : '+'}{Math.abs(summary.monthOverMonthDeltaPercentage)}%
              </span>
            </div>

            <div className="font-serif text-2xl font-normal text-ink-primary dark:text-ink-darkPrimary tabular-nums">
              {formatCurrency(summary.totalSpent, userCurrency)}
            </div>

            <p className="font-sans text-xs text-ink-secondary dark:text-ink-darkSecondary">
              {isDeltaNegative
                ? `Spending pace is ${Math.abs(summary.monthOverMonthDeltaPercentage)}% lower than last month's ${formatCurrency(summary.previousMonthSpent, userCurrency)}.`
                : `Spending pace is ${summary.monthOverMonthDeltaPercentage}% higher than last month's ${formatCurrency(summary.previousMonthSpent, userCurrency)}.`}
            </p>
          </div>

          {/* Upcoming Committed Charges */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-hairline-light dark:border-hairline-dark pb-2">
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-ink-primary dark:text-ink-darkPrimary">
                Committed Expenses
              </span>
              {onNavigateToRecurring && (
                <button
                  onClick={onNavigateToRecurring}
                  className="font-mono text-xs text-ink-secondary dark:text-ink-darkSecondary hover:text-clay-600 dark:hover:text-clay-400 transition-colors cursor-pointer"
                >
                  Manage
                </button>
              )}
            </div>

            {summary.upcomingRecurring.length === 0 ? (
              <p className="font-mono text-xs text-ink-secondary dark:text-ink-darkSecondary py-2">
                No upcoming recurring charges due.
              </p>
            ) : (
              <div className="divide-y divide-hairline-light dark:divide-hairline-dark">
                {summary.upcomingRecurring.slice(0, 3).map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-sans font-medium text-ink-primary dark:text-ink-darkPrimary block">
                        {item.description}
                      </span>
                      <span className="font-mono text-[10px] text-ink-secondary dark:text-ink-darkSecondary">
                        Due {item.nextDueDate} · {item.cadence}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-ink-primary dark:text-ink-darkPrimary tabular-nums">
                      {formatCurrency(item.amount, item.currency || userCurrency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
