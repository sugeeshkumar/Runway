import React, { useState, useEffect, useMemo } from 'react';
import { Expense, Category } from '../types';
import { CategoryIcon } from '../components/CategoryIcon';
import { ExpenseEditModal } from '../components/ExpenseEditModal';
import { formatCurrency } from '../utils/currency';
import api from '../api/client';
import { Search, Filter, ArrowUpRight, RotateCcw } from 'lucide-react';

interface ExpenseHistoryPageProps {
  categories: Category[];
  onExpenseAddedOrUpdated: () => void;
  refreshKey?: number;
}

import * as expenseRepository from '../data/expenseRepository';

export const ExpenseHistoryPage: React.FC<ExpenseHistoryPageProps> = ({
  categories,
  onExpenseAddedOrUpdated,
  refreshKey = 0,
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedExpenseForEdit, setSelectedExpenseForEdit] = useState<Expense | null>(null);

  const fetchExpenses = async () => {
    try {
      const data = await expenseRepository.getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error('Failed to load expenses history from local storage', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [refreshKey]);

  const handleUpdated = () => {
    fetchExpenses();
    onExpenseAddedOrUpdated();
  };

  // Filter expenses based on search and category
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesCategory = selectedCategory === 'ALL' || e.category.id === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        e.description.toLowerCase().includes(q) ||
        (e.merchant && e.merchant.toLowerCase().includes(q)) ||
        e.category.name.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [expenses, searchQuery, selectedCategory]);

  // Group filtered expenses by Date string (e.g. "Today", "Yesterday", "Sep 10, 2026")
  const groupedExpenses = useMemo(() => {
    const groups: { dateLabel: string; items: Expense[] }[] = [];
    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    filteredExpenses.forEach((exp) => {
      const expDate = new Date(exp.occurredAt);
      let dateLabel = expDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      if (expDate.toDateString() === todayStr) {
        dateLabel = 'Today';
      } else if (expDate.toDateString() === yesterdayStr) {
        dateLabel = 'Yesterday';
      }

      let existingGroup = groups.find((g) => g.dateLabel === dateLabel);
      if (!existingGroup) {
        existingGroup = { dateLabel, items: [] };
        groups.push(existingGroup);
      }
      existingGroup.items.push(exp);
    });

    return groups;
  }, [filteredExpenses]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Header & Breadcrumb */}
      <div className="space-y-1">
        <div className="font-mono text-[10px] font-medium uppercase tracking-widest text-ink-secondary dark:text-ink-darkSecondary">
          Runway / Transaction History
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-ink-primary dark:text-ink-darkPrimary tracking-tight">
          History
        </h1>
        <p className="font-sans text-xs text-ink-secondary dark:text-ink-darkSecondary">
          A chronological ledger of all expenses, recurring charges, and captured transactions.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-canvas-light dark:bg-canvas-dark border border-hairline-light dark:border-hairline-dark rounded-xl p-3.5">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-2.5 text-ink-secondary dark:text-ink-darkSecondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search description, merchant, or category..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-hairline-light dark:border-hairline-dark bg-transparent text-xs font-sans text-ink-primary dark:text-ink-darkPrimary placeholder:text-ink-secondary dark:placeholder:text-ink-darkSecondary focus:outline-none focus:border-clay-600 dark:focus:border-clay-500 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end space-x-3 w-full sm:w-auto">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter size={13} className="text-ink-secondary dark:text-ink-darkSecondary hidden sm:block shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-48 px-3 py-1.5 rounded-lg border border-hairline-light dark:border-hairline-dark bg-transparent text-xs font-sans text-ink-primary dark:text-ink-darkPrimary focus:outline-none focus:border-clay-600 dark:focus:border-clay-500 cursor-pointer transition-colors"
            >
              <option value="ALL" className="bg-canvas-light dark:bg-canvas-dark">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-canvas-light dark:bg-canvas-dark">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <span className="font-mono text-[11px] text-ink-secondary dark:text-ink-darkSecondary shrink-0 hidden md:inline-block">
            {filteredExpenses.length} entries
          </span>
        </div>
      </div>

      {/* History Items Area */}
      {loading ? (
        <div className="py-16 text-center space-y-2">
          <div className="w-5 h-5 border-2 border-clay-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-mono text-xs text-ink-secondary dark:text-ink-darkSecondary">
            Reading transaction ledger...
          </p>
        </div>
      ) : groupedExpenses.length === 0 ? (
        <div className="border border-hairline-light dark:border-hairline-dark rounded-xl p-8 bg-canvas-light dark:bg-canvas-dark space-y-3 text-center">
          <p className="font-sans text-sm font-medium text-ink-primary dark:text-ink-darkPrimary">
            {expenses.length === 0 ? 'No transactions logged yet' : 'No matching transactions found'}
          </p>
          <p className="font-sans text-xs text-ink-secondary dark:text-ink-darkSecondary max-w-md mx-auto">
            {expenses.length === 0
              ? 'When you capture expenses on your Dashboard or when scheduled recurring charges generate, they will be listed chronologically here.'
              : 'No transaction match your current keyword or category search filter.'}
          </p>
          {(searchQuery || selectedCategory !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="px-3.5 py-1.5 rounded-lg border border-hairline-light dark:border-hairline-dark hover:border-stone-400 font-mono text-xs text-ink-primary dark:text-ink-darkPrimary transition-colors inline-flex items-center gap-1.5 cursor-pointer mt-2"
            >
              <RotateCcw size={13} />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedExpenses.map((group) => (
            <div key={group.dateLabel} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-mono text-xs font-medium uppercase tracking-wider text-ink-secondary dark:text-ink-darkSecondary">
                  {group.dateLabel}
                </h3>
                <span className="font-mono text-xs text-ink-secondary dark:text-ink-darkSecondary">
                  {group.items.length} {group.items.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              <div className="bg-canvas-light dark:bg-canvas-dark border border-hairline-light dark:border-hairline-dark rounded-xl divide-y divide-hairline-light dark:divide-hairline-dark overflow-hidden">
                {group.items.map((expense) => (
                  <div
                    key={expense.id}
                    tabIndex={0}
                    onClick={() => setSelectedExpenseForEdit(expense)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedExpenseForEdit(expense);
                      }
                    }}
                    className="flex items-center justify-between p-3.5 hover:bg-stone-200/40 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-clay-600"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <CategoryIcon
                        name={expense.category.name}
                        color={expense.category.color}
                        size={15}
                      />
                      <div className="truncate">
                        <div className="flex items-center space-x-2 truncate">
                          <span className="font-sans text-sm font-semibold text-ink-primary dark:text-ink-darkPrimary truncate">
                            {expense.description}
                          </span>
                          {expense.merchant && (
                            <span className="font-sans text-xs text-ink-secondary dark:text-ink-darkSecondary truncate">
                              at {expense.merchant}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5 font-mono text-xs text-ink-secondary dark:text-ink-darkSecondary truncate">
                          <span>[{expense.category.name.toUpperCase()}]</span>
                          <span>•</span>
                          {expense.source && (
                            <>
                              <span>[{expense.source.replace('_', ' ')}]</span>
                              <span>•</span>
                            </>
                          )}
                          <span>
                            {new Date(expense.occurredAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center space-x-3">
                      <div>
                        {/* Stored Currency Amount */}
                        <div className="font-mono font-bold text-sm text-ink-primary dark:text-ink-darkPrimary tabular-nums">
                          {formatCurrency(expense.amount, expense.currency)}
                        </div>
                      </div>
                      <span className="font-mono text-xs text-clay-600 dark:text-clay-400 group-hover:opacity-100 opacity-0 transition-opacity hidden sm:inline-flex items-center gap-0.5">
                        <span>Edit</span>
                        <ArrowUpRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <ExpenseEditModal
        expense={selectedExpenseForEdit}
        categories={categories}
        isOpen={Boolean(selectedExpenseForEdit)}
        onClose={() => setSelectedExpenseForEdit(null)}
        onExpenseUpdated={handleUpdated}
      />
    </div>
  );
};
