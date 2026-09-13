import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { closeDB } from '../../storage/db';
import * as backupService from '../backupService';
import * as expenseRepository from '../expenseRepository';
import * as categoryRepository from '../categoryRepository';
import * as budgetRepository from '../budgetRepository';
import * as recurringRepository from '../recurringRepository';
import * as savingsGoalRepository from '../savingsGoalRepository';

const safeSetItem = (key: string, value: string) => {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem(key, value);
    }
  } catch {}
};

const safeGetItem = (key: string): string | null => {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      return localStorage.getItem(key);
    }
  } catch {}
  return null;
};

const safeClearStorage = () => {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
      localStorage.clear();
    } else if (typeof localStorage !== 'undefined' && typeof localStorage.removeItem === 'function') {
      localStorage.removeItem('runway_default_currency');
      localStorage.removeItem('runway_monthly_income');
    }
  } catch {}
};

describe('Backup Service (Export, Import, Validation & Clear)', () => {
  beforeEach(async () => {
    safeClearStorage();
    await closeDB();
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  });

  it('1. exportBackupData generates valid schema version 1 object with all stores', async () => {
    const categories = await categoryRepository.getCategories();
    const cat = categories[0];

    await expenseRepository.createExpense({
      amount: 500,
      currency: 'INR',
      categoryId: cat.id,
      description: 'Test Expense',
      source: 'MANUAL',
      occurredAt: new Date().toISOString(),
    });

    await budgetRepository.createBudget({
      categoryId: cat.id,
      amount: 5000,
      periodMonth: '2026-09',
    });

    safeSetItem('runway_default_currency', 'USD');
    safeSetItem('runway_monthly_income', '85000');

    const backup = await backupService.exportBackupData();

    expect(backup.version).toBe(1);
    expect(backup.exportedAt).toBeDefined();
    expect(backup.expenses.length).toBe(1);
    expect(backup.categories.length).toBeGreaterThan(0);
    expect(backup.budgets.length).toBe(1);
  });

  it('2. validateBackup correctly validates schema version 1 and rejects malformed/invalid files', () => {
    // Empty
    expect(backupService.validateBackup('').valid).toBe(false);

    // Invalid JSON syntax
    expect(backupService.validateBackup('{ invalid json ').valid).toBe(false);

    // Missing version
    expect(backupService.validateBackup(JSON.stringify({ expenses: [] })).valid).toBe(false);

    // Unsupported version
    expect(backupService.validateBackup(JSON.stringify({ version: 99, expenses: [] })).valid).toBe(false);

    // Missing required arrays
    expect(backupService.validateBackup(JSON.stringify({ version: 1, expenses: [] })).valid).toBe(false);

    // Valid backup
    const validJson = JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      expenses: [],
      categories: [],
      budgets: [],
      recurringExpenses: [],
      savingsGoals: [],
      contributions: [],
    });
    const res = backupService.validateBackup(validJson);
    expect(res.valid).toBe(true);
    expect(res.data?.version).toBe(1);
  });

  it('3. importBackupData replaces existing local data with backup contents', async () => {
    const defaultCats = await categoryRepository.getCategories();
    const cat = defaultCats[0];

    const backupPayload: backupService.BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      expenses: [
        {
          id: 'exp-100',
          userId: 'local-user',
          amount: 1200,
          currency: 'EUR',
          category: cat,
          description: 'Imported Expense',
          occurredAt: '2026-09-10T12:00:00.000Z',
          source: 'MANUAL',
          createdAt: '2026-09-10T12:00:00.000Z',
        },
      ],
      categories: [cat],
      budgets: [],
      recurringExpenses: [],
      savingsGoals: [],
      contributions: [],
      settings: {
        defaultCurrency: 'EUR',
        monthlyIncome: 120000,
      },
    };

    await backupService.importBackupData(backupPayload);

    const expensesAfter = await expenseRepository.getExpenses();
    expect(expensesAfter.length).toBe(1);
    expect(expensesAfter[0].id).toBe('exp-100');
    expect(expensesAfter[0].amount).toBe(1200);
  });

  it('4. clearAllLocalData wipes stores and reseeds default categories', async () => {
    const categories = await categoryRepository.getCategories();
    const cat = categories[0];

    await expenseRepository.createExpense({
      amount: 750,
      currency: 'INR',
      categoryId: cat.id,
      description: 'Pre-clear expense',
      source: 'MANUAL',
      occurredAt: new Date().toISOString(),
    });

    safeSetItem('runway_default_currency', 'GBP');

    await backupService.clearAllLocalData();

    const expensesAfter = await expenseRepository.getExpenses();
    expect(expensesAfter.length).toBe(0);

    const categoriesAfter = await categoryRepository.getCategories();
    expect(categoriesAfter.length).toBe(8); // Default categories re-seeded
  });
});
