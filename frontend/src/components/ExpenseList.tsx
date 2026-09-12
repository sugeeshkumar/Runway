import React from 'react';
import { Expense } from '../types';
import { Trash2 } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDeleteExpense }) => {
  if (expenses.length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto text-center py-12 border border-dashed border-hairline-light dark:border-hairline-dark rounded-2xl">
        <p className="text-sm text-stone-400 dark:text-stone-500 font-normal">
          No expenses recorded yet. Type an expense above to get started.
        </p>
      </div>
    );
  }

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'INR': return '₹';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return '$';
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xs uppercase tracking-wider font-semibold text-stone-400 dark:text-stone-500">
          Recent Activity
        </h2>
        <span className="text-xs text-stone-400 dark:text-stone-500">
          {expenses.length} {expenses.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <div className="space-y-3">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="group flex items-center justify-between bg-white dark:bg-neutral-900 border border-hairline-light dark:border-hairline-dark rounded-2xl p-4 transition-all hover:border-stone-300 dark:hover:border-neutral-700"
          >
            <div className="flex items-center space-x-3.5">
              {/* Desaturated Category Pill Indicator */}
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: expense.category.color || '#64748B' }}
              />

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink-primary dark:text-ink-darkPrimary">
                    {expense.description}
                  </span>
                  {expense.merchant && (
                    <span className="text-xs text-stone-400 dark:text-stone-500 font-normal">
                      at {expense.merchant}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="text-xs text-stone-400 dark:text-stone-500">
                    {expense.category.name}
                  </span>
                  <span className="text-stone-300 dark:text-neutral-700">•</span>
                  <span className="text-xs text-stone-400 dark:text-stone-500">
                    {new Date(expense.occurredAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-base font-semibold tracking-tight text-ink-primary dark:text-ink-darkPrimary tabular-nums">
                {getCurrencySymbol(expense.currency)}{expense.amount.toFixed(2)}
              </span>

              <button
                onClick={() => onDeleteExpense(expense.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-all"
                title="Delete expense"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
