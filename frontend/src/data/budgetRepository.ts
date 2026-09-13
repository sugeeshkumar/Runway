import {
  getBudgets as getBudgetsFromStore,
  getBudget as getBudgetFromStore,
  createBudget as createBudgetInStore,
  updateBudget as updateBudgetInStore,
  deleteBudget as deleteBudgetInStore,
} from '../storage';
import { Budget, Category } from '../types';
import * as expenseRepository from './expenseRepository';
import * as categoryRepository from './categoryRepository';

/**
 * Clean frontend budget repository providing local IndexedDB data access,
 * dynamic spent/remaining calculations, and monthly budget management.
 */

export const getBudgets = async (month?: string): Promise<Budget[]> => {
  const allBudgets = await getBudgetsFromStore();
  const currentMonth = month || new Date().toISOString().slice(0, 7);

  // Filter budgets for requested month
  const monthBudgets = allBudgets.filter((b) => (b.periodMonth || currentMonth) === currentMonth);

  // Parse year and month numbers for expense calculations
  const [yearStr, monthStr] = currentMonth.split('-');
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);

  const monthExpenses = await expenseRepository.getExpensesForMonth(year, monthNum);
  const totalMonthSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  return monthBudgets.map((b) => {
    let spentAmount = 0;
    if (!b.category) {
      // Overall budget
      spentAmount = totalMonthSpent;
    } else {
      // Category budget
      const catId = b.category.id;
      spentAmount = monthExpenses
        .filter((e) => e.category.id === catId)
        .reduce((sum, e) => sum + e.amount, 0);
    }

    const remainingAmount = b.amount - spentAmount;
    let status: 'SAFE' | 'APPROACHING' | 'OVER' = 'SAFE';
    if (b.amount > 0) {
      const ratio = spentAmount / b.amount;
      if (ratio >= 1) status = 'OVER';
      else if (ratio >= 0.8) status = 'APPROACHING';
    }

    return {
      ...b,
      periodMonth: b.periodMonth || currentMonth,
      spentAmount,
      remainingAmount,
      status,
    };
  });
};

export const getBudget = async (id: string): Promise<Budget | undefined> => {
  const budget = await getBudgetFromStore(id);
  if (!budget) return undefined;
  const list = await getBudgets(budget.periodMonth);
  return list.find((b) => b.id === id) || budget;
};

export type CreateBudgetRepositoryInput = {
  id?: string;
  categoryId?: string | null;
  category?: Category | null;
  periodMonth?: string;
  amount: number;
};

export const createBudget = async (input: CreateBudgetRepositoryInput): Promise<Budget> => {
  let category: Category | null = input.category || null;
  if (!category && input.categoryId) {
    category = (await categoryRepository.getCategory(input.categoryId)) || null;
  }

  const periodMonth = input.periodMonth || new Date().toISOString().slice(0, 7);

  // If a budget already exists for this category/overall in this month, update it instead of duplicating
  const existingBudgets = await getBudgetsFromStore();
  const existing = existingBudgets.find((b) => {
    const sameMonth = (b.periodMonth || periodMonth) === periodMonth;
    const sameCat = (b.category?.id || null) === (category?.id || null);
    return sameMonth && sameCat;
  });

  if (existing) {
    return await updateBudget(existing.id, { amount: input.amount, category });
  }

  const created = await createBudgetInStore({
    id: input.id,
    amount: input.amount,
    category,
    periodMonth,
    spentAmount: 0,
    remainingAmount: input.amount,
    status: 'SAFE',
  });

  const updatedList = await getBudgets(periodMonth);
  return updatedList.find((b) => b.id === created.id) || created;
};

export const updateBudget = async (
  id: string,
  updates: Partial<Budget> & { categoryId?: string | null }
): Promise<Budget> => {
  let category = updates.category;
  if (category === undefined && updates.categoryId !== undefined) {
    category = updates.categoryId ? ((await categoryRepository.getCategory(updates.categoryId)) || null) : null;
  }

  const payload: Partial<Budget> = { ...updates };
  if (category !== undefined) {
    payload.category = category;
  }

  const updated = await updateBudgetInStore(id, payload);
  const updatedList = await getBudgets(updated.periodMonth);
  return updatedList.find((b) => b.id === id) || updated;
};

export const deleteBudget = async (id: string): Promise<void> => {
  return await deleteBudgetInStore(id);
};
