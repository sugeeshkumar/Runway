import {
  getRecurringExpenses as getRecurringFromStore,
  getRecurringExpense as getRecurringFromStoreById,
  createRecurringExpense as createRecurringInStore,
  updateRecurringExpense as updateRecurringInStore,
  deleteRecurringExpense as deleteRecurringInStore,
} from '../storage';
import { RecurringTemplate, CommittedSummary, Cadence, Category } from '../types';
import * as expenseRepository from './expenseRepository';
import * as categoryRepository from './categoryRepository';

/**
 * Clean frontend recurring repository providing local IndexedDB data access,
 * template CRUD, committed summary calculation, and idempotent due-charge generation.
 */

export const getRecurringExpenses = async (): Promise<RecurringTemplate[]> => {
  return await getRecurringFromStore();
};

export const getRecurringExpense = async (id: string): Promise<RecurringTemplate | undefined> => {
  return await getRecurringFromStoreById(id);
};

export type CreateRecurringRepositoryInput = {
  id?: string;
  description: string;
  categoryId: string;
  category?: Category;
  amount: number;
  currency?: string;
  cadence: Cadence;
  nextDueDate: string;
  isPaused?: boolean;
};

export const createRecurringExpense = async (
  input: CreateRecurringRepositoryInput
): Promise<RecurringTemplate> => {
  let category: Category | undefined = input.category;
  if (!category && input.categoryId) {
    category = await categoryRepository.getCategory(input.categoryId);
  }
  if (!category) {
    const categories = await categoryRepository.getCategories();
    category = categories[0] || { id: 'default', name: 'Other', color: '#64748B' };
  }

  return await createRecurringInStore({
    id: input.id,
    description: input.description,
    category,
    amount: input.amount,
    currency: input.currency || 'INR',
    cadence: input.cadence,
    nextDueDate: input.nextDueDate,
    isPaused: input.isPaused || false,
  });
};

export const updateRecurringExpense = async (
  id: string,
  updates: Partial<RecurringTemplate> & { categoryId?: string }
): Promise<RecurringTemplate> => {
  let category: Category | undefined = updates.category;
  if (!category && updates.categoryId) {
    category = await categoryRepository.getCategory(updates.categoryId);
  }

  const payload: Partial<RecurringTemplate> = { ...updates };
  if (category) {
    payload.category = category;
  }

  return await updateRecurringInStore(id, payload);
};

export const togglePauseRecurringExpense = async (
  id: string,
  status?: string | boolean
): Promise<RecurringTemplate> => {
  const existing = await getRecurringExpense(id);
  if (!existing) {
    throw new Error(`Recurring template with ID "${id}" does not exist`);
  }

  let isPaused: boolean;
  if (typeof status === 'boolean') {
    isPaused = status;
  } else if (typeof status === 'string') {
    isPaused = status.toUpperCase() === 'PAUSED';
  } else {
    isPaused = !existing.isPaused;
  }

  return await updateRecurringExpense(id, { isPaused });
};

export const deleteRecurringExpense = async (id: string): Promise<void> => {
  return await deleteRecurringInStore(id);
};

export const getCommittedSummary = async (
  userCurrency = 'INR',
  monthlyIncome?: number | null
): Promise<CommittedSummary> => {
  const templates = await getRecurringExpenses();
  const activeTemplates = templates.filter((t) => !t.isPaused);

  let totalCommittedMonthly = 0;
  activeTemplates.forEach((t) => {
    switch (t.cadence) {
      case 'DAILY':
        totalCommittedMonthly += t.amount * 30;
        break;
      case 'WEEKLY':
        totalCommittedMonthly += t.amount * 4.333;
        break;
      case 'MONTHLY':
        totalCommittedMonthly += t.amount;
        break;
      case 'YEARLY':
        totalCommittedMonthly += t.amount / 12;
        break;
    }
  });

  let committedPercentage: number | null = null;
  if (monthlyIncome && monthlyIncome > 0) {
    committedPercentage = (totalCommittedMonthly / monthlyIncome) * 100;
  }

  return {
    monthlyIncome,
    totalCommittedMonthly,
    committedPercentage,
    currency: userCurrency,
    templateCount: activeTemplates.length,
  };
};

/**
 * Idempotent process function: generates an expense record for each active recurring template
 * that is due (nextDueDate <= today or force=true) without generating duplicates.
 */
export const processDueRecurringExpenses = async (
  force = false
): Promise<{ generatedCount: number; message: string }> => {
  const templates = await getRecurringExpenses();
  const activeTemplates = templates.filter((t) => !t.isPaused);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  let generatedCount = 0;

  for (const tpl of activeTemplates) {
    const dueStr = tpl.nextDueDate.split('T')[0];
    const isDue = new Date(dueStr).getTime() <= new Date(todayStr).getTime();

    if (isDue || force) {
      // Idempotency check: see if an expense already exists for this template & charge date
      const allExpenses = await expenseRepository.getExpenses();
      const alreadyGenerated = allExpenses.some((e) => {
        const matchesDesc = e.description === tpl.description;
        const matchesAmount = Math.abs(e.amount - tpl.amount) < 0.01;
        const matchesCategory = e.category.id === tpl.category.id;
        const matchesSource = e.source === 'RECURRING';
        const matchesDate = e.occurredAt.split('T')[0] === dueStr || e.occurredAt.split('T')[0] === todayStr;
        return matchesDesc && matchesAmount && matchesCategory && matchesSource && matchesDate;
      });

      if (!alreadyGenerated) {
        await expenseRepository.createExpense({
          amount: tpl.amount,
          currency: tpl.currency,
          category: tpl.category,
          categoryId: tpl.category.id,
          description: tpl.description,
          merchant: tpl.description,
          occurredAt: `${dueStr}T09:00:00.000Z`,
          source: 'RECURRING',
          rawInput: `Recurring charge for ${tpl.description}`,
        });
        generatedCount += 1;

        // Advance nextDueDate according to cadence
        const currentDue = new Date(dueStr);
        if (tpl.cadence === 'DAILY') {
          currentDue.setDate(currentDue.getDate() + 1);
        } else if (tpl.cadence === 'WEEKLY') {
          currentDue.setDate(currentDue.getDate() + 7);
        } else if (tpl.cadence === 'MONTHLY') {
          currentDue.setMonth(currentDue.getMonth() + 1);
        } else if (tpl.cadence === 'YEARLY') {
          currentDue.setFullYear(currentDue.getFullYear() + 1);
        }

        const nextDueDateStr = currentDue.toISOString().split('T')[0];
        await updateRecurringExpense(tpl.id, { nextDueDate: nextDueDateStr });
      }
    }
  }

  const message = generatedCount > 0
    ? `Processed ${generatedCount} recurring expense charge${generatedCount > 1 ? 's' : ''}`
    : `All recurring expenses are up to date. No new charges due.`;

  return { generatedCount, message };
};
