import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import * as savingsGoalRepository from '../savingsGoalRepository';
import { closeDB } from '../../storage/db';

describe('Savings Goal Repository (IndexedDB Savings Goal Migration)', () => {
  beforeEach(async () => {
    await closeDB();
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  });

  it('1. Create savings goal -> saved to IndexedDB', async () => {
    const created = await savingsGoalRepository.createSavingsGoal({
      name: 'Emergency Reserve',
      targetAmount: 100000,
      currency: 'INR',
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Emergency Reserve');
    expect(created.targetAmount).toBe(100000);
    expect(created.currentSaved).toBe(0);
    expect(created.percentage).toBe(0);

    const list = await savingsGoalRepository.getSavingsGoals();
    expect(list.find((g) => g.id === created.id)).toBeDefined();
  });

  it('2. Read savings goal & calculate contributions progress', async () => {
    const created = await savingsGoalRepository.createSavingsGoal({
      name: 'Macbook M3',
      targetAmount: 150000,
      currency: 'INR',
    });

    await savingsGoalRepository.addContribution(created.id, {
      amount: 30000,
      note: 'Initial deposit',
    });
    await savingsGoalRepository.addContribution(created.id, {
      amount: 45000,
      note: 'Bonus deposit',
    });

    const updatedGoal = await savingsGoalRepository.getSavingsGoal(created.id);
    expect(updatedGoal?.currentSaved).toBe(75000);
    expect(updatedGoal?.percentage).toBe(50);
    expect(updatedGoal?.contributionsCount).toBe(2);
  });

  it('3. Update savings goal details', async () => {
    const created = await savingsGoalRepository.createSavingsGoal({
      name: 'Japan Vacation',
      targetAmount: 200000,
      currency: 'INR',
    });

    const updated = await savingsGoalRepository.updateSavingsGoal(created.id, {
      name: 'Tokyo & Kyoto Vacation',
      targetAmount: 250000,
    });

    expect(updated.name).toBe('Tokyo & Kyoto Vacation');
    expect(updated.targetAmount).toBe(250000);

    const reFetched = await savingsGoalRepository.getSavingsGoal(created.id);
    expect(reFetched?.name).toBe('Tokyo & Kyoto Vacation');
  });

  it('4. Delete contribution -> recalculates saved total and progress', async () => {
    const created = await savingsGoalRepository.createSavingsGoal({
      name: 'Car Down Payment',
      targetAmount: 100000,
      currency: 'INR',
    });

    const goalWithContrib1 = await savingsGoalRepository.addContribution(created.id, {
      amount: 20000,
      note: 'Deposit 1',
    });
    const goalWithContrib2 = await savingsGoalRepository.addContribution(created.id, {
      amount: 30000,
      note: 'Deposit 2',
    });

    expect(goalWithContrib2.currentSaved).toBe(50000);

    const contribToDelete = goalWithContrib2.contributions[0];
    const afterDelete = await savingsGoalRepository.deleteContribution(created.id, contribToDelete.id);

    expect(afterDelete.currentSaved).toBe(30000);
    expect(afterDelete.contributionsCount).toBe(1);
    expect(afterDelete.percentage).toBe(30);
  });

  it('5. Delete savings goal -> removed from IndexedDB', async () => {
    const created = await savingsGoalRepository.createSavingsGoal({
      name: 'Temp Goal',
      targetAmount: 5000,
    });

    await savingsGoalRepository.deleteSavingsGoal(created.id);

    const list = await savingsGoalRepository.getSavingsGoals();
    expect(list.find((g) => g.id === created.id)).toBeUndefined();
  });

  it('6. Savings goal & contributions survive reload simulation', async () => {
    const created = await savingsGoalRepository.createSavingsGoal({
      name: 'Home Renovation',
      targetAmount: 500000,
      currency: 'INR',
    });

    await savingsGoalRepository.addContribution(created.id, {
      amount: 100000,
      note: 'Architect payment reserve',
    });

    const list = await savingsGoalRepository.getSavingsGoals();
    const target = list.find((g) => g.id === created.id);
    expect(target).toBeDefined();
    expect(target?.currentSaved).toBe(100000);
    expect(target?.contributions).toHaveLength(1);
  });
});
