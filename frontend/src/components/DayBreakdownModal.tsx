import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarDaySpend } from '../types';
import { formatCurrency } from '../utils/currency';
import { CategoryIcon } from './CategoryIcon';
import { X, Calendar as CalendarIcon, Tag, CreditCard } from 'lucide-react';

interface DayBreakdownModalProps {
  dayData: CalendarDaySpend | null;
  currency?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DayBreakdownModal: React.FC<DayBreakdownModalProps> = ({
  dayData,
  currency = 'USD',
  isOpen,
  onClose,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (!isOpen || !dayData) return null;

  // Format date e.g. "Saturday, September 12, 2026"
  const formattedDate = new Date(`${dayData.date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const modalVariants = shouldReduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0, scale: 0.95, y: 15 }, visible: { opacity: 1, scale: 1, y: 0 } };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalVariants}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100 text-base">{formattedDate}</h2>
              <p className="text-xs text-slate-400">{dayData.transactionCount} transaction{dayData.transactionCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Day Total Card */}
          <div className="p-4 bg-gradient-to-br from-slate-800/80 to-slate-850/80 border border-slate-750 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Spent</span>
              <div className="text-2xl font-extrabold text-lime-400 mt-0.5">
                {formatCurrency(dayData.totalSpent, currency)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Spend Intensity</span>
              <span className="inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                {Math.round(dayData.intensityPercentage)}% of peak day
              </span>
            </div>
          </div>

          {dayData.transactionCount === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/60 flex items-center justify-center text-slate-500 mb-3">
                <CreditCard className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-300">No expenses recorded</p>
              <p className="text-xs text-slate-500 mt-1">You didn't record any transactions on this date.</p>
            </div>
          ) : (
            <>
              {/* Category Splits */}
              {dayData.categorySplits && dayData.categorySplits.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Category Breakdown</h3>
                  <div className="space-y-2.5">
                    {dayData.categorySplits.map((cat) => (
                      <div key={cat.categoryId || cat.categoryName} className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: cat.color || '#a3e635' }}
                            />
                            <span className="font-medium text-slate-200">{cat.categoryName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100">{formatCurrency(cat.spentAmount, currency)}</span>
                            <span className="text-slate-400 font-mono text-[11px]">({cat.percentage.toFixed(0)}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, Math.max(2, cat.percentage))}%`,
                              backgroundColor: cat.color || '#a3e635',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expense List */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Transactions</h3>
                <div className="space-y-2">
                  {dayData.expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-750/80 rounded-xl transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: `${exp.category?.color || '#a3e635'}20`,
                            color: exp.category?.color || '#a3e635',
                          }}
                        >
                          <CategoryIcon name={exp.category?.name || 'Other'} size={16} />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-slate-100">
                            {exp.merchant || exp.description || exp.category?.name || 'Expense'}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {exp.category?.name || 'Uncategorized'}
                            </span>
                            {exp.source === 'RECURRING' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                                Recurring
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm text-slate-100">
                          {formatCurrency(exp.amount, exp.currency || currency)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
