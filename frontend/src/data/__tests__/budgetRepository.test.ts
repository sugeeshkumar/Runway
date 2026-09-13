import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import * as budgetRepository from '../budgetRepository';
import * as expenseRepository from '../expenseRepository';
import * as categoryRepository from '../categoryRepository';
import { closeDB } from '../../storage/db';

describe('Budget Repository (IndexedDB Budget Migration)', () => {
  beforeEach(async () => {
    await closeDB();
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  });

  it('1. Create budget -> saved to IndexedDB', async () => {
    const periodMonth = '2026-09';
    const created = await budgetRepository.createBudget({
      amount: 50000,
      periodMonth,
    });

    expect(created.id).toBeDefined();
    expect(created.amount).toBe(50000);
    expect(created.periodMonth).toBe(periodMonth);

    const list = await budgetRepository.getBudgets(periodMonth);
    expect(list.find((b) => b.id === created.id)).toBeDefined();
  });

  it('2. Read budgets -> dynamic spent & remaining amounts calculated with local expenses', async () => {
    const periodMonth = '2026-09';
    const categories = await categoryRepository.getCategories();
    const diningCat = categories[0];

    // Create overall budget & category budget
    await budgetRepository.createBudget({
      amount: 10000,
      periodMonth,
    });
    await budgetRepository.createBudget({
      amount: 3000,
      categoryId: diningCat.id,
      periodMonth,
    });

    // Create local expense in Dining
    await expenseRepository.createExpense({
      amount: 1200,
      currency: 'INR',
      categoryId: diningCat.id,
      description: 'Dinner',
      occurredAt: '2026-09-10T12:00:00.000Z',
      source: 'MANUAL',
    });

    const list = await budgetRepository.getBudgets(periodMonth);
    expect(list).toHaveLength(2);

    const overall = list.find((b) => !b.category);
    expect(overall?.spentAmount).toBe(1200);
    expect(overall?.remainingAmount).toBe(8800);
    expect(overall?.status).toBe('SAFE');

    const catBudget = list.find((b) => b.category?.id === diningCat.id);
    expect(catBudget?.spentAmount).toBe(1200);
    expect(catBudget?.remainingAmount).toBe(1800);
    expect(catBudget?.status).toBe('SAFE');
  });

  it('3. Update budget -> updates limit amount in IndexedDB', async () => {
    const periodMonth = '2026-09';
    const created = await budgetRepository.createBudget({
      amount: 5000,
      periodMonth,
    });

    const updated = await budgetRepository.updateBudget(created.id, {
      amount: 8000,
    });

    expect(updated.amount).toBe(8000);

    const fromStore = await budgetRepository.getBudget(created.id);
    expect(fromStore?.amount).toBe(8000);
  });

  it('4. Delete budget -> record removed from IndexedDB', async () => {
    const periodMonth = '2026-09';
    const created = await budgetRepository.createBudget({
      amount: 5000,
      periodMonth,
    });

    await budgetRepository.deleteBudget(created.id);

    const list = await budgetRepository.getBudgets(periodMonth);
    expect(list.find((b) => b.id === created.id)).toBeUndefined();
  });

  it('5. Budget survives re-query / reload simulation', async () => {
    const periodMonth = '2026-10';
    const created = await budgetRepository.createBudget({
      amount: 15000,
      periodMonth,
    });

    const fetchedAgain = await budgetRepository.getBudget(created.id);
    expect(fetchedAgain?.id).toBe(created.id);
    expect(fetchedAgain?.amount).toBe(15000);
  });

  it('6. Correct month lookup filtering', async () => {
    await budgetRepository.createBudget({
      amount: 10000,
      periodMonth: '2026-09',
    });
    await budgetRepository.createBudget({
      amount: 12000,
      periodMonth: '2026-10',
    });

    const sepBudgets = await budgetRepository.getBudgets('2026-09');
    expect(sepBudgets).toHaveLength(1);
    expect(sepBudgets[0].amount).toBe(10000);

    const octBudgets = await budgetRepository.getBudgets('2026-10');
    expect(octBudgets).toHaveLength(1);
    expect(octBudgets[0].amount).toBe(12000);
  });
});
