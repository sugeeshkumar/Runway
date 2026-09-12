import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SharedLedger, LedgerBalances } from '../types';
import { X, ArrowRight, CheckCircle2, ShieldCheck, Scale, Check } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import api from '../api/client';

interface LedgerBalancesModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledger: SharedLedger;
  onLedgerSettled: () => void;
}

export const LedgerBalancesModal: React.FC<LedgerBalancesModalProps> = ({
  isOpen,
  onClose,
  ledger,
  onLedgerSettled,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [balances, setBalances] = useState<LedgerBalances | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [rollIntoPersonal, setRollIntoPersonal] = useState<boolean>(true);
  const [settling, setSettling] = useState<boolean>(false);
  const [settledSuccess, setSettledSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && ledger) {
      fetchBalances();
    }
  }, [isOpen, ledger]);

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const res = await api.get<LedgerBalances>(`/ledgers/${ledger.id}/balances`);
      setBalances(res.data);
    } catch (err) {
      console.error('Failed to load ledger balances', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettleLedger = async () => {
    setSettling(true);
    try {
      await api.post(`/ledgers/${ledger.id}/settle`, {
        rollIntoPersonalHistory: rollIntoPersonal,
      });
      setSettledSuccess(true);
      setTimeout(() => {
        onLedgerSettled();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to settle ledger', err);
    } finally {
      setSettling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/75 backdrop-blur-md">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
        className="w-full max-w-xl bg-white dark:bg-neutral-900 border border-hairline-light dark:border-hairline-dark rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-hairline-light dark:border-hairline-dark">
          <div>
            <div className="flex items-center space-x-2">
              <Scale size={18} className="text-lime-500" />
              <h3 className="text-xl font-extrabold text-ink-primary dark:text-ink-darkPrimary tracking-tight">
                Balances & Settle-Up
              </h3>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Ledger: <span className="font-semibold text-stone-700 dark:text-stone-300">{ledger.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {settledSuccess ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <h4 className="text-lg font-bold text-ink-primary dark:text-ink-darkPrimary">
              Ledger Settled!
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
              {rollIntoPersonal
                ? 'All group balances resolved, and your share was reconciled into your personal expense history.'
                : 'All group balances resolved and marked as settled.'}
            </p>
          </div>
        ) : loading || !balances ? (
          <div className="py-12 text-center text-stone-400">
            <div className="w-6 h-6 border-2 border-stone-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs">Computing debt-netting balances...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pt-4 space-y-6 pr-1">
            {/* Minimal Debt Netting Settle-Up List */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Minimal Settle-Up Payments
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-lime-400/20 text-lime-700 dark:text-lime-400 text-[10px] font-mono font-bold">
                  {balances.settleTransactions.length} Transaction{balances.settleTransactions.length === 1 ? '' : 's'}
                </span>
              </div>

              {balances.settleTransactions.length === 0 ? (
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-neutral-850 text-center text-xs text-stone-500 dark:text-stone-400">
                  All participants are fully settled! No payments required.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {balances.settleTransactions.map((tx, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-gradient-to-r from-stone-50 via-slate-50 to-stone-50 dark:from-neutral-850 dark:via-slate-900 dark:to-neutral-850 border border-hairline-light dark:border-hairline-dark flex items-center justify-between shadow-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                          {tx.fromParticipantName}
                        </span>
                        <ArrowRight size={14} className="text-stone-400" />
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {tx.toParticipantName}
                        </span>
                      </div>
                      <span className="text-sm font-extrabold text-ink-primary dark:text-ink-darkPrimary font-mono">
                        {formatCurrency(tx.amount, tx.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Individual Net Positions */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2.5">
                Participant Net Position
              </h4>
              <div className="space-y-2">
                {balances.participantBalances.map((pb) => (
                  <div
                    key={pb.participantId}
                    className="p-3 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        {pb.participantName}
                      </span>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        Paid: {formatCurrency(pb.totalPaid, balances.baseCurrency)} • Owed: {formatCurrency(pb.totalOwed, balances.baseCurrency)}
                      </div>
                    </div>
                    <div className="text-right">
                      {pb.netBalance > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold font-mono">
                          + {formatCurrency(pb.netBalance, balances.baseCurrency)} (Gets back)
                        </span>
                      ) : pb.netBalance < 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold font-mono">
                          - {formatCurrency(Math.abs(pb.netBalance), balances.baseCurrency)} (Owes)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-stone-200 dark:bg-neutral-800 text-stone-500 font-bold font-mono">
                          Settled
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Settle Action Section */}
            {!ledger.isSettled && (
              <div className="pt-4 border-t border-hairline-light dark:border-hairline-dark space-y-3">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rollIntoPersonal}
                    onChange={(e) => setRollIntoPersonal(e.target.checked)}
                    className="mt-0.5 rounded text-lime-500 focus:ring-lime-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                      Reconcile into Personal Expense History
                    </span>
                    <span className="text-stone-400 block text-[11px] mt-0.5">
                      Creates a single reconciled expense entry in your personal ledger for your share of this trip.
                    </span>
                  </div>
                </label>

                <button
                  type="button"
                  onClick={handleSettleLedger}
                  disabled={settling}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck size={16} />
                  <span>{settling ? 'Settling Ledger...' : 'Mark Ledger Settled & Reconcile'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
