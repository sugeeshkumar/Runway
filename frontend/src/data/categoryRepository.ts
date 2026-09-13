import {
  getCategories as getCategoriesFromStore,
  getCategory as getCategoryFromStore,
  createCategory as createCategoryInStore,
  updateCategory as updateCategoryInStore,
  deleteCategory as deleteCategoryInStore,
} from '../storage';
import { Category } from '../types';
import * as expenseRepository from './expenseRepository';

/**
 * Clean frontend category repository providing local IndexedDB data access,
 * category creation/updates, deletion with local expense reassignment, and NLP category resolution.
 */

export const getCategories = async (): Promise<Category[]> => {
  return await getCategoriesFromStore();
};

export const getCategory = async (id: string): Promise<Category | undefined> => {
  return await getCategoryFromStore(id);
};

export const createCategory = async (
  categoryData: Omit<Category, 'id'> & { id?: string }
): Promise<Category> => {
  return await createCategoryInStore(categoryData);
};

export const updateCategory = async (
  id: string,
  categoryData: Partial<Category>
): Promise<Category> => {
  const updatedCategory = await updateCategoryInStore(id, categoryData);

  // Sync updated category details (name/color) across all existing expenses stored locally
  const expenses = await expenseRepository.getExpenses();
  for (const exp of expenses) {
    if (exp.category.id === id) {
      await expenseRepository.updateExpense(exp.id, {
        category: updatedCategory,
      });
    }
  }

  return updatedCategory;
};

export const deleteCategory = async (
  id: string,
  reassignToCategoryId?: string
): Promise<void> => {
  const categories = await getCategories();
  let targetCategory: Category | undefined;

  if (reassignToCategoryId) {
    targetCategory = categories.find((c) => c.id === reassignToCategoryId);
  }

  // Fallback to first remaining category if no explicit target provided
  if (!targetCategory) {
    targetCategory = categories.find((c) => c.id !== id);
  }

  // Reassign expenses matching deleted category
  if (targetCategory) {
    const expenses = await expenseRepository.getExpenses();
    for (const exp of expenses) {
      if (exp.category.id === id) {
        await expenseRepository.updateExpense(exp.id, {
          categoryId: targetCategory.id,
          category: targetCategory,
        });
      }
    }
  }

  await deleteCategoryInStore(id);
};

export const findCategoryByName = async (name: string): Promise<Category | undefined> => {
  if (!name) return undefined;
  const categories = await getCategories();
  const normalized = name.toLowerCase().trim();

  // 1. Exact case-insensitive match
  let match = categories.find((c) => c.name.toLowerCase().trim() === normalized);
  if (match) return match;

  // 2. Partial match / keyword match
  match = categories.find(
    (c) => c.name.toLowerCase().includes(normalized) || normalized.includes(c.name.toLowerCase())
  );
  return match;
};
