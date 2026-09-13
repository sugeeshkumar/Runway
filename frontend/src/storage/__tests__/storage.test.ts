import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getRecurringExpenses,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  DEFAULT_CATEGORIES,
} from '../index';

import { closeDB } from '../db';

describe('Local IndexedDB Storage Layer (runway-db)', () => {
  beforeEach(async () => {
    await closeDB();
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  });

  describe('Default Category Seeding & Idempotency', () => {
    it('seeds 8 default categories on first database access', async () => {
      const categories = await getCategories();
      expect(categories).toHaveLength(8);
      expect(categories.map((c) => c.name)).toContain('Dining & Food');
      expect(categories.map((c) => c.name)).toContain('Transportation');
    });

    it('does not duplicate default categories on subsequent calls', async () => {
      await getCategories();
      await getCategories();
      const categories = await getCategories();
      expect(categories).toHaveLength(8);
    });
  });

  describe('Category Store CRUD', () => {
    it('creates, retrieves, updates, and deletes a category', async () => {
      const newCat = await createCategory({
        name: 'Hobbies & Crafts',
        color: '#FF5733',
      });
      expect(newCat.id).toBeDefined();
      expect(newCat.name).toBe('Hobbies & Crafts');

      let all = await getCategories();
      expect(all).toHaveLength(9);

      const updated = await updateCategory(newCat.id, { color: '#C85A32' });
      expect(updated.color).toBe('#C85A32');

      await deleteCategory(newCat.id);
      all = await getCategories();
      expect(all).toHaveLength(8);
      expect(all.find((c) => c.id === newCat.id)).toBeUndefined();
    });
  });

  describe('Expense Store CRUD', () => {
    it('creates, retrieves, updates, and deletes an expense record', async () => {
      const categories = await getCategories();
      const diningCat = categories.find((c) => c.name === 'Dining & Food')!;

      const created = await createExpense({
        amount: 450,
        currency: 'INR',
        category: diningCat,
        merchant: 'Zaitoon Restaurant',
        description: 'Dinner with team',
        occurredAt: '2026-09-13T19:30:00.000Z',
        source: 'MANUAL',
      });

      expect(created.id).toBeDefined();
      expect(created.amount).toBe(450);
      expect(created.merchant).toBe('Zaitoon Restaurant');

      let expenses = await getExpenses();
      expect(expenses).toHaveLength(1);
      expect(expenses[0].id).toBe(created.id);

      const updated = await updateExpense(created.id, { amount: 520, merchant: 'Zaitoon Grand' });
      expect(updated.amount).toBe(520);
      expect(updated.merchant).toBe('Zaitoon Grand');

      expenses = await getExpenses();
      expect(expenses[0].amount).toBe(520);

      await deleteExpense(created.id);
      expenses = await getExpenses();
      expect(expenses).toHaveLength(0);
    });
  });

  describe('Budget Store CRUD', () => {
    it('creates, retrieves, updates, and deletes a monthly budget', async () => {
      const budget = await createBudget({
        userId: 'local-user',
        periodMonth: '2026-09',
        amount: 25000,
        spentAmount: 5000,
        remainingAmount: 20000,
        status: 'SAFE',
      });

      expect(budget.id).toBeDefined();
      expect(budget.amount).toBe(25000);

      let budgets = await getBudgets();
      expect(budgets).toHaveLength(1);

      const updated = await updateBudget(budget.id, { amount: 30000, remainingAmount: 25000 });
      expect(updated.amount).toBe(30000);

      await deleteBudget(budget.id);
      budgets = await getBudgets();
      expect(budgets).toHaveLength(0);
    });
  });

  describe('Recurring Expense Store CRUD', () => {
    it('creates, retrieves, updates, and deletes a recurring expense template', async () => {
      const categories = await getCategories();
      const subCat = categories.find((c) => c.name === 'Subscriptions')!;

      const recurring = await createRecurringExpense({
        amount: 199,
        currency: 'INR',
        category: subCat,
        cadence: 'MONTHLY',
        nextDueDate: '2026-10-01',
        description: 'Music Streaming',
        isPaused: false,
      });

      expect(recurring.id).toBeDefined();
      expect(recurring.description).toBe('Music Streaming');

      let list = await getRecurringExpenses();
      expect(list).toHaveLength(1);

      const updated = await updateRecurringExpense(recurring.id, { isPaused: true });
      expect(updated.isPaused).toBe(true);

      await deleteRecurringExpense(recurring.id);
      list = await getRecurringExpenses();
      expect(list).toHaveLength(0);
    });
  });

  describe('Savings Goal Store CRUD', () => {
    it('creates, calculates percentage, updates contributions, and deletes a savings goal', async () => {
      const goal = await createSavingsGoal({
        userId: 'local-user',
        name: 'Emergency Fund',
        targetAmount: 100000,
        currency: 'INR',
        currentSaved: 20000,
        contributions: [
          {
            id: 'contrib-1',
            goalId: '',
            amount: 20000,
            occurredAt: '2026-09-01T10:00:00.000Z',
            createdAt: '2026-09-01T10:00:00.000Z',
          },
        ],
      });

      expect(goal.id).toBeDefined();
      expect(goal.percentage).toBe(20);
      expect(goal.contributionsCount).toBe(1);

      let goals = await getSavingsGoals();
      expect(goals).toHaveLength(1);

      const updated = await updateSavingsGoal(goal.id, { currentSaved: 50000 });
      expect(updated.percentage).toBe(50);

      await deleteSavingsGoal(goal.id);
      goals = await getSavingsGoals();
      expect(goals).toHaveLength(0);
    });
  });
});
