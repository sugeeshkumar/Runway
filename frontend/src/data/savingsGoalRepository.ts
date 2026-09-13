import {
  getSavingsGoals as getSavingsGoalsFromStore,
  getSavingsGoal as getSavingsGoalFromStoreById,
  createSavingsGoal as createSavingsGoalInStore,
  updateSavingsGoal as updateSavingsGoalInStore,
  deleteSavingsGoal as deleteSavingsGoalInStore,
} from '../storage';
import { SavingsGoal, GoalContribution } from '../types';

/**
 * Clean frontend savings goal repository providing local IndexedDB data access,
 * goal CRUD, contribution logging/deletion, and progress/completion estimation.
 */

export const getSavingsGoals = async (): Promise<SavingsGoal[]> => {
  const rawGoals = await getSavingsGoalsFromStore();

  return rawGoals.map((g) => {
    const contributions = g.contributions || [];
    const currentSaved = contributions.reduce((sum, c) => sum + c.amount, 0);
    const percentage = g.targetAmount > 0
      ? Math.min(100, Math.round((currentSaved / g.targetAmount) * 100))
      : 0;

    // Projected completion date logic
    let estimatedCompletionDate: string | null = g.targetDate || null;
    if (!estimatedCompletionDate && currentSaved < g.targetAmount && contributions.length > 0) {
      const sorted = [...contributions].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
      const firstMs = new Date(sorted[0].occurredAt).getTime();
      const nowMs = Date.now();
      const daysDiff = Math.max(1, Math.ceil((nowMs - firstMs) / (1000 * 60 * 60 * 24)));
      const dailyRate = currentSaved / daysDiff;

      if (dailyRate > 0) {
        const remainingNeeded = g.targetAmount - currentSaved;
        const daysRemaining = Math.ceil(remainingNeeded / dailyRate);
        const projectedDate = new Date();
        projectedDate.setDate(projectedDate.getDate() + daysRemaining);
        estimatedCompletionDate = projectedDate.toISOString().split('T')[0];
      }
    }

    return {
      ...g,
      currentSaved,
      percentage,
      contributionsCount: contributions.length,
      contributions,
      estimatedCompletionDate,
    };
  });
};

export const getSavingsGoal = async (id: string): Promise<SavingsGoal | undefined> => {
  const list = await getSavingsGoals();
  return list.find((g) => g.id === id);
};

export type CreateSavingsGoalRepositoryInput = {
  id?: string;
  name: string;
  targetAmount: number;
  targetDate?: string | null;
  currency?: string;
};

export const createSavingsGoal = async (
  input: CreateSavingsGoalRepositoryInput
): Promise<SavingsGoal> => {
  return await createSavingsGoalInStore({
    id: input.id,
    name: input.name,
    targetAmount: input.targetAmount,
    targetDate: input.targetDate || null,
    currency: input.currency || 'INR',
    currentSaved: 0,
    contributions: [],
  });
};

export const updateSavingsGoal = async (
  id: string,
  updates: Partial<SavingsGoal>
): Promise<SavingsGoal> => {
  const updated = await updateSavingsGoalInStore(id, updates);
  const list = await getSavingsGoals();
  return list.find((g) => g.id === id) || updated;
};

export const deleteSavingsGoal = async (id: string): Promise<void> => {
  return await deleteSavingsGoalInStore(id);
};

export const addContribution = async (
  goalId: string,
  contributionInput: { amount: number; note?: string | null; occurredAt?: string }
): Promise<SavingsGoal> => {
  const goal = await getSavingsGoalFromStoreById(goalId);
  if (!goal) {
    throw new Error(`Savings goal with ID "${goalId}" does not exist`);
  }

  const newContribution: GoalContribution = {
    id: crypto.randomUUID(),
    goalId,
    amount: contributionInput.amount,
    note: contributionInput.note || null,
    occurredAt: contributionInput.occurredAt || new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const updatedContributions = [...(goal.contributions || []), newContribution];
  const newCurrentSaved = updatedContributions.reduce((sum, c) => sum + c.amount, 0);

  return await updateSavingsGoal(goalId, {
    contributions: updatedContributions,
    currentSaved: newCurrentSaved,
  });
};

export const deleteContribution = async (
  goalId: string,
  contributionId: string
): Promise<SavingsGoal> => {
  const goal = await getSavingsGoalFromStoreById(goalId);
  if (!goal) {
    throw new Error(`Savings goal with ID "${goalId}" does not exist`);
  }

  const updatedContributions = (goal.contributions || []).filter((c) => c.id !== contributionId);
  const newCurrentSaved = updatedContributions.reduce((sum, c) => sum + c.amount, 0);

  return await updateSavingsGoal(goalId, {
    contributions: updatedContributions,
    currentSaved: newCurrentSaved,
  });
};
