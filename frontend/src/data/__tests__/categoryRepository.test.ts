import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import * as categoryRepository from '../categoryRepository';
import * as expenseRepository from '../expenseRepository';
import { closeDB } from '../../storage/db';

describe('Category Repository (IndexedDB Category Migration)', () => {
  beforeEach(async () => {
    await closeDB();
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  });

  it('1. Default categories exist in IndexedDB with stable UUIDs without duplicates', async () => {
    const categories = await categoryRepository.getCategories();
    expect(categories.length).toBeGreaterThanOrEqual(8);

    const diningCat = categories.find((c) => c.name === 'Dining & Food');
    expect(diningCat).toBeDefined();
    expect(diningCat?.id).toBe('11111111-1111-1111-1111-111111111111');

    // Calling getCategories multiple times should be idempotent
    const categoriesAgain = await categoryRepository.getCategories();
    expect(categoriesAgain.length).toBe(categories.length);
  });

  it('2. Create custom category -> saved to IndexedDB', async () => {
    const created = await categoryRepository.createCategory({
      name: 'Travel & Vacations',
      color: '#3B82F6',
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Travel & Vacations');
    expect(created.color).toBe('#3B82F6');

    const all = await categoryRepository.getCategories();
    expect(all.find((c) => c.id === created.id)).toBeDefined();
  });

  it('3. Update category -> updates category record and syncs expense references', async () => {
    const categories = await categoryRepository.getCategories();
    const targetCat = categories[0];

    // Create an expense referencing targetCat
    const expense = await expenseRepository.createExpense({
      amount: 450,
      currency: 'INR',
      categoryId: targetCat.id,
      description: 'Dinner at Zaitoon',
      occurredAt: new Date().toISOString(),
      source: 'MANUAL',
    });
    expect(expense.category.name).toBe(targetCat.name);

    // Update category name and color
    const updatedCat = await categoryRepository.updateCategory(targetCat.id, {
      name: 'Gourmet Dining',
      color: '#EC4899',
    });

    expect(updatedCat.name).toBe('Gourmet Dining');

    // Verify updated category in getCategory / getCategories
    const reFetchedCat = await categoryRepository.getCategory(targetCat.id);
    expect(reFetchedCat?.name).toBe('Gourmet Dining');
    expect(reFetchedCat?.color).toBe('#EC4899');

    // Verify expense has updated category details
    const reFetchedExpense = await expenseRepository.getExpense(expense.id);
    expect(reFetchedExpense?.category.name).toBe('Gourmet Dining');
    expect(reFetchedExpense?.category.color).toBe('#EC4899');
  });

  it('4. Delete category with reassignment -> reassigns existing expenses to target category', async () => {
    const categories = await categoryRepository.getCategories();
    const catToDelete = categories[0];
    const targetCat = categories[1];

    // Create an expense under catToDelete
    const expense = await expenseRepository.createExpense({
      amount: 250,
      currency: 'INR',
      categoryId: catToDelete.id,
      description: 'Coffee & Snacks',
      occurredAt: new Date().toISOString(),
      source: 'MANUAL',
    });

    expect(expense.category.id).toBe(catToDelete.id);

    // Delete catToDelete and reassign to targetCat
    await categoryRepository.deleteCategory(catToDelete.id, targetCat.id);

    // Verify catToDelete is gone
    const deletedFetch = await categoryRepository.getCategory(catToDelete.id);
    expect(deletedFetch).toBeUndefined();

    // Verify expense was reassigned to targetCat
    const reFetchedExpense = await expenseRepository.getExpense(expense.id);
    expect(reFetchedExpense?.category.id).toBe(targetCat.id);
    expect(reFetchedExpense?.category.name).toBe(targetCat.name);
  });

  it('5. findCategoryByName -> resolves exact and partial category names', async () => {
    const dining = await categoryRepository.findCategoryByName('Dining & Food');
    expect(dining).toBeDefined();
    expect(dining?.name).toBe('Dining & Food');

    const partial = await categoryRepository.findCategoryByName('dining');
    expect(partial).toBeDefined();
    expect(partial?.name).toBe('Dining & Food');

    const groceries = await categoryRepository.findCategoryByName('Groceries');
    expect(groceries).toBeDefined();
    expect(groceries?.name).toBe('Groceries');
  });
});
