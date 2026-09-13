import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import api from '../api/client';
import { Globe, Check, User as UserIcon, DollarSign, Database, Sparkles, Download, Upload, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import * as backupService from '../data/backupService';

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

  // Backup, Import & Clear State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  const [pendingBackup, setPendingBackup] = useState<backupService.BackupData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);

  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [clearing, setClearing] = useState<boolean>(false);
  const [clearSuccess, setClearSuccess] = useState<boolean>(false);

  const sampleAmount = 124500;

  const handleSaveCurrency = async (newCurr: string) => {
    setCurrency(newCurr);
    setSavingCurrency(true);
    setCurrencySuccess(false);

    localStorage.setItem('runway_default_currency', newCurr);
    if (user) {
      user.defaultCurrency = newCurr;
    }

    try {
      await api.put('/users/me', { defaultCurrency: newCurr });
    } catch (err) {
      console.warn('Backend unavailable, saved currency locally');
    } finally {
      setCurrencySuccess(true);
      onCurrencyUpdated();
      setSavingCurrency(false);
      setTimeout(() => setCurrencySuccess(false), 2000);
    }
  };

  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingIncome(true);
    setIncomeSuccess(false);

    const parsed = monthlyIncome.trim() !== '' ? parseFloat(monthlyIncome) : null;
    if (parsed != null) {
      localStorage.setItem('runway_monthly_income', parsed.toString());
    } else {
      localStorage.removeItem('runway_monthly_income');
    }
    if (user) {
      user.monthlyIncome = parsed;
    }

    try {
      await api.put('/users/me', {
        defaultCurrency: currency,
        monthlyIncome: parsed,
      });
    } catch (err) {
      console.warn('Backend unavailable, saved monthly income locally');
    } finally {
      setIncomeSuccess(true);
      setSavingIncome(false);
      setTimeout(() => setIncomeSuccess(false), 2500);
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

  const handleExportBackup = async () => {
    try {
      setExporting(true);
      setExportSuccess(false);
      await backupService.downloadBackupFile();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export backup', err);
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setPendingBackup(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = backupService.validateBackup(content);
      if (!validation.valid || !validation.data) {
        setImportError(validation.error || 'Invalid backup file format');
      } else {
        setPendingBackup(validation.data);
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read file content.');
    };
    reader.readAsText(file);

    // Reset input so same file can be chosen again if needed
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!pendingBackup) return;
    try {
      setImporting(true);
      await backupService.importBackupData(pendingBackup);
      setPendingBackup(null);
      setImportSuccess(true);
      onCurrencyUpdated();
      setTimeout(() => setImportSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to import backup', err);
      setImportError('Failed to restore data from backup.');
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmClear = async () => {
    try {
      setClearing(true);
      await backupService.clearAllLocalData();
      setShowClearConfirm(false);
      setClearSuccess(true);
      onCurrencyUpdated();
      setTimeout(() => setClearSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to clear local data', err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink-primary dark:text-ink-darkPrimary">
          Settings & Preferences
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Manage your default currency, income baseline, and device storage preferences
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
              Device Storage Mode
            </span>
            <span className="text-sm font-semibold text-ink-primary dark:text-ink-darkPrimary">
              {user?.email && user.email !== 'local@device' ? user.email : 'Runway Local Device'}
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

      {/* DATA MANAGEMENT & BACKUP CARD */}
      <div className="bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] space-y-5">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-clay-50 dark:bg-clay-950/50 text-terracotta flex items-center justify-center">
            <Database size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink-primary dark:text-ink-darkPrimary">
              Data Management & Backup
            </h3>
            <p className="text-xs text-stone-400 dark:text-stone-500">
              Export, restore, or clear your local Runway personal finance data
            </p>
          </div>
        </div>

        {/* Feedback Alerts */}
        {exportSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <Check size={16} /> Backup exported successfully as JSON file.
          </div>
        )}

        {importSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <Check size={16} /> Data backup restored successfully into IndexedDB!
          </div>
        )}

        {clearSuccess && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <Check size={16} /> Local financial data cleared. Default categories re-seeded.
          </div>
        )}

        {importError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertTriangle size={16} /> {importError}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Export JSON */}
          <motion.button
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            onClick={handleExportBackup}
            disabled={exporting}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-ink-primary dark:text-ink-darkPrimary text-xs font-extrabold transition-all cursor-pointer disabled:opacity-50"
          >
            <Download size={15} />
            <span>{exporting ? 'Exporting...' : 'Export Backup JSON'}</span>
          </motion.button>

          {/* Import JSON */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <motion.button
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold transition-all cursor-pointer disabled:opacity-50"
          >
            <Upload size={15} />
            <span>Import Backup JSON</span>
          </motion.button>

          {/* Clear Local Data */}
          <motion.button
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-extrabold transition-all cursor-pointer"
          >
            <Trash2 size={15} />
            <span>Clear Local Data</span>
          </motion.button>
        </div>
      </div>

      {/* IMPORT CONFIRMATION MODAL */}
      {pendingBackup && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
              <Upload size={22} />
              <h3 className="text-base font-bold text-ink-primary dark:text-ink-darkPrimary">
                Confirm Backup Import
              </h3>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Importing will <strong className="text-rose-600 dark:text-rose-400">replace all current local financial data</strong> in this browser with the backup file data.
            </p>

            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-neutral-850 border border-hairline-light dark:border-hairline-dark text-xs space-y-1.5 font-mono text-stone-600 dark:text-stone-400">
              <div>Version: {pendingBackup.version}</div>
              <div>Exported At: {new Date(pendingBackup.exportedAt).toLocaleString()}</div>
              <div>Expenses: {pendingBackup.expenses?.length || 0}</div>
              <div>Categories: {pendingBackup.categories?.length || 0}</div>
              <div>Budgets: {pendingBackup.budgets?.length || 0}</div>
              <div>Recurring Expenses: {pendingBackup.recurringExpenses?.length || 0}</div>
              <div>Savings Goals: {pendingBackup.savingsGoals?.length || 0}</div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingBackup(null)}
                disabled={importing}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importing}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center space-x-2 disabled:opacity-50"
              >
                {importing && <RefreshCw size={14} className="animate-spin" />}
                <span>{importing ? 'Importing...' : 'Confirm & Restore Data'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* CLEAR DATA CONFIRMATION MODAL */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-neutral-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle size={22} />
              <h3 className="text-base font-bold text-ink-primary dark:text-ink-darkPrimary">
                Clear All Local Data?
              </h3>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              This action will permanently delete all expenses, categories, budgets, recurring expenses, and savings goals stored in this browser's IndexedDB.
            </p>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-700 dark:text-rose-300">
              Warning: This action cannot be undone unless you have exported a JSON backup.
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                disabled={clearing}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center space-x-2 disabled:opacity-50"
              >
                {clearing && <RefreshCw size={14} className="animate-spin" />}
                <span>{clearing ? 'Clearing...' : 'Yes, Delete All Local Data'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

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
