import { getDB, StorageError } from './db';
import { Budget } from '../types';

export type CreateBudgetInput = Omit<Budget, 'id' | 'userId'> & {
  id?: string;
  userId?: string;
};

export const getBudgets = async (): Promise<Budget[]> => {
  try {
    const db = await getDB();
    return await db.getAll('budgets');
  } catch (err) {
    throw new StorageError('Failed to fetch budgets from local storage', err);
  }
};

export const getBudget = async (id: string): Promise<Budget | undefined> => {
  try {
    const db = await getDB();
    return await db.get('budgets', id);
  } catch (err) {
    throw new StorageError(`Failed to fetch budget with ID "${id}" from local storage`, err);
  }
};

export const createBudget = async (input: CreateBudgetInput): Promise<Budget> => {
  try {
    const db = await getDB();
    const budget: Budget = {
      ...input,
      id: input.id || crypto.randomUUID(),
      userId: input.userId || 'local-user',
    };
    await db.put('budgets', budget);
    return budget;
  } catch (err) {
    throw new StorageError('Failed to create budget in local storage', err);
  }
};

export const updateBudget = async (id: string, updates: Partial<Budget>): Promise<Budget> => {
  try {
    const db = await getDB();
    const existing = await db.get('budgets', id);
    if (!existing) {
      throw new Error(`Budget with ID "${id}" does not exist`);
    }
    const updated: Budget = {
      ...existing,
      ...updates,
      id,
    };
    await db.put('budgets', updated);
    return updated;
  } catch (err) {
    throw new StorageError(`Failed to update budget with ID "${id}" in local storage`, err);
  }
};

export const deleteBudget = async (id: string): Promise<void> => {
  try {
    const db = await getDB();
    await db.delete('budgets', id);
  } catch (err) {
    throw new StorageError(`Failed to delete budget with ID "${id}" from local storage`, err);
  }
};
