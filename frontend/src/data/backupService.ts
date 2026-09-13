import { getDB, seedDefaultCategoriesIfEmpty } from '../storage/db';
import { Category, Expense, Budget, RecurringTemplate, SavingsGoal, GoalContribution } from '../types';
import * as expenseRepository from './expenseRepository';
import * as categoryRepository from './categoryRepository';
import * as budgetRepository from './budgetRepository';
import * as recurringRepository from './recurringRepository';
import * as savingsGoalRepository from './savingsGoalRepository';

export interface BackupSettings {
  defaultCurrency?: string;
  monthlyIncome?: number | null;
}

export interface BackupData {
  version: number;
  exportedAt: string;
  expenses: Expense[];
  categories: Category[];
  budgets: Budget[];
  recurringExpenses: RecurringTemplate[];
  savingsGoals: SavingsGoal[];
  contributions: GoalContribution[];
  settings?: BackupSettings;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: BackupData;
}

export const BACKUP_SCHEMA_VERSION = 1;

const getLocalStorageItem = (key: string): string | null => {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      return localStorage.getItem(key);
    }
  } catch {
    // Ignore storage errors in non-browser environments
  }
  return null;
};

const setLocalStorageItem = (key: string, value: string): void => {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage errors in non-browser environments
  }
};

const removeLocalStorageItem = (key: string): void => {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.removeItem === 'function') {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage errors in non-browser environments
  }
};

/**
 * Creates a complete JSON backup object of all local personal finance data and settings.
 */
export const exportBackupData = async (): Promise<BackupData> => {
  const [expenses, categories, budgets, recurringExpenses, savingsGoals] = await Promise.all([
    expenseRepository.getExpenses(),
    categoryRepository.getCategories(),
    budgetRepository.getBudgets(),
    recurringRepository.getRecurringExpenses(),
    savingsGoalRepository.getSavingsGoals(),
  ]);

  // Extract all contributions from savings goals
  const contributions: GoalContribution[] = [];
  for (const goal of savingsGoals) {
    if (goal.contributions && Array.isArray(goal.contributions)) {
      contributions.push(...goal.contributions);
    }
  }

  // Get local settings
  const defaultCurrency = getLocalStorageItem('runway_default_currency') || 'INR';
  const rawIncome = getLocalStorageItem('runway_monthly_income');
  const monthlyIncome = rawIncome ? parseFloat(rawIncome) : null;

  return {
    version: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    expenses,
    categories,
    budgets,
    recurringExpenses,
    savingsGoals,
    contributions,
    settings: {
      defaultCurrency,
      monthlyIncome,
    },
  };
};

/**
 * Triggers a browser file download of the backup JSON file.
 */
export const downloadBackupFile = async (): Promise<void> => {
  const backupData = await exportBackupData();
  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];
  const link = document.createElement('a');
  link.href = url;
  link.download = `runway-backup-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Validates a JSON string as a valid Runway backup file.
 */
export const validateBackup = (jsonText: string): ValidationResult => {
  if (!jsonText || typeof jsonText !== 'string' || jsonText.trim() === '') {
    return { valid: false, error: 'Backup file is empty.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { valid: false, error: 'Invalid file format: file is not valid JSON.' };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { valid: false, error: 'Invalid backup format: root must be a JSON object.' };
  }

  const data = parsed as Record<string, unknown>;

  if (typeof data.version !== 'number') {
    return { valid: false, error: 'Invalid backup file: missing or invalid "version" field.' };
  }

  if (data.version !== BACKUP_SCHEMA_VERSION) {
    return {
      valid: false,
      error: `Unsupported backup schema version: ${data.version}. This version of Runway requires schema version ${BACKUP_SCHEMA_VERSION}.`,
    };
  }

  if (!Array.isArray(data.expenses)) {
    return { valid: false, error: 'Invalid backup file: missing "expenses" array.' };
  }

  if (!Array.isArray(data.categories)) {
    return { valid: false, error: 'Invalid backup file: missing "categories" array.' };
  }

  if (!Array.isArray(data.budgets)) {
    return { valid: false, error: 'Invalid backup file: missing "budgets" array.' };
  }

  if (!Array.isArray(data.recurringExpenses)) {
    return { valid: false, error: 'Invalid backup file: missing "recurringExpenses" array.' };
  }

  if (!Array.isArray(data.savingsGoals)) {
    return { valid: false, error: 'Invalid backup file: missing "savingsGoals" array.' };
  }

  return {
    valid: true,
    data: data as unknown as BackupData,
  };
};

/**
 * Restores local IndexedDB stores and settings from a validated BackupData object.
 */
export const importBackupData = async (backupData: BackupData): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(
    ['expenses', 'categories', 'budgets', 'recurringExpenses', 'savingsGoals'],
    'readwrite'
  );

  // Clear existing data
  await tx.objectStore('expenses').clear();
  await tx.objectStore('categories').clear();
  await tx.objectStore('budgets').clear();
  await tx.objectStore('recurringExpenses').clear();
  await tx.objectStore('savingsGoals').clear();

  // Populate categories first
  for (const cat of backupData.categories) {
    await tx.objectStore('categories').put(cat);
  }

  // Populate expenses
  for (const exp of backupData.expenses) {
    await tx.objectStore('expenses').put(exp);
  }

  // Populate budgets
  for (const b of backupData.budgets) {
    await tx.objectStore('budgets').put(b);
  }

  // Populate recurring expenses
  for (const r of backupData.recurringExpenses) {
    await tx.objectStore('recurringExpenses').put(r);
  }

  // Populate savings goals
  for (const goal of backupData.savingsGoals) {
    await tx.objectStore('savingsGoals').put(goal);
  }

  await tx.done;

  // Restore settings if provided
  if (backupData.settings) {
    if (backupData.settings.defaultCurrency) {
      setLocalStorageItem('runway_default_currency', backupData.settings.defaultCurrency);
    }
    if (backupData.settings.monthlyIncome !== undefined && backupData.settings.monthlyIncome !== null) {
      setLocalStorageItem('runway_monthly_income', backupData.settings.monthlyIncome.toString());
    }
  }

  // Ensure default categories exist if categories array was empty
  await seedDefaultCategoriesIfEmpty();
};

/**
 * Destructively clears all local IndexedDB stores and local settings.
 */
export const clearAllLocalData = async (): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(
    ['expenses', 'categories', 'budgets', 'recurringExpenses', 'savingsGoals'],
    'readwrite'
  );

  await tx.objectStore('expenses').clear();
  await tx.objectStore('categories').clear();
  await tx.objectStore('budgets').clear();
  await tx.objectStore('recurringExpenses').clear();
  await tx.objectStore('savingsGoals').clear();

  await tx.done;

  // Clear local settings
  removeLocalStorageItem('runway_default_currency');
  removeLocalStorageItem('runway_monthly_income');

  // Reseed default categories so app remains functional
  await seedDefaultCategoriesIfEmpty();
};
