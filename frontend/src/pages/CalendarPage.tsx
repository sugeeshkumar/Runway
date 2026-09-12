import React, { useState, useEffect, useCallback } from 'react';
import { CalendarDaySpend, Category, Expense } from '../types';
import { CategoryIcon } from '../components/CategoryIcon';
import { ExpenseEditModal } from '../components/ExpenseEditModal';
import { formatCurrency } from '../utils/currency';
import api from '../api/client';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowUpRight } from 'lucide-react';

interface CalendarPageProps {
  userCurrency?: string;
  refreshKey?: number;
  onExpenseAddedOrUpdated?: () => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  userCurrency = 'INR',
  refreshKey = 0,
  onExpenseAddedOrUpdated,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [daysData, setDaysData] = useState<CalendarDaySpend[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Selected date state (defaults to today's date)
  const [selectedDayNum, setSelectedDayNum] = useState<number>(new Date().getDate());
  const [selectedExpenseForEdit, setSelectedExpenseForEdit] = useState<Expense | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-indexed for backend API

  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      const [calRes, catRes] = await Promise.all([
        api.get<CalendarDaySpend[]>(`/expenses/calendar?year=${year}&month=${month}`),
        api.get<Category[]>('/categories'),
      ]);
      setDaysData(calRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to fetch calendar data', err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData, refreshKey]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1));
    setSelectedDayNum(1);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1));
    setSelectedDayNum(1);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDayNum(today.getDate());
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Calculate Grid cells (Monday-first format)
  // Day 1 of month weekday: 0 = Sun, 1 = Mon, ..., 6 = Sat
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const paddingDaysBefore = (firstDayOfMonth + 6) % 7;

  // Currently selected day data object
  const selectedDayData = daysData.find((d) => {
    const dDate = new Date(d.date);
    return dDate.getDate() === selectedDayNum;
  });

  const selectedDateLabel = new Date(year, month - 1, selectedDayNum).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const monthTotal = daysData.reduce((acc, d) => acc + (d.totalSpent || 0), 0);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Header & Breadcrumbs */}
      <div className="space-y-1">
        <div className="font-mono text-[10px] font-medium uppercase tracking-widest text-ink-secondary dark:text-ink-darkSecondary">
          Runway / Monthly Timeline
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-ink-primary dark:text-ink-darkPrimary tracking-tight">
          Calendar
        </h1>
        <p className="font-sans text-xs text-ink-secondary dark:text-ink-darkSecondary">
          A monthly timeline of expenses and spending activity.
        </p>
      </div>

      {/* Month Navigation & Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-canvas-light dark:bg-canvas-dark border border-hairline-light dark:border-hairline-dark rounded-xl p-3.5">
        <div className="flex items-center space-x-3">
          <CalendarIcon size={16} className="text-ink-secondary dark:text-ink-darkSecondary shrink-0" />
          <h2 className="font-serif text-xl font-normal text-ink-primary dark:text-ink-darkPrimary">
            {monthName}
          </h2>
          <span className="font-mono text-xs text-ink-secondary dark:text-ink-darkSecondary">
            • {formatCurrency(monthTotal, userCurrency)} total
          </span>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg border border-hairline-light dark:border-hairline-dark hover:border-stone-400 bg-transparent font-mono text-xs text-ink-primary dark:text-ink-darkPrimary transition-colors cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-hairline-light dark:border-hairline-dark hover:border-stone-400 text-ink-primary dark:text-ink-darkPrimary transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-hairline-light dark:border-hairline-dark hover:border-stone-400 text-ink-primary dark:text-ink-darkPrimary transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid & Selected Day Section (Asymmetrical 12-col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: 7-COL CALENDAR GRID */}
        <div className="lg:col-span-7 space-y-3">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-xs font-medium uppercase tracking-wider text-ink-secondary dark:text-ink-darkSecondary pb-2 border-b border-hairline-light dark:border-hairline-dark">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          {/* Calendar Grid Cells */}
          {loading ? (
            <div className="py-20 text-center space-y-2 border border-hairline-light dark:border-hairline-dark rounded-xl">
              <div className="w-5 h-5 border-2 border-clay-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-mono text-xs text-ink-secondary dark:text-ink-darkSecondary">
                Reading monthly timeline...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {/* Lead-in Padding Days */}
              {Array.from({ length: paddingDaysBefore }).map((_, idx) => (
                <div
                  key={`pad-${idx}`}
                  className="aspect-square sm:h-20 bg-stone-200/20 dark:bg-neutral-900/20 border border-hairline-light/50 dark:border-hairline-dark/50 rounded-lg opacity-40"
                />
              ))}

              {/* Days of the Month */}
              {daysData.map((dayData, index) => {
                const dayNum = index + 1;
                const hasSpend = dayData.totalSpent > 0;
                const isSelected = selectedDayNum === dayNum;
                const isToday =
                  new Date().getFullYear() === year &&
                  new Date().getMonth() + 1 === month &&
                  new Date().getDate() === dayNum;

                return (
                  <button
                    key={dayData.date}
                    onClick={() => setSelectedDayNum(dayNum)}
                    className={`aspect-square sm:h-20 p-2 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer relative group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-clay-600 ${
                      isSelected
                        ? 'border-2 border-clay-600 dark:border-clay-500 bg-stone-200/40 dark:bg-neutral-800/40'
                        : 'border-hairline-light dark:border-hairline-dark bg-canvas-light dark:bg-canvas-dark hover:bg-stone-200/30 dark:hover:bg-neutral-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`font-mono text-xs font-semibold ${
                          isToday
                            ? 'bg-clay-600 text-white px-1.5 py-0.5 rounded text-[11px] font-bold'
                            : 'text-ink-primary dark:text-ink-darkPrimary'
                        }`}
                      >
                        {dayNum}
                      </span>

                      {dayData.transactionCount > 0 && (
                        <span className="font-mono text-[10px] text-ink-secondary dark:text-ink-darkSecondary">
                          {dayData.transactionCount}
                        </span>
                      )}
                    </div>

                    {hasSpend ? (
                      <div className="mt-auto space-y-1">
                        <div className="font-mono font-bold text-[11px] text-ink-primary dark:text-ink-darkPrimary tabular-nums truncate">
                          {formatCurrency(dayData.totalSpent, userCurrency)}
                        </div>
                        {/* Ultra-thin 2px indicator bar */}
                        <div className="w-full bg-clay-600 dark:bg-clay-500 h-[2px]" />
                      </div>
                    ) : (
                      <div className="mt-auto">
                        <span className="font-mono text-[10px] text-ink-muted dark:text-ink-darkMuted">—</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: 5-COL SELECTED DAY CONTEXT PANEL */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border border-hairline-light dark:border-hairline-dark rounded-xl bg-canvas-light dark:bg-canvas-dark p-4 space-y-4">
            {/* Context Panel Header */}
            <div className="flex items-center justify-between pb-3 border-b border-hairline-light dark:border-hairline-dark">
              <div>
                <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-ink-secondary dark:text-ink-darkSecondary block">
                  Activity Details
                </span>
                <h3 className="font-serif text-lg font-normal text-ink-primary dark:text-ink-darkPrimary">
                  {selectedDateLabel}
                </h3>
              </div>
              <div className="text-right">
                <span className="font-mono text-[10px] text-ink-secondary dark:text-ink-darkSecondary block">Day Total</span>
                <span className="font-mono font-bold text-sm text-ink-primary dark:text-ink-darkPrimary tabular-nums">
                  {formatCurrency(selectedDayData?.totalSpent || 0, userCurrency)}
                </span>
              </div>
            </div>

            {/* Selected Day Itemized Expenses */}
            {!selectedDayData || selectedDayData.expenses.length === 0 ? (
              <div className="py-8 text-center space-y-1.5">
                <p className="font-sans text-xs font-medium text-ink-primary dark:text-ink-darkPrimary">
                  No transactions recorded for this date.
                </p>
                <p className="font-mono text-[11px] text-ink-secondary dark:text-ink-darkSecondary max-w-xs mx-auto">
                  When expenses are logged on this day or when scheduled recurring charges trigger, they will be listed here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-hairline-light dark:divide-hairline-dark space-y-0">
                {selectedDayData.expenses.map((expense) => (
                  <div
                    key={expense.id}
                    onClick={() => setSelectedExpenseForEdit(expense)}
                    className="py-3 px-2 -mx-2 rounded-lg hover:bg-stone-200/40 dark:hover:bg-neutral-800/40 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <CategoryIcon
                        name={expense.category.name}
                        color={expense.category.color}
                        size={14}
                      />
                      <div className="truncate">
                        <div className="font-sans text-xs font-semibold text-ink-primary dark:text-ink-darkPrimary truncate">
                          {expense.description}
                        </div>
                        <div className="font-mono text-[10px] text-ink-secondary dark:text-ink-darkSecondary truncate mt-0.5">
                          <span>[{expense.category.name.toUpperCase()}]</span>
                          {expense.merchant && <span> • at {expense.merchant}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-ink-primary dark:text-ink-darkPrimary tabular-nums">
                        {formatCurrency(expense.amount, expense.currency || userCurrency)}
                      </span>
                      <ArrowUpRight size={12} className="text-clay-600 dark:text-clay-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline-block" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <ExpenseEditModal
        expense={selectedExpenseForEdit}
        categories={categories}
        isOpen={Boolean(selectedExpenseForEdit)}
        onClose={() => setSelectedExpenseForEdit(null)}
        onExpenseUpdated={() => {
          fetchCalendarData();
          if (onExpenseAddedOrUpdated) onExpenseAddedOrUpdated();
        }}
      />
    </div>
  );
};
