import React from 'react';
import { Budget } from '../types';

interface BudgetStatusProps {
  budgets: Budget[];
}

export const BudgetStatus: React.FC<BudgetStatusProps> = ({ budgets }) => {
  if (!budgets || budgets.length === 0) {
    return null;
  }

  // Find overall budget or default to first budget item
  const overallBudget = budgets.find((b) => !b.category) || budgets[0];

  const getStatusStyle = (status: 'SAFE' | 'APPROACHING' | 'OVER') => {
    switch (status) {
      case 'SAFE':
        return {
          badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
          barClass: 'bg-emerald-500',
          label: 'On Track',
        };
      case 'APPROACHING':
        return {
          badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900',
          barClass: 'bg-amber-500',
          label: 'Approaching Limit',
        };
      case 'OVER':
        return {
          badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900',
          barClass: 'bg-rose-500',
          label: 'Exceeded Budget',
        };
    }
  };

  const style = getStatusStyle(overallBudget.status);

  const percentage = Math.min(
    100,
    Math.round((overallBudget.spentAmount / overallBudget.amount) * 100) || 0
  );

  return (
    <div className="w-full max-w-xl mx-auto mb-10">
      <div className="bg-white dark:bg-neutral-900 border border-hairline-light dark:border-hairline-dark rounded-2xl p-6 transition-all">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-wider font-semibold text-stone-400 dark:text-stone-500">
            {overallBudget.periodMonth} Monthly Budget
          </span>
          <span
            className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${style.badgeClass}`}
          >
            {style.label}
          </span>
        </div>

        {/* Large Monetary Amount Statement */}
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-ink-primary dark:text-ink-darkPrimary tabular-nums">
              ${overallBudget.spentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-sm text-stone-400 dark:text-stone-500 ml-2">
              spent of ${overallBudget.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <span className="text-sm font-medium text-stone-500 dark:text-stone-400 tabular-nums">
            {percentage}%
          </span>
        </div>

        {/* Subtle hairline progress indicator bar */}
        <div className="w-full bg-stone-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${style.barClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
