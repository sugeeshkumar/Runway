import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CreateLedgerRequest, LedgerType, SharedLedger } from '../types';
import { X, Plus, Trash2, Calendar, Plane, PartyPopper, Briefcase, UserCheck, Users } from 'lucide-react';
import api from '../api/client';

interface CreateLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLedgerCreated: (ledger: SharedLedger) => void;
  userDefaultCurrency?: string;
}

export const CreateLedgerModal: React.FC<CreateLedgerModalProps> = ({
  isOpen,
  onClose,
  onLedgerCreated,
  userDefaultCurrency = 'INR',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<LedgerType>('TRIP');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>('');
  const [baseCurrency, setBaseCurrency] = useState<string>(userDefaultCurrency);
  const [budgetMode, setBudgetMode] = useState<'INDIVIDUAL' | 'OVERALL'>('INDIVIDUAL');
  const [plannedBudget, setPlannedBudget] = useState<string>('');
  const [participantNames, setParticipantNames] = useState<string[]>(['Bob', 'Charlie']);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddParticipant = () => {
    setParticipantNames([...participantNames, '']);
  };

  const handleRemoveParticipant = (index: number) => {
    setParticipantNames(participantNames.filter((_, i) => i !== index));
  };

  const handleParticipantChange = (index: number, value: string) => {
    const updated = [...participantNames];
    updated[index] = value;
    setParticipantNames(updated);
  };

  const totalParticipants = participantNames.filter(n => n.trim().length > 0).length + 1; // +1 for owner

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Ledger name is required');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      let finalOverallBudget: number | null = null;
      if (plannedBudget) {
        const inputBudget = parseFloat(plannedBudget);
        if (budgetMode === 'INDIVIDUAL') {
          // Multiply per-person budget by total participants to get total group budget
          finalOverallBudget = inputBudget * totalParticipants;
        } else {
          finalOverallBudget = inputBudget;
        }
      }

      const payload: CreateLedgerRequest = {
        name: name.trim(),
        type,
        startDate,
        endDate: endDate ? endDate : null,
        baseCurrency,
        plannedBudget: finalOverallBudget,
        participantNames: participantNames.filter(n => n.trim().length > 0),
      };

      const res = await api.post<SharedLedger>('/ledgers', payload);
      onLedgerCreated(res.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create shared ledger');
    } finally {
      setSubmitting(false);
    }
  };

  const currentIndividualBudget = plannedBudget && !isNaN(parseFloat(plannedBudget))
    ? budgetMode === 'INDIVIDUAL'
      ? parseFloat(plannedBudget)
      : parseFloat(plannedBudget) / totalParticipants
    : 0;

  const currentTotalGroupBudget = plannedBudget && !isNaN(parseFloat(plannedBudget))
    ? budgetMode === 'INDIVIDUAL'
      ? parseFloat(plannedBudget) * totalParticipants
      : parseFloat(plannedBudget)
    : 0;

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
              Create Trips & Events Ledger
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Track shared money for trips, parties, or family functions
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
          {/* Name & Type */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
              Ledger Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Goa Vacation 2026, Diwali Party"
              className="w-full px-3.5 py-2.5 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-sm font-medium text-ink-primary dark:text-ink-darkPrimary focus:outline-none focus:border-stone-400 dark:focus:border-neutral-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
              Event Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'TRIP', label: 'Trip / Vacation', icon: Plane },
                { type: 'EVENT', label: 'Party / Event', icon: PartyPopper },
                { type: 'CUSTOM', label: 'Custom Group', icon: Briefcase },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = type === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setType(item.type as LedgerType)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-lime-500 bg-lime-500/10 text-lime-600 dark:text-lime-400'
                        : 'border-hairline-light dark:border-hairline-dark hover:border-stone-400 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <Icon size={18} className="mb-1" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-xs font-medium text-ink-primary dark:text-ink-darkPrimary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-xs font-medium text-ink-primary dark:text-ink-darkPrimary focus:outline-none"
              />
            </div>
          </div>

          {/* Currency & Budget Mode Selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                Base Currency
              </label>
              <select
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-sm font-semibold text-ink-primary dark:text-ink-darkPrimary focus:outline-none"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                Budget Scope
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 dark:bg-neutral-850 rounded-xl border border-hairline-light dark:border-hairline-dark">
                <button
                  type="button"
                  onClick={() => setBudgetMode('INDIVIDUAL')}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    budgetMode === 'INDIVIDUAL'
                      ? 'bg-white dark:bg-neutral-900 text-lime-600 dark:text-lime-400 shadow-xs'
                      : 'text-stone-500 dark:text-stone-400'
                  }`}
                >
                  Per Person
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetMode('OVERALL')}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    budgetMode === 'OVERALL'
                      ? 'bg-white dark:bg-neutral-900 text-lime-600 dark:text-lime-400 shadow-xs'
                      : 'text-stone-500 dark:text-stone-400'
                  }`}
                >
                  Total Group
                </button>
              </div>
            </div>
          </div>

          {/* Planned Budget Input with Dynamic Helper */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
              {budgetMode === 'INDIVIDUAL' ? 'Per-Person Planned Budget (Optional)' : 'Total Group Planned Budget (Optional)'}
            </label>
            <input
              type="number"
              step="any"
              value={plannedBudget}
              onChange={(e) => setPlannedBudget(e.target.value)}
              placeholder={budgetMode === 'INDIVIDUAL' ? 'e.g. 10000 per person' : 'e.g. 30000 total group'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-sm font-semibold text-ink-primary dark:text-ink-darkPrimary focus:outline-none"
            />
            {plannedBudget && !isNaN(parseFloat(plannedBudget)) && (
              <div className="mt-1.5 p-2 rounded-lg bg-lime-500/10 text-[11px] text-lime-700 dark:text-lime-400 flex items-center justify-between font-medium">
                <span>
                  {budgetMode === 'INDIVIDUAL' ? 'Individual Budget:' : 'Per-Person Share:'}{' '}
                  <strong>{baseCurrency} {currentIndividualBudget.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong> / person
                </span>
                <span>
                  Group Target: <strong>{baseCurrency} {currentTotalGroupBudget.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong> ({totalParticipants} members)
                </span>
              </div>
            )}
          </div>

          {/* Add Participants */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-stone-600 dark:text-stone-400">
                Group Participants ({totalParticipants})
              </label>
              <span className="text-[11px] text-stone-400">You are added automatically</span>
            </div>

            <div className="space-y-2">
              {participantNames.map((pName, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={pName}
                    onChange={(e) => handleParticipantChange(idx, e.target.value)}
                    placeholder={`Participant ${idx + 1} Name`}
                    className="flex-1 px-3 py-2 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-xs font-medium text-ink-primary dark:text-ink-darkPrimary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveParticipant(idx)}
                    className="p-2 rounded-xl text-stone-400 hover:text-rose-500 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddParticipant}
              className="mt-2.5 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 dark:hover:bg-neutral-750 text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors"
            >
              <Plus size={14} />
              <span>Add Another Participant</span>
            </button>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-hairline-light dark:border-hairline-dark mt-4">
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
              {submitting ? 'Creating...' : 'Create Ledger'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
