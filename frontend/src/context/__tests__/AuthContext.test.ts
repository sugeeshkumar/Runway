import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { DEFAULT_LOCAL_USER } from '../AuthContext';
import * as expenseRepository from '../../data/expenseRepository';
import * as categoryRepository from '../../data/categoryRepository';
import * as budgetRepository from '../../data/budgetRepository';
import * as recurringRepository from '../../data/recurringRepository';
import * as savingsGoalRepository from '../../data/savingsGoalRepository';
import { closeDB } from '../../storage/db';

describe('Step 5: Local-First Application Startup & Auth Removal', () => {
  beforeEach(async () => {
    if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
      localStorage.clear();
    }
    await closeDB();
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  });

  it('1. Application initializes default local user without JWT or /auth/me call', () => {
    expect(DEFAULT_LOCAL_USER).toBeDefined();
    expect(DEFAULT_LOCAL_USER.id).toBe('local-user');
    expect(DEFAULT_LOCAL_USER.email).toBe('local@device');
    expect(DEFAULT_LOCAL_USER.defaultCurrency).toBe('INR');
  });

  it('2. Local expense CRUD operates completely without token', async () => {
    const categories = await categoryRepository.getCategories();
    const exp = await expenseRepository.createExpense({
      amount: 450,
      currency: 'INR',
      categoryId: categories[0].id,
      description: 'Zaitoon Dinner',
      occurredAt: new Date().toISOString(),
      source: 'MANUAL',
    });

    expect(exp.id).toBeDefined();
    const all = await expenseRepository.getExpenses();
    expect(all).toHaveLength(1);

    const updated = await expenseRepository.updateExpense(exp.id, { amount: 500 });
    expect(updated.amount).toBe(500);

    await expenseRepository.deleteExpense(exp.id);
    const afterDelete = await expenseRepository.getExpenses();
    expect(afterDelete).toHaveLength(0);
  });

  it('3. Local category CRUD operates without authentication', async () => {
    const cat = await categoryRepository.createCategory({
      name: 'Hobbies & Gaming',
      color: '#EC4899',
    });

    expect(cat.id).toBeDefined();
    const categories = await categoryRepository.getCategories();
    expect(categories.find((c) => c.id === cat.id)).toBeDefined();

    await categoryRepository.deleteCategory(cat.id);
    const afterDelete = await categoryRepository.getCategories();
    expect(afterDelete.find((c) => c.id === cat.id)).toBeUndefined();
  });

  it('4. Local budget CRUD operates without authentication', async () => {
    const b = await budgetRepository.createBudget({
      amount: 40000,
      periodMonth: '2026-09',
    });

    expect(b.id).toBeDefined();
    const list = await budgetRepository.getBudgets('2026-09');
    expect(list.find((item) => item.id === b.id)?.amount).toBe(40000);
  });

  it('5. Local recurring expense CRUD operates without authentication', async () => {
    const categories = await categoryRepository.getCategories();
    const rec = await recurringRepository.createRecurringExpense({
      description: 'Gym Membership',
      categoryId: categories[0].id,
      amount: 2000,
      currency: 'INR',
      cadence: 'MONTHLY',
      nextDueDate: '2026-09-01',
    });

    expect(rec.id).toBeDefined();
    const list = await recurringRepository.getRecurringExpenses();
    expect(list).toHaveLength(1);
  });

  it('6. Local savings goal CRUD operates without authentication', async () => {
    const goal = await savingsGoalRepository.createSavingsGoal({
      name: 'Emergency Fund',
      targetAmount: 50000,
    });

    expect(goal.id).toBeDefined();

    const withContrib = await savingsGoalRepository.addContribution(goal.id, {
      amount: 10000,
      note: 'First deposit',
    });
    expect(withContrib.currentSaved).toBe(10000);
    expect(withContrib.percentage).toBe(20);
  });
});
