import {
  getExpenses as getExpensesFromStore,
  getExpense as getExpenseFromStore,
  createExpense as createExpenseInStore,
  updateExpense as updateExpenseInStore,
  deleteExpense as deleteExpenseInStore,
  getCategories,
  getCategory,
  CreateExpenseInput,
} from '../storage';
import {
  Expense,
  Category,
  DashboardSummary,
  CalendarDaySpend,
  AnalyticsInsights,
  AnalyticsPeriod,
  AnalyticsGranularity,
  InsightResponse,
  InsightItem,
  InsightType,
  InsightSeverity,
  CategorySummary,
  TimeTrendPoint,
  CategoryAnalysisItem,
  BudgetRelationship,
  Budget,
} from '../types';

/**
 * Clean frontend expense repository providing local IndexedDB data access,
 * month/date range queries, local duplicate checking, and local dashboard/analytics aggregation.
 */

export const getExpenses = async (): Promise<Expense[]> => {
  return await getExpensesFromStore();
};

export const getExpense = async (id: string): Promise<Expense | undefined> => {
  return await getExpenseFromStore(id);
};

export type CreateExpenseRepositoryInput = Omit<Expense, 'id' | 'createdAt' | 'userId' | 'category'> & {
  id?: string;
  userId?: string;
  createdAt?: string;
  category?: Category;
  categoryId?: string;
};

export const createExpense = async (
  input: CreateExpenseRepositoryInput
): Promise<Expense> => {
  let category: Category | undefined = input.category;
  if (!category && input.categoryId) {
    category = await getCategory(input.categoryId);
  }
  if (!category) {
    const categories = await getCategories();
    category = categories[0] || { id: 'default', name: 'Other', color: '#64748B' };
  }

  return await createExpenseInStore({
    ...input,
    category,
  });
};

export const updateExpense = async (
  id: string,
  updates: Partial<Expense> & { categoryId?: string }
): Promise<Expense> => {
  let category: Category | undefined = updates.category;
  if (!category && updates.categoryId) {
    category = await getCategory(updates.categoryId);
  }

  const payload: Partial<Expense> = { ...updates };
  if (category) {
    payload.category = category;
  }

  return await updateExpenseInStore(id, payload);
};

export const deleteExpense = async (id: string): Promise<void> => {
  return await deleteExpenseInStore(id);
};

export const getExpensesForMonth = async (year: number, month: number): Promise<Expense[]> => {
  const all = await getExpenses();
  return all.filter((e) => {
    const d = new Date(e.occurredAt);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
};

export const getExpensesForDate = async (dateStr: string): Promise<Expense[]> => {
  const all = await getExpenses();
  return all.filter((e) => {
    const d = new Date(e.occurredAt);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}` === dateStr;
  });
};

export const getExpensesBetween = async (startDate: Date, endDate: Date): Promise<Expense[]> => {
  const all = await getExpenses();
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  return all.filter((e) => {
    const time = new Date(e.occurredAt).getTime();
    return time >= startMs && time <= endMs;
  });
};

/**
 * Local duplicate check: checks if an expense with matching amount and merchant/description
 * occurred within the last 5 minutes.
 */
export const checkDuplicateExpense = async (input: {
  amount: number;
  description: string;
  merchant?: string | null;
}): Promise<{ duplicate: boolean; timeAgoMessage?: string }> => {
  const all = await getExpenses();
  const now = Date.now();
  const FIVE_MINUTES_MS = 5 * 60 * 1000;

  const match = all.find((e) => {
    const matchAmount = Math.abs(e.amount - input.amount) < 0.01;
    const matchDesc =
      e.description.toLowerCase().trim() === input.description.toLowerCase().trim() ||
      (input.merchant && e.merchant && e.merchant.toLowerCase().trim() === input.merchant.toLowerCase().trim());
    const occurredTime = new Date(e.occurredAt).getTime();
    const isRecent = Math.abs(now - occurredTime) <= FIVE_MINUTES_MS;
    return matchAmount && matchDesc && isRecent;
  });

  if (match) {
    const diffSec = Math.max(1, Math.floor((now - new Date(match.occurredAt).getTime()) / 1000));
    const timeAgoMessage = diffSec < 60 ? `recorded ${diffSec}s ago` : `recorded ${Math.floor(diffSec / 60)}m ago`;
    return { duplicate: true, timeAgoMessage };
  }

  return { duplicate: false };
};

import * as budgetRepository from './budgetRepository';
import * as recurringRepository from './recurringRepository';

// ==========================================
// LOCAL AGGREGATIONS FOR DASHBOARD / CALENDAR / ANALYTICS / SMART INSIGHTS
// ==========================================

export const getLocalDashboardSummary = async (
  userDefaultCurrency = 'INR',
  overallBudgetParam = 0
): Promise<DashboardSummary> => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const periodMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const currentMonthExpenses = await getExpensesForMonth(currentYear, currentMonth);

  // Previous Month Expenses
  const prevMonthDate = new Date(currentYear, now.getMonth() - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth() + 1;
  const prevMonthExpenses = await getExpensesForMonth(prevYear, prevMonth);

  const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const previousMonthSpent = prevMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Fetch local budget limit from budgetRepository
  const localBudgets = await budgetRepository.getBudgets(periodMonth);
  const overallBudgetRecord = localBudgets.find((b) => !b.category || !b.category?.id);
  const effectiveOverallBudget = overallBudgetRecord ? overallBudgetRecord.amount : overallBudgetParam;

  const remainingBudget = effectiveOverallBudget - totalSpent;
  let budgetStatus: 'SAFE' | 'APPROACHING' | 'OVER' = 'SAFE';
  if (effectiveOverallBudget > 0) {
    const ratio = totalSpent / effectiveOverallBudget;
    if (ratio >= 1) budgetStatus = 'OVER';
    else if (ratio >= 0.8) budgetStatus = 'APPROACHING';
  }

  let monthOverMonthDeltaPercentage = 0;
  if (previousMonthSpent > 0) {
    monthOverMonthDeltaPercentage = Math.round(((totalSpent - previousMonthSpent) / previousMonthSpent) * 100);
  }

  // Calculate Top Categories
  const categoryMap = new Map<string, { categoryName: string; color: string; spentAmount: number }>();
  currentMonthExpenses.forEach((e) => {
    const catId = e.category.id;
    const existing = categoryMap.get(catId) || {
      categoryName: e.category.name,
      color: e.category.color,
      spentAmount: 0,
    };
    existing.spentAmount += e.amount;
    categoryMap.set(catId, existing);
  });

  const topCategories: CategorySummary[] = Array.from(categoryMap.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.categoryName,
      color: data.color,
      spentAmount: data.spentAmount,
      percentage: totalSpent > 0 ? (data.spentAmount / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.spentAmount - a.spentAmount);

  // Fetch upcoming recurring templates
  const recurringList = await recurringRepository.getRecurringExpenses();
  const upcomingRecurring = recurringList
    .filter((t) => !t.isPaused)
    .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());

  return {
    periodMonth,
    userDefaultCurrency,
    overallBudget: effectiveOverallBudget,
    totalSpent,
    remainingBudget,
    budgetStatus,
    previousMonthSpent,
    monthOverMonthDeltaPercentage,
    topCategories,
    upcomingRecurring,
  };
};

export const getLocalCalendarDays = async (year: number, month: number): Promise<CalendarDaySpend[]> => {
  const monthExpenses = await getExpensesForMonth(year, month);
  const daysInMonth = new Date(year, month, 0).getDate();

  const days: CalendarDaySpend[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayExpenses = monthExpenses.filter((e) => {
      const d = new Date(e.occurredAt);
      return d.getDate() === day;
    });

    const totalSpent = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Group category splits for day
    const categoryMap = new Map<string, { categoryName: string; color: string; spentAmount: number }>();
    dayExpenses.forEach((e) => {
      const catId = e.category.id;
      const existing = categoryMap.get(catId) || {
        categoryName: e.category.name,
        color: e.category.color,
        spentAmount: 0,
      };
      existing.spentAmount += e.amount;
      categoryMap.set(catId, existing);
    });

    const categorySplits: CategorySummary[] = Array.from(categoryMap.entries()).map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.categoryName,
      color: data.color,
      spentAmount: data.spentAmount,
      percentage: totalSpent > 0 ? (data.spentAmount / totalSpent) * 100 : 0,
    }));

    days.push({
      date: dayStr,
      totalSpent,
      transactionCount: dayExpenses.length,
      intensityPercentage: 0, // will compute below relative to max day
      categorySplits,
      expenses: dayExpenses,
    });
  }

  const maxDaySpend = Math.max(1, ...days.map((d) => d.totalSpent));
  days.forEach((d) => {
    d.intensityPercentage = Math.round((d.totalSpent / maxDaySpend) * 100);
  });

  return days;
};

export const getLocalAnalyticsInsights = async (
  period: AnalyticsPeriod,
  granularity: AnalyticsGranularity,
  userDefaultCurrency = 'INR',
  overallBudget = 0
): Promise<AnalyticsInsights> => {
  const allExpenses = await getExpenses();

  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;
  let prevStartDate: Date;
  let prevEndDate: Date;

  if (period === 'LAST_MONTH') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    prevEndDate = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);
  } else if (period === 'LAST_3_MONTHS') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    prevEndDate = new Date(now.getFullYear(), now.getMonth() - 3, 0, 23, 59, 59);
  } else if (period === 'THIS_YEAR') {
    startDate = new Date(now.getFullYear(), 0, 1);
    prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
    prevEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
  } else {
    // THIS_MONTH
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  }

  const targetExpenses = allExpenses.filter((e) => {
    const t = new Date(e.occurredAt).getTime();
    return t >= startDate.getTime() && t <= endDate.getTime();
  });

  const prevExpenses = allExpenses.filter((e) => {
    const t = new Date(e.occurredAt).getTime();
    return t >= prevStartDate.getTime() && t <= prevEndDate.getTime();
  });

  const hasEnoughData = targetExpenses.length > 0;
  const totalSpent = targetExpenses.reduce((sum, e) => sum + e.amount, 0);
  const previousPeriodSpent = prevExpenses.reduce((sum, e) => sum + e.amount, 0);

  const daysElapsed = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const averageDailySpent = totalSpent / daysElapsed;
  const totalTransactions = targetExpenses.length;

  let largestExpenseAmount = 0;
  let largestExpenseDescription: string | undefined;
  let largestExpenseMerchant: string | undefined;
  let largestExpenseDate: string | undefined;

  targetExpenses.forEach((e) => {
    if (e.amount > largestExpenseAmount) {
      largestExpenseAmount = e.amount;
      largestExpenseDescription = e.description;
      largestExpenseMerchant = e.merchant || undefined;
      largestExpenseDate = e.occurredAt;
    }
  });

  let periodDeltaPercentage = 0;
  if (previousPeriodSpent > 0) {
    periodDeltaPercentage = ((totalSpent - previousPeriodSpent) / previousPeriodSpent) * 100;
  }

  // Category Analysis
  const catMap = new Map<string, { name: string; color: string; amount: number; count: number }>();
  targetExpenses.forEach((e) => {
    const catId = e.category.id;
    const existing = catMap.get(catId) || { name: e.category.name, color: e.category.color, amount: 0, count: 0 };
    existing.amount += e.amount;
    existing.count += 1;
    catMap.set(catId, existing);
  });

  const categoryAnalysis: CategoryAnalysisItem[] = Array.from(catMap.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      color: data.color,
      totalAmount: data.amount,
      percentage: totalSpent > 0 ? (data.amount / totalSpent) * 100 : 0,
      transactionCount: data.count,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // Spending Over Time points
  const spendingOverTime: TimeTrendPoint[] = [];
  if (granularity === 'MONTHLY') {
    const monthGroupMap = new Map<string, { amount: number; count: number }>();
    targetExpenses.forEach((e) => {
      const d = new Date(e.occurredAt);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const existing = monthGroupMap.get(label) || { amount: 0, count: 0 };
      existing.amount += e.amount;
      existing.count += 1;
      monthGroupMap.set(label, existing);
    });
    monthGroupMap.forEach((v, k) => {
      spendingOverTime.push({
        periodLabel: k,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalAmount: v.amount,
        transactionCount: v.count,
      });
    });
  } else {
    // DAILY or WEEKLY
    const dayMap = new Map<string, { amount: number; count: number }>();
    targetExpenses.forEach((e) => {
      const d = new Date(e.occurredAt);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = dayMap.get(label) || { amount: 0, count: 0 };
      existing.amount += e.amount;
      existing.count += 1;
      dayMap.set(label, existing);
    });
    dayMap.forEach((v, k) => {
      spendingOverTime.push({
        periodLabel: k,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalAmount: v.amount,
        transactionCount: v.count,
      });
    });
  }

  // Observations / Patterns
  const spendingPatterns: string[] = [];
  if (categoryAnalysis.length > 0) {
    spendingPatterns.push(`${categoryAnalysis[0].categoryName} is your highest spending category (${categoryAnalysis[0].percentage.toFixed(0)}% of total).`);
  }
  if (totalTransactions > 0) {
    spendingPatterns.push(`Average transaction amount is ${userDefaultCurrency} ${(totalSpent / totalTransactions).toFixed(0)} across ${totalTransactions} items.`);
  }

  // Budget Relationship
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const localBudgets = await budgetRepository.getBudgets(currentMonthStr);
  const overallBudgetRecord = localBudgets.find((b) => !b.category || !b.category?.id);
  const effectiveBudget = overallBudgetRecord ? overallBudgetRecord.amount : overallBudget;

  const remainingBudget = effectiveBudget - totalSpent;
  const percentageUsed = effectiveBudget > 0 ? (totalSpent / effectiveBudget) * 100 : 0;
  const projectedEomTotal = averageDailySpent * 30;

  const budgetRelationship: BudgetRelationship = {
    overallBudget: effectiveBudget,
    totalSpent,
    remainingBudget,
    percentageUsed,
    projectedEomTotal,
    isProjectionAvailable: totalSpent > 0,
    projectionNotice: effectiveBudget > 0 && projectedEomTotal > effectiveBudget ? 'Projected to exceed budget at current pace' : 'Pacing within expected limits',
  };

  return {
    period,
    granularity,
    currency: userDefaultCurrency,
    hasEnoughData,
    overview: {
      totalSpent,
      averageDailySpent,
      totalTransactions,
      largestExpenseAmount,
      largestExpenseDescription,
      largestExpenseMerchant,
      largestExpenseDate,
      previousPeriodSpent,
      periodDeltaPercentage,
    },
    spendingOverTime,
    categoryAnalysis,
    spendingPatterns,
    budgetRelationship,
  };
};

export const getLocalSmartInsights = async (
  period: AnalyticsPeriod,
  userDefaultCurrency = 'INR'
): Promise<InsightResponse> => {
  const allExpenses = await getExpenses();
  if (allExpenses.length < 3) {
    return {
      insights: [],
      hasEnoughData: false,
      currency: userDefaultCurrency,
      period,
      notice: 'Keep tracking expenses to unlock smart spending insights (at least 3 transactions required).',
    };
  }

  const insights: InsightItem[] = [];

  // Top Category Insight
  const catMap = new Map<string, number>();
  let totalSpent = 0;
  allExpenses.forEach((e) => {
    totalSpent += e.amount;
    catMap.set(e.category.name, (catMap.get(e.category.name) || 0) + e.amount);
  });

  const sortedCats = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);
  if (sortedCats.length > 0) {
    const [topCatName, topAmount] = sortedCats[0];
    const pct = Math.round((topAmount / totalSpent) * 100);
    insights.push({
      id: 'insight-top-cat',
      type: 'TOP_CATEGORY',
      severity: pct >= 40 ? 'WARNING' : 'INFO',
      category: topCatName.toUpperCase(),
      title: `${topCatName} is your largest expense category`,
      description: `${topCatName} accounts for ${pct}% of your total recorded spending (${userDefaultCurrency} ${topAmount.toFixed(0)}).`,
      metric: `${pct}% of spend`,
      value: topAmount,
      period: 'Overall',
      impactScore: 90,
    });
  }

  // Merchant Frequency Insight
  const merchantMap = new Map<string, { count: number; total: number }>();
  allExpenses.forEach((e) => {
    if (e.merchant) {
      const existing = merchantMap.get(e.merchant) || { count: 0, total: 0 };
      existing.count += 1;
      existing.total += e.amount;
      merchantMap.set(e.merchant, existing);
    }
  });

  const sortedMerchants = Array.from(merchantMap.entries()).sort((a, b) => b[1].count - a[1].count);
  if (sortedMerchants.length > 0 && sortedMerchants[0][1].count >= 2) {
    const [mName, mData] = sortedMerchants[0];
    insights.push({
      id: 'insight-merchant-freq',
      type: 'MERCHANT_FREQUENCY',
      severity: 'NEUTRAL',
      category: 'MERCHANT HABIT',
      title: `${mName} is your most frequent merchant`,
      description: `You have logged ${mData.count} transactions at ${mName} totaling ${userDefaultCurrency} ${mData.total.toFixed(0)}.`,
      metric: `${mData.count} visits`,
      value: mData.total,
      period: 'Overall',
      impactScore: 75,
    });
  }

  return {
    insights,
    hasEnoughData: true,
    currency: userDefaultCurrency,
    period,
  };
};
