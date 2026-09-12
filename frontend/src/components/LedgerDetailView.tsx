import React, { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SharedLedger, SharedExpense } from '../types';
import { ArrowLeft, Plus, Scale, Trash2, Calendar, Users, CheckCircle2, DollarSign, UserCheck } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { LogSharedExpenseModal } from './LogSharedExpenseModal';
import { LedgerBalancesModal } from './LedgerBalancesModal';
import api from '../api/client';

interface LedgerDetailViewProps {
  ledger: SharedLedger;
  onBack: () => void;
  onLedgerUpdated: () => void;
}

export const LedgerDetailView: React.FC<LedgerDetailViewProps> = ({
  ledger: initialLedger,
  onBack,
  onLedgerUpdated,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [ledger, setLedger] = useState<SharedLedger>(initialLedger);
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState<boolean>(false);
  const [isBalancesOpen, setIsBalancesOpen] = useState<boolean>(false);

  const fetchLedgerData = useCallback(async () => {
    setLoading(true);
    try {
      const [ledgerRes, expensesRes] = await Promise.all([
        api.get<SharedLedger>(`/ledgers/${initialLedger.id}`),
        api.get<SharedExpense[]>(`/ledgers/${initialLedger.id}/expenses`),
      ]);
      setLedger(ledgerRes.data);
      setExpenses(expensesRes.data);
    } catch (err) {
      console.error('Failed to load ledger details', err);
    } finally {
      setLoading(false);
    }
  }, [initialLedger.id]);

  useEffect(() => {
    fetchLedgerData();
  }, [fetchLedgerData]);

  const handleDeleteExpense = async (expenseId: string) => {
    if (!window.confirm('Delete this shared expense?')) return;
    try {
      await api.delete(`/ledgers/${ledger.id}/expenses/${expenseId}`);
      fetchLedgerData();
    } catch (err) {
      console.error('Failed to delete expense', err);
    }
  };

  const plannedBudget = ledger.plannedBudget || 0;
  const totalSpent = ledger.totalSpentInBase || 0;
  const memberCount = ledger.participants.length || 1;
  const perPersonBudget = plannedBudget > 0 ? plannedBudget / memberCount : 0;
  const avgSpentPerPerson = memberCount > 0 ? totalSpent / memberCount : 0;
  const budgetPercentage = plannedBudget > 0 ? Math.min(100, Math.round((totalSpent / plannedBudget) * 100)) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Navigation Top */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-stone-500 hover:text-ink-primary dark:text-stone-400 dark:hover:text-ink-darkPrimary transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Trips & Events</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsBalancesOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Scale size={15} className="text-lime-500" />
            <span>Settle Up / Balances</span>
          </button>

          {!ledger.isSettled && (
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-ink-primary text-white dark:bg-white dark:text-neutral-900 text-xs font-bold transition-all shadow-sm hover:opacity-90 cursor-pointer"
            >
              <Plus size={15} />
              <span>Log Shared Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Card */}
      <motion.div
        whileHover={shouldReduceMotion ? {} : { y: -2 }}
        className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-neutral-900 via-slate-900 to-emerald-950/40 text-white border border-emerald-500/30 shadow-xl relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-lime-400/20 text-lime-400">
                {ledger.type}
              </span>
              {ledger.isSettled && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 size={12} />
                  <span>Settled</span>
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {ledger.name}
            </h2>

            <div className="flex items-center space-x-3 text-xs text-stone-300 mt-2 font-medium">
              <div className="flex items-center space-x-1">
                <Calendar size={13} className="text-stone-400" />
                <span>{ledger.startDate} {ledger.endDate ? `to ${ledger.endDate}` : ''}</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Users size={13} className="text-stone-400" />
                <span>{memberCount} Participants</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs uppercase tracking-wider font-semibold text-stone-400">Total Group Spent</span>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mt-0.5">
              {formatCurrency(totalSpent, ledger.baseCurrency)}
            </div>
            {perPersonBudget > 0 && (
              <div className="text-xs text-lime-400 font-medium mt-1">
                Per-Person Budget: {formatCurrency(perPersonBudget, ledger.baseCurrency)}
              </div>
            )}
          </div>
        </div>

        {plannedBudget > 0 && (
          <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-300">
                Individual Share: {formatCurrency(avgSpentPerPerson, ledger.baseCurrency)} of {formatCurrency(perPersonBudget, ledger.baseCurrency)} limit
              </span>
              <span className="font-mono font-bold text-lime-400">{budgetPercentage}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  budgetPercentage > 100 ? 'bg-rose-500' : 'bg-lime-400'
                }`}
                style={{ width: `${Math.min(100, budgetPercentage)}%` }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Participants Quick List */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-hairline-light dark:border-hairline-dark p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">
          Group Members ({ledger.participants.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {ledger.participants.map((p) => (
            <div
              key={p.id}
              className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-neutral-850 border border-hairline-light dark:border-hairline-dark text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center space-x-1.5"
            >
              <div className="w-2 h-2 rounded-full bg-lime-400" />
              <span>{p.displayName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expense History Feed */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-hairline-light dark:border-hairline-dark p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-ink-primary dark:text-ink-darkPrimary">
            Shared Expenses ({expenses.length})
          </h3>
        </div>

        {loading ? (
          <div className="py-8 text-center text-stone-400">
            <div className="w-6 h-6 border-2 border-stone-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs">Loading expenses...</span>
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-12 text-center text-stone-400 space-y-2">
            <p className="text-sm">No expenses logged yet in this ledger.</p>
            {!ledger.isSettled && (
              <button
                onClick={() => setIsAddExpenseOpen(true)}
                className="inline-flex items-center space-x-1 text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline cursor-pointer"
              >
                <Plus size={14} />
                <span>Log the first shared expense</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="p-4 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 flex items-center justify-between hover:border-stone-400 dark:hover:border-neutral-700 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-lime-400/20 text-lime-700 dark:text-lime-400 flex items-center justify-center font-bold text-sm shrink-0">
                    {exp.paidByParticipantName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink-primary dark:text-ink-darkPrimary">
                      {exp.description}
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      Paid by <span className="font-semibold text-stone-700 dark:text-stone-300">{exp.paidByParticipantName}</span> • Split {exp.splitType.toLowerCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-black font-mono text-ink-primary dark:text-ink-darkPrimary">
                      {formatCurrency(exp.baseCurrencyAmount, ledger.baseCurrency)}
                    </div>
                    {exp.currency !== ledger.baseCurrency && (
                      <div className="text-[10px] text-stone-400 font-mono">
                        ({formatCurrency(exp.amount, exp.currency)} @ {exp.exchangeRate})
                      </div>
                    )}
                  </div>

                  {!ledger.isSettled && (
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors"
                      title="Delete expense"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <LogSharedExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        ledger={ledger}
        onExpenseAdded={() => {
          fetchLedgerData();
          onLedgerUpdated();
        }}
      />

      <LedgerBalancesModal
        isOpen={isBalancesOpen}
        onClose={() => setIsBalancesOpen(false)}
        ledger={ledger}
        onLedgerSettled={() => {
          fetchLedgerData();
          onLedgerUpdated();
        }}
      />
    </div>
  );
};
