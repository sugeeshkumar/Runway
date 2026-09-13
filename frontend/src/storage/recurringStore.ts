import { getDB, StorageError } from './db';
import { RecurringTemplate } from '../types';

export type CreateRecurringInput = Omit<RecurringTemplate, 'id' | 'userId'> & {
  id?: string;
  userId?: string;
};

export const getRecurringExpenses = async (): Promise<RecurringTemplate[]> => {
  try {
    const db = await getDB();
    return await db.getAll('recurringExpenses');
  } catch (err) {
    throw new StorageError('Failed to fetch recurring expenses from local storage', err);
  }
};

export const getRecurringExpense = async (id: string): Promise<RecurringTemplate | undefined> => {
  try {
    const db = await getDB();
    return await db.get('recurringExpenses', id);
  } catch (err) {
    throw new StorageError(`Failed to fetch recurring expense with ID "${id}" from local storage`, err);
  }
};

export const createRecurringExpense = async (input: CreateRecurringInput): Promise<RecurringTemplate> => {
  try {
    const db = await getDB();
    const recurring: RecurringTemplate = {
      ...input,
      id: input.id || crypto.randomUUID(),
      userId: input.userId || 'local-user',
    };
    await db.put('recurringExpenses', recurring);
    return recurring;
  } catch (err) {
    throw new StorageError('Failed to create recurring expense in local storage', err);
  }
};

export const updateRecurringExpense = async (id: string, updates: Partial<RecurringTemplate>): Promise<RecurringTemplate> => {
  try {
    const db = await getDB();
    const existing = await db.get('recurringExpenses', id);
    if (!existing) {
      throw new Error(`Recurring expense with ID "${id}" does not exist`);
    }
    const updated: RecurringTemplate = {
      ...existing,
      ...updates,
      id,
    };
    await db.put('recurringExpenses', updated);
    return updated;
  } catch (err) {
    throw new StorageError(`Failed to update recurring expense with ID "${id}" in local storage`, err);
  }
};

export const deleteRecurringExpense = async (id: string): Promise<void> => {
  try {
    const db = await getDB();
    await db.delete('recurringExpenses', id);
  } catch (err) {
    throw new StorageError(`Failed to delete recurring expense with ID "${id}" from local storage`, err);
  }
};
