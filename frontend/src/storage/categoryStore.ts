import { getDB, StorageError, DEFAULT_CATEGORIES } from './db';
import { Category } from '../types';

export const getCategories = async (): Promise<Category[]> => {
  try {
    const db = await getDB();
    const categories = await db.getAll('categories');
    if (categories.length === 0) {
      // Lazy seed default categories if empty
      const tx = db.transaction('categories', 'readwrite');
      for (const cat of DEFAULT_CATEGORIES) {
        await tx.store.put(cat);
      }
      await tx.done;
      return await db.getAll('categories');
    }
    return categories;
  } catch (err) {
    throw new StorageError('Failed to fetch categories from local storage', err);
  }
};

export const getCategory = async (id: string): Promise<Category | undefined> => {
  try {
    const db = await getDB();
    return await db.get('categories', id);
  } catch (err) {
    throw new StorageError(`Failed to fetch category with ID "${id}" from local storage`, err);
  }
};

export const createCategory = async (categoryData: Omit<Category, 'id'> & { id?: string }): Promise<Category> => {
  try {
    const db = await getDB();
    const category: Category = {
      ...categoryData,
      id: categoryData.id || crypto.randomUUID(),
    };
    await db.put('categories', category);
    return category;
  } catch (err) {
    throw new StorageError('Failed to create category in local storage', err);
  }
};

export const updateCategory = async (id: string, categoryData: Partial<Category>): Promise<Category> => {
  try {
    const db = await getDB();
    const existing = await db.get('categories', id);
    if (!existing) {
      throw new Error(`Category with ID "${id}" does not exist`);
    }
    const updated: Category = {
      ...existing,
      ...categoryData,
      id, // Preserve ID
    };
    await db.put('categories', updated);
    return updated;
  } catch (err) {
    throw new StorageError(`Failed to update category with ID "${id}" in local storage`, err);
  }
};

export const deleteCategory = async (id: string): Promise<void> => {
  try {
    const db = await getDB();
    await db.delete('categories', id);
  } catch (err) {
    throw new StorageError(`Failed to delete category with ID "${id}" from local storage`, err);
  }
};
