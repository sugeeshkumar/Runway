import { getDB, StorageError } from './db';
import { Expense } from '../types';

export type CreateExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'userId'> & {
  id?: string;
  userId?: string;
  createdAt?: string;
};

export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const db = await getDB();
    const expenses = await db.getAll('expenses');
    // Return sorted by occurredAt descending (most recent first)
    return expenses.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  } catch (err) {
    throw new StorageError('Failed to fetch expenses from local storage', err);
  }
};

export const getExpense = async (id: string): Promise<Expense | undefined> => {
  try {
    const db = await getDB();
    return await db.get('expenses', id);
  } catch (err) {
    throw new StorageError(`Failed to fetch expense with ID "${id}" from local storage`, err);
  }
};

export const createExpense = async (input: CreateExpenseInput): Promise<Expense> => {
  try {
    const db = await getDB();
    const now = new Date().toISOString();
    const expense: Expense = {
      ...input,
      id: input.id || crypto.randomUUID(),
      userId: input.userId || 'local-user',
      createdAt: input.createdAt || now,
    };
    await db.put('expenses', expense);
    return expense;
  } catch (err) {
    throw new StorageError('Failed to create expense in local storage', err);
  }
};

export const updateExpense = async (id: string, updates: Partial<Expense>): Promise<Expense> => {
  try {
    const db = await getDB();
    const existing = await db.get('expenses', id);
    if (!existing) {
      throw new Error(`Expense with ID "${id}" does not exist`);
    }
    const updated: Expense = {
      ...existing,
      ...updates,
      id, // Preserve ID
      updatedAt: new Date().toISOString(),
    };
    await db.put('expenses', updated);
    return updated;
  } catch (err) {
    throw new StorageError(`Failed to update expense with ID "${id}" in local storage`, err);
  }
};

export const deleteExpense = async (id: string): Promise<void> => {
  try {
    const db = await getDB();
    await db.delete('expenses', id);
  } catch (err) {
    throw new StorageError(`Failed to delete expense with ID "${id}" from local storage`, err);
  }
};
