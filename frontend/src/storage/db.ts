import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Category, Expense, Budget, RecurringTemplate, SavingsGoal } from '../types';

export const DB_NAME = 'runway-db';
export const DB_VERSION = 1;

export interface RunwayDBSchema extends DBSchema {
  expenses: {
    key: string;
    value: Expense;
    indexes: {
      'by-occurredAt': string;
      'by-categoryId': string;
      'by-createdAt': string;
    };
  };
  categories: {
    key: string;
    value: Category;
    indexes: {
      'by-name': string;
    };
  };
  budgets: {
    key: string;
    value: Budget;
    indexes: {
      'by-periodMonth': string;
    };
  };
  recurringExpenses: {
    key: string;
    value: RecurringTemplate;
    indexes: {
      'by-nextDueDate': string;
    };
  };
  savingsGoals: {
    key: string;
    value: SavingsGoal;
    indexes: {
      'by-name': string;
    };
  };
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Dining & Food', color: '#8B5CF6' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Groceries', color: '#10B981' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Housing & Rent', color: '#3B82F6' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Utilities', color: '#F59E0B' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Transportation', color: '#14B8A6' },
  { id: '66666666-6666-6666-6666-666666666666', name: 'Subscriptions', color: '#6366F1' },
  { id: '77777777-7777-7777-7777-777777777777', name: 'Entertainment', color: '#EC4899' },
  { id: '88888888-8888-8888-8888-888888888888', name: 'Personal & Health', color: '#64748B' },
];

export class StorageError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

let dbPromise: Promise<IDBPDatabase<RunwayDBSchema>> | null = null;

export const getDB = (): Promise<IDBPDatabase<RunwayDBSchema>> => {
  if (!dbPromise) {
    dbPromise = openDB<RunwayDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Object store: expenses
        if (!db.objectStoreNames.contains('expenses')) {
          const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
          expenseStore.createIndex('by-occurredAt', 'occurredAt');
          expenseStore.createIndex('by-categoryId', 'category.id');
          expenseStore.createIndex('by-createdAt', 'createdAt');
        }

        // Object store: categories
        if (!db.objectStoreNames.contains('categories')) {
          const categoryStore = db.createObjectStore('categories', { keyPath: 'id' });
          categoryStore.createIndex('by-name', 'name');

          // Seed default categories on initial store creation
          for (const category of DEFAULT_CATEGORIES) {
            categoryStore.put(category);
          }
        }

        // Object store: budgets
        if (!db.objectStoreNames.contains('budgets')) {
          const budgetStore = db.createObjectStore('budgets', { keyPath: 'id' });
          budgetStore.createIndex('by-periodMonth', 'periodMonth');
        }

        // Object store: recurringExpenses
        if (!db.objectStoreNames.contains('recurringExpenses')) {
          const recurringStore = db.createObjectStore('recurringExpenses', { keyPath: 'id' });
          recurringStore.createIndex('by-nextDueDate', 'nextDueDate');
        }

        // Object store: savingsGoals
        if (!db.objectStoreNames.contains('savingsGoals')) {
          const goalStore = db.createObjectStore('savingsGoals', { keyPath: 'id' });
          goalStore.createIndex('by-name', 'name');
        }
      },
    }).catch((err) => {
      dbPromise = null;
      throw new StorageError('Failed to initialize local IndexedDB database (runway-db)', err);
    });
  }
  return dbPromise;
};

export const closeDB = async (): Promise<void> => {
  if (dbPromise) {
    try {
      const db = await dbPromise;
      db.close();
    } catch {
      // Ignore close errors
    } finally {
      dbPromise = null;
    }
  }
};

/**
  * Idempotent check to ensure default categories exist in case db was opened without upgrade
  */
export const seedDefaultCategoriesIfEmpty = async (): Promise<void> => {
  try {
    const db = await getDB();
    const existing = await db.getAll('categories');
    if (existing.length === 0) {
      const tx = db.transaction('categories', 'readwrite');
      for (const cat of DEFAULT_CATEGORIES) {
        await tx.store.put(cat);
      }
      await tx.done;
    }
  } catch (err) {
    throw new StorageError('Failed to seed default categories into local database', err);
  }
};
