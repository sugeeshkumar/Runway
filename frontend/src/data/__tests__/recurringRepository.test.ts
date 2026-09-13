import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import * as recurringRepository from '../recurringRepository';
import * as expenseRepository from '../expenseRepository';
import * as categoryRepository from '../categoryRepository';
import { closeDB } from '../../storage/db';

describe('Recurring Repository (IndexedDB Recurring Migration)', () => {
  beforeEach(async () => {
    await closeDB();
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  });

  it('1. Create recurring template -> saved to IndexedDB', async () => {
    const categories = await categoryRepository.getCategories();
    const created = await recurringRepository.createRecurringExpense({
      description: 'Netflix Subscription',
      categoryId: categories[0].id,
      amount: 649,
      currency: 'INR',
      cadence: 'MONTHLY',
      nextDueDate: '2026-09-15',
    });

    expect(created.id).toBeDefined();
    expect(created.description).toBe('Netflix Subscription');
    expect(created.amount).toBe(649);
    expect(created.isPaused).toBe(false);

    const list = await recurringRepository.getRecurringExpenses();
    expect(list.find((t) => t.id === created.id)).toBeDefined();
  });

  it('2. Read recurring templates & compute committed monthly summary', async () => {
    const categories = await categoryRepository.getCategories();
    await recurringRepository.createRecurringExpense({
      description: 'Rent',
      categoryId: categories[0].id,
      amount: 20000,
      currency: 'INR',
      cadence: 'MONTHLY',
      nextDueDate: '2026-09-01',
    });
    await recurringRepository.createRecurringExpense({
      description: 'Gym',
      categoryId: categories[1].id,
      amount: 1500,
      currency: 'INR',
      cadence: 'MONTHLY',
      nextDueDate: '2026-09-05',
    });

    const summary = await recurringRepository.getCommittedSummary('INR', 100000);
    expect(summary.totalCommittedMonthly).toBe(21500);
    expect(summary.committedPercentage).toBe(21.5);
    expect(summary.templateCount).toBe(2);
  });

  it('3. Update recurring template & pause state', async () => {
    const categories = await categoryRepository.getCategories();
    const created = await recurringRepository.createRecurringExpense({
      description: 'Spotify',
      categoryId: categories[0].id,
      amount: 119,
      currency: 'INR',
      cadence: 'MONTHLY',
      nextDueDate: '2026-09-20',
    });

    const updated = await recurringRepository.updateRecurringExpense(created.id, {
      amount: 149,
    });
    expect(updated.amount).toBe(149);

    const paused = await recurringRepository.togglePauseRecurringExpense(created.id, true);
    expect(paused.isPaused).toBe(true);

    const summary = await recurringRepository.getCommittedSummary('INR');
    expect(summary.templateCount).toBe(0); // paused template excluded from committed total
  });

  it('4. Delete recurring template', async () => {
    const categories = await categoryRepository.getCategories();
    const created = await recurringRepository.createRecurringExpense({
      description: 'iCloud Storage',
      categoryId: categories[0].id,
      amount: 75,
      currency: 'INR',
      cadence: 'MONTHLY',
      nextDueDate: '2026-09-10',
    });

    await recurringRepository.deleteRecurringExpense(created.id);
    const list = await recurringRepository.getRecurringExpenses();
    expect(list.find((t) => t.id === created.id)).toBeUndefined();
  });

  it('5. Template survives reload simulation', async () => {
    const categories = await categoryRepository.getCategories();
    const created = await recurringRepository.createRecurringExpense({
      description: 'Internet Bill',
      categoryId: categories[0].id,
      amount: 999,
      currency: 'INR',
      cadence: 'MONTHLY',
      nextDueDate: '2026-09-01',
    });

    const fetchedAgain = await recurringRepository.getRecurringExpense(created.id);
    expect(fetchedAgain?.id).toBe(created.id);
    expect(fetchedAgain?.description).toBe('Internet Bill');
  });

  it('6. processDueRecurringExpenses is idempotent and creates due expenses', async () => {
    const categories = await categoryRepository.getCategories();
    await recurringRepository.createRecurringExpense({
      description: 'Newspaper',
      categoryId: categories[0].id,
      amount: 300,
      currency: 'INR',
      cadence: 'MONTHLY',
      nextDueDate: new Date().toISOString().split('T')[0],
    });

    // Run 1: process due expense
    const res1 = await recurringRepository.processDueRecurringExpenses();
    expect(res1.generatedCount).toBe(1);

    const expensesAfterRun1 = await expenseRepository.getExpenses();
    expect(expensesAfterRun1).toHaveLength(1);
    expect(expensesAfterRun1[0].description).toBe('Newspaper');
    expect(expensesAfterRun1[0].source).toBe('RECURRING');

    // Run 2: idempotent check (should NOT create duplicate expense)
    const res2 = await recurringRepository.processDueRecurringExpenses();
    expect(res2.generatedCount).toBe(0);

    const expensesAfterRun2 = await expenseRepository.getExpenses();
    expect(expensesAfterRun2).toHaveLength(1);
  });
});
