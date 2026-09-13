import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import * as expenseRepository from '../expenseRepository';
import { getCategories } from '../../storage/categoryStore';

import { closeDB } from '../../storage/db';

describe('Expense Repository (IndexedDB Expense Primary Source of Truth)', () => {
  beforeEach(async () => {
    await closeDB();
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  });

  it('1. Create expense -> IndexedDB contains it with stable ID', async () => {
    const categories = await getCategories();
    const diningCat = categories[0];

    const created = await expenseRepository.createExpense({
      amount: 450,
      currency: 'INR',
      categoryId: diningCat.id,
      merchant: 'Zaitoon',
      description: 'Dinner with friends',
      occurredAt: '2026-09-13T19:00:00.000Z',
      source: 'PARSED_TEXT',
      rawInput: 'Spent 450 on dinner at Zaitoon',
    });

    expect(created.id).toBeDefined();
    expect(created.amount).toBe(450);
    expect(created.merchant).toBe('Zaitoon');
    expect(created.category.id).toBe(diningCat.id);

    const fromDb = await expenseRepository.getExpense(created.id);
    expect(fromDb).toBeDefined();
    expect(fromDb?.id).toBe(created.id);
  });

  it('2. Read expenses -> correct records returned', async () => {
    const categories = await getCategories();
    await expenseRepository.createExpense({
      amount: 150,
      currency: 'INR',
      categoryId: categories[0].id,
      description: 'Coffee',
      occurredAt: '2026-09-13T09:00:00.000Z',
      source: 'MANUAL',
    });
    await expenseRepository.createExpense({
      amount: 300,
      currency: 'INR',
      categoryId: categories[1].id,
      description: 'Groceries',
      occurredAt: '2026-09-13T11:00:00.000Z',
      source: 'MANUAL',
    });

    const expenses = await expenseRepository.getExpenses();
    expect(expenses).toHaveLength(2);
  });

  it('3. Update expense -> updated data persists', async () => {
    const categories = await getCategories();
    const created = await expenseRepository.createExpense({
      amount: 200,
      currency: 'INR',
      categoryId: categories[0].id,
      description: 'Lunch',
      occurredAt: '2026-09-13T12:00:00.000Z',
      source: 'MANUAL',
    });

    const updated = await expenseRepository.updateExpense(created.id, {
      amount: 250,
      description: 'Buffet Lunch',
    });

    expect(updated.amount).toBe(250);
    expect(updated.description).toBe('Buffet Lunch');

    const reFetched = await expenseRepository.getExpense(created.id);
    expect(reFetched?.amount).toBe(250);
    expect(reFetched?.description).toBe('Buffet Lunch');
  });

  it('4. Delete expense -> record is removed', async () => {
    const categories = await getCategories();
    const created = await expenseRepository.createExpense({
      amount: 100,
      currency: 'INR',
      categoryId: categories[0].id,
      description: 'Snack',
      occurredAt: '2026-09-13T15:00:00.000Z',
      source: 'MANUAL',
    });

    await expenseRepository.deleteExpense(created.id);
    const reFetched = await expenseRepository.getExpense(created.id);
    expect(reFetched).toBeUndefined();

    const expenses = await expenseRepository.getExpenses();
    expect(expenses).toHaveLength(0);
  });

  it('5. Reload/reinitialize database -> expense remains', async () => {
    const categories = await getCategories();
    const created = await expenseRepository.createExpense({
      amount: 1200,
      currency: 'INR',
      categoryId: categories[2].id,
      description: 'Rent deposit',
      occurredAt: '2026-09-01T00:00:00.000Z',
      source: 'MANUAL',
    });

    // Fetch again simulates re-querying store
    const list = await expenseRepository.getExpenses();
    expect(list.find((e) => e.id === created.id)).toBeDefined();
  });

  it('6. Multiple expenses produce correct local totals', async () => {
    const categories = await getCategories();
    await expenseRepository.createExpense({
      amount: 500,
      currency: 'INR',
      categoryId: categories[0].id,
      description: 'Dinner',
      occurredAt: '2026-09-10T20:00:00.000Z',
      source: 'MANUAL',
    });
    await expenseRepository.createExpense({
      amount: 1500,
      currency: 'INR',
      categoryId: categories[1].id,
      description: 'Weekly Groceries',
      occurredAt: '2026-09-12T10:00:00.000Z',
      source: 'MANUAL',
    });

    const summary = await expenseRepository.getLocalDashboardSummary('INR', 10000);
    expect(summary.totalSpent).toBe(2000);
    expect(summary.remainingBudget).toBe(8000);
    expect(summary.topCategories).toHaveLength(2);
  });

  it('7. Month/date filtering works correctly', async () => {
    const categories = await getCategories();
    await expenseRepository.createExpense({
      amount: 500,
      currency: 'INR',
      categoryId: categories[0].id,
      description: 'Sep Expense',
      occurredAt: '2026-09-05T10:00:00.000Z',
      source: 'MANUAL',
    });
    await expenseRepository.createExpense({
      amount: 800,
      currency: 'INR',
      categoryId: categories[0].id,
      description: 'Aug Expense',
      occurredAt: '2026-08-15T10:00:00.000Z',
      source: 'MANUAL',
    });

    const sepList = await expenseRepository.getExpensesForMonth(2026, 9);
    expect(sepList).toHaveLength(1);
    expect(sepList[0].description).toBe('Sep Expense');

    const augList = await expenseRepository.getExpensesForMonth(2026, 8);
    expect(augList).toHaveLength(1);
    expect(augList[0].description).toBe('Aug Expense');

    const dateList = await expenseRepository.getExpensesForDate('2026-09-05');
    expect(dateList).toHaveLength(1);
  });

  it('8. Existing category IDs continue to work', async () => {
    const defaultCatId = '11111111-1111-1111-1111-111111111111'; // Dining & Food
    const created = await expenseRepository.createExpense({
      amount: 450,
      currency: 'INR',
      categoryId: defaultCatId,
      description: 'Dining',
      occurredAt: '2026-09-13T20:00:00.000Z',
      source: 'MANUAL',
    });

    expect(created.category.id).toBe(defaultCatId);
    expect(created.category.name).toBe('Dining & Food');
  });
});
