import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import api from '../api/client';
import { Globe, Check, User as UserIcon, DollarSign, Database, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

interface SettingsPageProps {
  onCurrencyUpdated: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onCurrencyUpdated }) => {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const [currency, setCurrency] = useState<string>(user?.defaultCurrency || 'INR');
  const [monthlyIncome, setMonthlyIncome] = useState<string>(
    user?.monthlyIncome != null ? user.monthlyIncome.toString() : ''
  );
  const [savingCurrency, setSavingCurrency] = useState<boolean>(false);
  const [currencySuccess, setCurrencySuccess] = useState<boolean>(false);

  const [savingIncome, setSavingIncome] = useState<boolean>(false);
  const [incomeSuccess, setIncomeSuccess] = useState<boolean>(false);

  const [seeding, setSeeding] = useState<boolean>(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const sampleAmount = 124500;

  const handleSaveCurrency = async (newCurr: string) => {
    setCurrency(newCurr);
    setSavingCurrency(true);
    setCurrencySuccess(false);

    try {
      await api.put('/users/me', { defaultCurrency: newCurr });
      if (user) {
        user.defaultCurrency = newCurr;
      }
      setCurrencySuccess(true);
      onCurrencyUpdated();
      setTimeout(() => setCurrencySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update default currency', err);
    } finally {
      setSavingCurrency(false);
    }
  };

  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingIncome(true);
    setIncomeSuccess(false);

    const parsed = monthlyIncome.trim() !== '' ? parseFloat(monthlyIncome) : null;
    try {
      await api.put('/users/me', {
        defaultCurrency: currency,
        monthlyIncome: parsed,
      });
      if (user) {
        user.monthlyIncome = parsed;
      }
      setIncomeSuccess(true);
      setTimeout(() => setIncomeSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update monthly income', err);
    } finally {
      setSavingIncome(false);
    }
  };

  const handleSeedDemoData = async () => {
    try {
      setSeeding(true);
      setSeedMessage(null);
      const res = await api.post('/dev/seed');
      setSeedMessage(
        `Seeded ${res.data.expensesCreated} expenses, ${res.data.recurringTemplatesCreated} recurring templates, ${res.data.budgetsCreated} budgets, and shared ledger "${res.data.sharedLedgerCreated}"!`
      );
      onCurrencyUpdated();
    } catch (err) {
      console.error('Failed to seed demo data', err);
      setSeedMessage('Failed to seed demo data');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink-primary dark:text-ink-darkPrimary">
          Settings & Preferences
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Manage your default currency, income baseline, and account details
        </p>
      </div>

      {/* User Info Card */}
      <div className="bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-neutral-800 flex items-center justify-center text-stone-500">
            <UserIcon size={18} />
          </div>
          <div>
            <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
              Signed in as
            </span>
            <span className="text-sm font-semibold text-ink-primary dark:text-ink-darkPrimary">
              {user?.email}
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Income Card */}
      <div className="bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink-primary dark:text-ink-darkPrimary">
                Monthly Net Income
              </h3>
              <p className="text-xs text-stone-400 dark:text-stone-500">
                Used to compute your committed monthly expenses percentage
              </p>
            </div>
          </div>

          {incomeSuccess && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <Check size={14} /> Saved
            </span>
          )}
        </div>

        <form onSubmit={handleSaveIncome} className="flex items-center gap-3 pt-1">
          <div className="relative flex-1">
            <input
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 150000"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-sm font-bold text-ink-primary dark:text-ink-darkPrimary focus:outline-hidden focus:ring-2 focus:ring-emerald-500 tabular-nums"
            />
          </div>
          <motion.button
            whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}
            type="submit"
            disabled={savingIncome}
            className="px-5 py-2.5 rounded-xl bg-ink-primary text-white dark:bg-white dark:text-neutral-900 text-xs font-extrabold shadow-sm hover:bg-stone-800 dark:hover:bg-stone-100 transition-all cursor-pointer disabled:opacity-50"
          >
            {savingIncome ? 'Saving...' : 'Save Income'}
          </motion.button>
        </form>
      </div>

      {/* Default Currency Card */}
      <div className="bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Globe size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink-primary dark:text-ink-darkPrimary">
                Default Ledger Currency
              </h3>
              <p className="text-xs text-stone-400 dark:text-stone-500">
                All budgets and summary totals will aggregate in this currency
              </p>
            </div>
          </div>

          {currencySuccess && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <Check size={14} /> Saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[
            { code: 'INR', label: 'Indian Rupee (₹)', formatNote: 'Lakhs/Crores grouping' },
            { code: 'USD', label: 'US Dollar ($)', formatNote: 'Thousands grouping' },
            { code: 'EUR', label: 'Euro (€)', formatNote: 'German/Euro grouping' },
            { code: 'GBP', label: 'British Pound (£)', formatNote: 'UK grouping' },
          ].map((item) => {
            const isSelected = currency === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSaveCurrency(item.code)}
                disabled={savingCurrency}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-ink-accent bg-stone-50 dark:bg-neutral-850 dark:border-white shadow-xs'
                    : 'border-hairline-light dark:border-hairline-dark hover:border-stone-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-primary dark:text-ink-darkPrimary">
                    {item.code}
                  </span>
                  {isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
                </div>
                <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
                  {formatCurrency(sampleAmount, item.code, { showFraction: false })}
                </p>
              </button>
            );
          })}
        </div>

        <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-neutral-850 border border-hairline-light dark:border-hairline-dark text-xs text-stone-500 dark:text-stone-400">
          <span className="font-semibold text-ink-primary dark:text-ink-darkPrimary">Formatting Example: </span>
          <span>
            {currency === 'INR' ? '₹1,24,500 (Indian lakhs format)' : formatCurrency(sampleAmount, currency)}
          </span>
        </div>
      </div>

      {/* Developer Tools / Seed Data Card */}
      <div className="bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Database size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink-primary dark:text-ink-darkPrimary">
              Developer Demo Seed Data
            </h3>
            <p className="text-xs text-stone-400 dark:text-stone-500">
              Populate realistic history, budgets, recurring subscriptions, and a multi-currency Goa trip
            </p>
          </div>
        </div>

        {seedMessage && (
          <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs font-semibold text-purple-700 dark:text-purple-300">
            {seedMessage}
          </div>
        )}

        <div className="pt-1">
          <motion.button
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            onClick={handleSeedDemoData}
            disabled={seeding}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={15} />
            <span>{seeding ? 'Seeding Demo Data...' : 'Seed Realistic Demo Data'}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
