import { getDB, StorageError } from './db';
import { SavingsGoal } from '../types';

export type CreateSavingsGoalInput = Omit<SavingsGoal, 'id' | 'userId' | 'createdAt' | 'contributionsCount' | 'percentage'> & {
  id?: string;
  userId?: string;
  createdAt?: string;
};

export const getSavingsGoals = async (): Promise<SavingsGoal[]> => {
  try {
    const db = await getDB();
    return await db.getAll('savingsGoals');
  } catch (err) {
    throw new StorageError('Failed to fetch savings goals from local storage', err);
  }
};

export const getSavingsGoal = async (id: string): Promise<SavingsGoal | undefined> => {
  try {
    const db = await getDB();
    return await db.get('savingsGoals', id);
  } catch (err) {
    throw new StorageError(`Failed to fetch savings goal with ID "${id}" from local storage`, err);
  }
};

export const createSavingsGoal = async (input: CreateSavingsGoalInput): Promise<SavingsGoal> => {
  try {
    const db = await getDB();
    const contributions = input.contributions || [];
    const currentSaved = input.currentSaved || contributions.reduce((sum, c) => sum + c.amount, 0);
    const percentage = input.targetAmount > 0 ? Math.min(100, Math.round((currentSaved / input.targetAmount) * 100)) : 0;
    
    const goal: SavingsGoal = {
      ...input,
      id: input.id || crypto.randomUUID(),
      userId: input.userId || 'local-user',
      currentSaved,
      percentage,
      contributionsCount: contributions.length,
      contributions,
      createdAt: input.createdAt || new Date().toISOString(),
    };
    await db.put('savingsGoals', goal);
    return goal;
  } catch (err) {
    throw new StorageError('Failed to create savings goal in local storage', err);
  }
};

export const updateSavingsGoal = async (id: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal> => {
  try {
    const db = await getDB();
    const existing = await db.get('savingsGoals', id);
    if (!existing) {
      throw new Error(`Savings goal with ID "${id}" does not exist`);
    }
    
    const contributions = updates.contributions !== undefined ? updates.contributions : existing.contributions;
    const currentSaved = updates.currentSaved !== undefined ? updates.currentSaved : existing.currentSaved;
    const targetAmount = updates.targetAmount !== undefined ? updates.targetAmount : existing.targetAmount;
    const percentage = targetAmount > 0 ? Math.min(100, Math.round((currentSaved / targetAmount) * 100)) : 0;

    const updated: SavingsGoal = {
      ...existing,
      ...updates,
      id,
      contributions,
      currentSaved,
      percentage,
      contributionsCount: contributions.length,
    };
    await db.put('savingsGoals', updated);
    return updated;
  } catch (err) {
    throw new StorageError(`Failed to update savings goal with ID "${id}" in local storage`, err);
  }
};

export const deleteSavingsGoal = async (id: string): Promise<void> => {
  try {
    const db = await getDB();
    await db.delete('savingsGoals', id);
  } catch (err) {
    throw new StorageError(`Failed to delete savings goal with ID "${id}" from local storage`, err);
  }
};
