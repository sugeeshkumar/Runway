import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SharedLedger, LedgerParticipant, SplitType, CreateSharedExpenseRequest, SharedExpense } from '../types';
import { X, Check } from 'lucide-react';
import api from '../api/client';

interface LogSharedExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledger: SharedLedger;
  onExpenseAdded: (expense: SharedExpense) => void;
}

export const LogSharedExpenseModal: React.FC<LogSharedExpenseModalProps> = ({
  isOpen,
  onClose,
  ledger,
  onExpenseAdded,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [paidByParticipantId, setPaidByParticipantId] = useState<string>(
    ledger.participants[0]?.id || ''
  );
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>(ledger.baseCurrency || 'INR');
  const [exchangeRate, setExchangeRate] = useState<string>('1');
  const [description, setDescription] = useState<string>('');
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');

  // Selected participants for EQUAL split mode (default: all selected)
  const [selectedForEqual, setSelectedForEqual] = useState<Record<string, boolean>>({});

  // Custom split values for EXACT / PERCENTAGE modes
  const [splitValues, setSplitValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ledger?.participants) {
      const initialEqual: Record<string, boolean> = {};
      ledger.participants.forEach(p => {
        initialEqual[p.id] = true;
      });
      setSelectedForEqual(initialEqual);
      if (!paidByParticipantId && ledger.participants.length > 0) {
        setPaidByParticipantId(ledger.participants[0].id);
      }
    }
  }, [ledger]);

  if (!isOpen) return null;

  const toggleEqualParticipant = (pId: string) => {
    setSelectedForEqual(prev => ({ ...prev, [pId]: !prev[pId] }));
  };

  const handleSplitValueChange = (pId: string, val: string) => {
    setSplitValues(prev => ({ ...prev, [pId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid expense amount');
      return;
    }

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      let splitsPayload;

      if (splitType === 'EQUAL') {
        const targetIds = Object.keys(selectedForEqual).filter(id => selectedForEqual[id]);
        if (targetIds.length === 0) {
          setError('Please select at least one participant to split this expense');
          setSubmitting(false);
          return;
        }
        splitsPayload = targetIds.map(id => ({ participantId: id }));
      } else {
        splitsPayload = ledger.participants.map(p => ({
          participantId: p.id,
          value: splitValues[p.id] ? parseFloat(splitValues[p.id]) : 0,
        }));
      }

      const payload: CreateSharedExpenseRequest = {
        paidByParticipantId,
        amount: parsedAmount,
        currency,
        exchangeRate: parseFloat(exchangeRate) || 1,
        description: description.trim(),
        splitType,
        splits: splitsPayload,
      };

      const res = await api.post<SharedExpense>(`/ledgers/${ledger.id}/expenses`, payload);
      onExpenseAdded(res.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to log shared expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-hairline-light dark:border-hairline-dark rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between pb-4 border-b border-hairline-light dark:border-hairline-dark">
          <div>
            <h3 className="text-xl font-extrabold text-ink-primary dark:text-ink-darkPrimary tracking-tight">
              Log Shared Expense
            </h3>
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

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pt-4 pr-1">
          {/* Who Paid & Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                Paid By
              </label>
              <select
                value={paidByParticipantId}
                onChange={(e) => setPaidByParticipantId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-xs font-semibold text-ink-primary dark:text-ink-darkPrimary focus:outline-none"
              >
                {ledger.participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                Expense Amount
              </label>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-sm font-bold text-ink-primary dark:text-ink-darkPrimary focus:outline-none"
              />
            </div>
          </div>

          {/* Currency & Exchange Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  if (e.target.value === ledger.baseCurrency) {
                    setExchangeRate('1');
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-xs font-semibold text-ink-primary dark:text-ink-darkPrimary focus:outline-none"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            {currency !== ledger.baseCurrency && (
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                  Exchange Rate ({currency} to {ledger.baseCurrency})
                </label>
                <input
                  type="number"
                  step="any"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  placeholder="e.g. 85.00"
                  className="w-full px-3 py-2 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-xs font-medium text-ink-primary dark:text-ink-darkPrimary focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
              Description / Details
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Drinks for 2, Medicine for Friend, Dinner"
              className="w-full px-3.5 py-2.5 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-sm font-medium text-ink-primary dark:text-ink-darkPrimary focus:outline-none"
            />
          </div>

          {/* Split Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
              Split Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'EQUAL', label: 'Split Equally' },
                { type: 'EXACT', label: 'Custom Amounts' },
                { type: 'PERCENTAGE', label: 'Percentage %' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setSplitType(item.type as SplitType)}
                  className={`py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    splitType === item.type
                      ? 'border-lime-500 bg-lime-500/10 text-lime-600 dark:text-lime-400'
                      : 'border-hairline-light dark:border-hairline-dark text-stone-600 dark:text-stone-400 hover:border-stone-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* EQUAL SPLIT: Checkbox selection of participants */}
          {splitType === 'EQUAL' && (
            <div className="pt-2 space-y-2">
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400">
                Select Members Sharing This Expense
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ledger.participants.map((p) => {
                  const isChecked = !!selectedForEqual[p.id];
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleEqualParticipant(p.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'border-lime-500 bg-lime-500/10 text-stone-800 dark:text-stone-200'
                          : 'border-hairline-light dark:border-hairline-dark text-stone-400 opacity-60'
                      }`}
                    >
                      <span className="text-xs font-semibold">{p.displayName}</span>
                      <div className={`w-4 h-4 rounded flex items-center justify-center ${isChecked ? 'bg-lime-500 text-neutral-950' : 'border border-stone-400'}`}>
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* EXACT / PERCENTAGE: Per Participant Breakdown */}
          {splitType !== 'EQUAL' && (
            <div className="pt-2 space-y-2">
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400">
                {splitType === 'EXACT' ? 'Enter Exact Share Amount per Participant' : 'Enter Percentage (%) per Participant'}
              </label>
              {ledger.participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between space-x-2 bg-stone-50 dark:bg-neutral-850 p-2.5 rounded-xl border border-hairline-light dark:border-hairline-dark">
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">{p.displayName}</span>
                  <input
                    type="number"
                    step="any"
                    value={splitValues[p.id] || ''}
                    onChange={(e) => handleSplitValueChange(p.id, e.target.value)}
                    placeholder={splitType === 'EXACT' ? '0.00' : '0%'}
                    className="w-28 px-2.5 py-1.5 text-right rounded-lg border border-hairline-light dark:border-hairline-dark bg-white dark:bg-neutral-900 text-xs font-bold text-ink-primary dark:text-ink-darkPrimary"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-hairline-light dark:border-hairline-dark">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-hairline-light dark:border-hairline-dark text-stone-600 dark:text-stone-400 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-ink-primary text-white dark:bg-white dark:text-neutral-900 font-semibold text-xs transition-all shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
