export interface User {
  id: string;
  email: string;
  defaultCurrency: string;
  monthlyIncome?: number | null;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface ForgotPasswordResponse {
  message: string;
  devResetLink?: string | null;
}

export interface Category {
  id: string;
  userId?: string | null;
  name: string;
  parentId?: string | null;
  color: string;
}

export type ExpenseSource = 'MANUAL' | 'PARSED_TEXT' | 'RECURRING';

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  category: Category;
  merchant?: string | null;
  description: string;
  occurredAt: string;
  source: ExpenseSource;
  rawInput?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export type BudgetStatusType = 'SAFE' | 'APPROACHING' | 'OVER';

export interface Budget {
  id: string;
  userId: string;
  category?: Category | null;
  periodMonth: string;
  amount: number;
  spentAmount: number;
  remainingAmount: number;
  status: BudgetStatusType;
}

export type Cadence = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurringTemplate {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  category: Category;
  cadence: Cadence;
  nextDueDate: string;
  description: string;
  isPaused: boolean;
}

export interface CommittedSummary {
  monthlyIncome?: number | null;
  totalCommittedMonthly: number;
  committedPercentage?: number | null;
  currency: string;
  templateCount: number;
}

export interface CreateRecurringRequest {
  categoryId: string;
  amount: number;
  currency?: string;
  cadence: Cadence;
  nextDueDate: string;
  description: string;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  color: string;
  spentAmount: number;
  percentage: number;
}

export interface DashboardSummary {
  periodMonth: string;
  userDefaultCurrency: string;
  overallBudget: number;
  totalSpent: number;
  remainingBudget: number;
  budgetStatus: BudgetStatusType;
  previousMonthSpent: number;
  monthOverMonthDeltaPercentage: number;
  topCategories: CategorySummary[];
  upcomingRecurring: RecurringTemplate[];
}

export interface ParsedExpenseDraft {
  amount: number;
  currency: string;
  categoryId?: string | null;
  categoryName?: string | null;
  merchant?: string | null;
  description: string;
  confidence: number;
  occurredAt: string;
  rawInput?: string | null;
}

// SHARED LEDGERS (TRIPS & EVENTS) TYPES

export type LedgerType = 'TRIP' | 'EVENT' | 'CUSTOM';
export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE';

export interface LedgerParticipant {
  id: string;
  ledgerId: string;
  displayName: string;
  linkedUserId?: string | null;
  linkedUserEmail?: string | null;
}

export interface SharedExpenseSplit {
  id: string;
  participantId: string;
  participantName: string;
  shareAmount: number;
}

export interface SharedExpense {
  id: string;
  ledgerId: string;
  paidByParticipantId: string;
  paidByParticipantName: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  baseCurrencyAmount: number;
  description: string;
  splitType: SplitType;
  occurredAt: string;
  createdAt: string;
  splits: SharedExpenseSplit[];
}

export interface SharedLedger {
  id: string;
  ownerId: string;
  ownerEmail: string;
  name: string;
  type: LedgerType;
  startDate: string;
  endDate?: string | null;
  baseCurrency: string;
  plannedBudget?: number | null;
  totalSpentInBase: number;
  isSettled: boolean;
  settledAt?: string | null;
  createdAt: string;
  participants: LedgerParticipant[];
}

export interface ParticipantBalance {
  participantId: string;
  participantName: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

export interface SettleTransaction {
  fromParticipantId: string;
  fromParticipantName: string;
  toParticipantId: string;
  toParticipantName: string;
  amount: number;
  currency: string;
}

export interface LedgerBalances {
  ledgerId: string;
  ledgerName: string;
  baseCurrency: string;
  totalSpent: number;
  participantBalances: ParticipantBalance[];
  settleTransactions: SettleTransaction[];
}

export interface CreateLedgerRequest {
  name: string;
  type: LedgerType;
  startDate: string;
  endDate?: string | null;
  baseCurrency: string;
  plannedBudget?: number | null;
  participantNames?: string[];
}

export interface SplitItemRequest {
  participantId: string;
  value?: number;
}

export interface CreateSharedExpenseRequest {
  paidByParticipantId: string;
  amount: number;
  currency?: string;
  exchangeRate?: number;
  description: string;
  splitType: SplitType;
  occurredAt?: string;
  splits?: SplitItemRequest[];
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  occurredAt: string;
  note?: string | null;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  targetDate?: string | null;
  currency: string;
  currentSaved: number;
  percentage: number;
  estimatedCompletionDate?: string | null;
  contributionsCount: number;
  createdAt: string;
  contributions: GoalContribution[];
}

export interface CategoryTrend {
  periodMonth: string;
  categoryId?: string | null;
  categoryName: string;
  color: string;
  spentAmount: number;
}

export interface DayOfWeekSpend {
  dayOfWeek: number;
  dayName: string;
  totalSpent: number;
  transactionCount: number;
  intensityPercentage: number;
}

export interface CategoryDelta {
  categoryId?: string | null;
  categoryName: string;
  color: string;
  currentSpent: number;
  previousSpent: number;
  deltaAmount: number;
  deltaPercentage: number;
}

export interface MonthOverMonthComparison {
  currentMonth: string;
  previousMonth: string;
  currentTotalSpent: number;
  previousTotalSpent: number;
  overallDeltaAmount: number;
  overallDeltaPercentage: number;
  categoryDeltas: CategoryDelta[];
}

export interface MerchantSpend {
  merchantName: string;
  totalSpent: number;
  transactionCount: number;
  percentageOfTotal: number;
}

export interface CalendarDaySpend {
  date: string;
  totalSpent: number;
  transactionCount: number;
  intensityPercentage: number;
  categorySplits: CategorySummary[];
  expenses: Expense[];
}

export type AnalyticsPeriod = 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'THIS_YEAR';
export type AnalyticsGranularity = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface AnalyticsOverview {
  totalSpent: number;
  averageDailySpent: number;
  totalTransactions: number;
  largestExpenseAmount: number;
  largestExpenseDescription?: string | null;
  largestExpenseMerchant?: string | null;
  largestExpenseDate?: string | null;
  previousPeriodSpent: number;
  periodDeltaPercentage: number;
}

export interface TimeTrendPoint {
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  transactionCount: number;
}

export interface CategoryAnalysisItem {
  categoryId?: string | null;
  categoryName: string;
  color: string;
  totalAmount: number;
  percentage: number;
  transactionCount: number;
}

export interface BudgetRelationship {
  overallBudget: number;
  totalSpent: number;
  remainingBudget: number;
  percentageUsed: number;
  projectedEomTotal: number;
  isProjectionAvailable: boolean;
  projectionNotice?: string | null;
}

export interface AnalyticsInsights {
  period: AnalyticsPeriod;
  granularity: AnalyticsGranularity;
  currency: string;
  hasEnoughData: boolean;
  overview: AnalyticsOverview;
  spendingOverTime: TimeTrendPoint[];
  categoryAnalysis: CategoryAnalysisItem[];
  spendingPatterns: string[];
  budgetRelationship: BudgetRelationship;
}

// SMART FINANCIAL INSIGHTS ENGINE TYPES

export type InsightType =
  | 'CATEGORY_INCREASE'
  | 'CATEGORY_DECREASE'
  | 'TOP_CATEGORY'
  | 'FASTEST_GROWING_CATEGORY'
  | 'MERCHANT_FREQUENCY'
  | 'MERCHANT_REPEATED_SPEND'
  | 'SPENDING_PATTERN_WEEKDAY'
  | 'SPENDING_PATTERN_WEEKEND'
  | 'BUDGET_PACING'
  | 'ANOMALY_UNUSUAL_EXPENSE';

export type InsightSeverity = 'INFO' | 'WARNING' | 'POSITIVE' | 'NEUTRAL';

export interface InsightItem {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  category: string;
  title: string;
  description: string;
  metric?: string | null;
  value?: number | null;
  period: string;
  impactScore: number;
}

export interface InsightResponse {
  insights: InsightItem[];
  hasEnoughData: boolean;
  currency: string;
  period: string;
  notice?: string | null;
}

