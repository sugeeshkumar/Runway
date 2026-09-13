import React, { useState, useEffect, useCallback } from 'react';
import {
  AnalyticsInsights,
  AnalyticsPeriod,
  AnalyticsGranularity,
  TimeTrendPoint,
} from '../types';
import { formatCurrency } from '../utils/currency';
import api from '../api/client';
import { CategoryIcon } from '../components/CategoryIcon';
import { SmartInsightsSection } from '../components/SmartInsightsSection';
import {
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Info,
  Calendar as CalendarIcon,
  PieChart as PieChartIcon,
  TrendingUp,
} from 'lucide-react';

import * as expenseRepository from '../data/expenseRepository';

interface AnalyticsPageProps {
  userCurrency: string;
  refreshKey?: number;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ userCurrency, refreshKey = 0 }) => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('THIS_MONTH');
  const [granularity, setGranularity] = useState<AnalyticsGranularity>('DAILY');
  const [insights, setInsights] = useState<AnalyticsInsights | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeHoverPoint, setActiveHoverPoint] = useState<TimeTrendPoint | null>(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const data = await expenseRepository.getLocalAnalyticsInsights(period, granularity, userCurrency);
      setInsights(data);
    } catch (err) {
      console.error('Failed to load analytics insights from local storage', err);
    } finally {
      setLoading(false);
    }
  }, [period, granularity, userCurrency]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights, refreshKey]);

  const currency = insights?.currency || userCurrency;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Page Header & Period Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-hairline-light dark:border-hairline-dark pb-6">
        <div className="space-y-1">
          <div className="font-mono text-[10px] font-medium uppercase tracking-widest text-ink-secondary dark:text-ink-darkSecondary">
            Runway / Financial Insights
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-ink-primary dark:text-ink-darkPrimary tracking-tight">
            Analytics
          </h1>
          <p className="font-sans text-xs text-ink-secondary dark:text-ink-darkSecondary">
            Understand your spending trends, velocity, category splits, and budget projections.
          </p>
        </div>

        {/* Restrained Hairline Period Controls */}
        <div className="flex items-center space-x-1 border border-hairline-light dark:border-hairline-dark p-1 rounded-xl bg-canvas-light dark:bg-canvas-dark self-start md:self-auto">
          {(
            [
              { id: 'THIS_MONTH', label: 'This Month' },
              { id: 'LAST_MONTH', label: 'Last Month' },
              { id: 'LAST_3_MONTHS', label: 'Last 3 Months' },
              { id: 'THIS_YEAR', label: 'This Year' },
            ] as { id: AnalyticsPeriod; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-medium transition-all cursor-pointer ${
                period === tab.id
                  ? 'bg-ink-primary text-canvas-light dark:bg-ink-darkPrimary dark:text-canvas-dark shadow-xs'
                  : 'text-ink-secondary dark:text-ink-darkSecondary hover:text-ink-primary dark:hover:text-ink-darkPrimary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-5 h-5 border-2 border-clay-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-mono text-xs text-ink-secondary dark:text-ink-darkSecondary">
            Calculating financial intelligence...
          </p>
        </div>
      ) : !insights || !insights.hasEnoughData ? (
        /* Empty / Insufficient Data State */
        <div className="border border-hairline-light dark:border-hairline-dark rounded-xl p-10 bg-canvas-light dark:bg-canvas-dark text-center space-y-3">
          <div className="w-9 h-9 rounded-full bg-clay-600/10 text-clay-600 dark:text-clay-400 flex items-center justify-center mx-auto">
            <Info size={18} />
          </div>
          <h3 className="font-serif text-lg font-normal text-ink-primary dark:text-ink-darkPrimary">
            Insufficient Transaction Data
          </h3>
          <p className="font-sans text-xs text-ink-secondary dark:text-ink-darkSecondary max-w-md mx-auto leading-relaxed">
            There are no recorded expenses for the selected period. Log a few transactions on your Dashboard to calculate spending trends, velocity, category distributions, and end-of-month projections.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* SECTION 1: OVERVIEW METRICS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Spent */}
            <div className="border border-hairline-light dark:border-hairline-dark rounded-xl p-4 bg-canvas-light dark:bg-canvas-dark space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-secondary dark:text-ink-darkSecondary block">
                Total Spending
              </span>
              <div className="font-mono font-bold text-xl sm:text-2xl text-ink-primary dark:text-ink-darkPrimary tabular-nums">
                {formatCurrency(insights.overview.totalSpent, currency)}
              </div>
              <div className="flex items-center space-x-1 font-mono text-[10px]">
                {insights.overview.periodDeltaPercentage > 0 ? (
                  <span className="text-rose-600 dark:text-rose-400 font-medium inline-flex items-center">
                    <ArrowUpRight size={12} /> +{insights.overview.periodDeltaPercentage.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center">
                    <ArrowDownRight size={12} /> {insights.overview.periodDeltaPercentage.toFixed(1)}%
                  </span>
                )}
                <span className="text-ink-muted dark:text-ink-darkMuted">vs prev period</span>
              </div>
            </div>

            {/* Daily Average */}
            <div className="border border-hairline-light dark:border-hairline-dark rounded-xl p-4 bg-canvas-light dark:bg-canvas-dark space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-secondary dark:text-ink-darkSecondary block">
                Daily Average
              </span>
              <div className="font-mono font-bold text-xl sm:text-2xl text-ink-primary dark:text-ink-darkPrimary tabular-nums">
                {formatCurrency(insights.overview.averageDailySpent, currency)}
              </div>
              <span className="font-mono text-[10px] text-ink-muted dark:text-ink-darkMuted block">
                per elapsed day
              </span>
            </div>

            {/* Total Transactions */}
            <div className="border border-hairline-light dark:border-hairline-dark rounded-xl p-4 bg-canvas-light dark:bg-canvas-dark space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-secondary dark:text-ink-darkSecondary block">
                Transactions
              </span>
              <div className="font-mono font-bold text-xl sm:text-2xl text-ink-primary dark:text-ink-darkPrimary tabular-nums">
                {insights.overview.totalTransactions}
              </div>
              <span className="font-mono text-[10px] text-ink-muted dark:text-ink-darkMuted block">
                items recorded
              </span>
            </div>

            {/* Largest Expense */}
            <div className="border border-hairline-light dark:border-hairline-dark rounded-xl p-4 bg-canvas-light dark:bg-canvas-dark space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-secondary dark:text-ink-darkSecondary block">
                Largest Expense
              </span>
              <div className="font-mono font-bold text-xl sm:text-2xl text-ink-primary dark:text-ink-darkPrimary tabular-nums truncate">
                {formatCurrency(insights.overview.largestExpenseAmount, currency)}
              </div>
              <span className="font-sans text-[11px] text-ink-secondary dark:text-ink-darkSecondary truncate block">
                {insights.overview.largestExpenseDescription || 'N/A'}
              </span>
            </div>
          </div>

          {/* SMART FINANCIAL INSIGHTS ENGINE */}
          <SmartInsightsSection period={period} userCurrency={currency} refreshKey={refreshKey} />

          {/* SECTION 2: SPENDING OVER TIME TREND */}
          <div className="border border-hairline-light dark:border-hairline-dark rounded-xl p-5 bg-canvas-light dark:bg-canvas-dark space-y-4">
            <div className="flex items-center justify-between border-b border-hairline-light dark:border-hairline-dark pb-3">
              <div>
                <h3 className="font-mono text-xs font-medium uppercase tracking-wider text-ink-primary dark:text-ink-darkPrimary">
                  Spending Over Time
                </h3>
                <span className="font-sans text-xs text-ink-secondary dark:text-ink-darkSecondary">
                  Timeline distribution of expenses across selected period.
                </span>
              </div>

              {/* Granularity Switcher */}
              <div className="flex items-center space-x-1 font-mono text-[11px]">
                {(['DAILY', 'WEEKLY', 'MONTHLY'] as AnalyticsGranularity[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGranularity(g)}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer capitalize ${
                      granularity === g
                        ? 'bg-stone-300/60 dark:bg-neutral-700 text-ink-primary dark:text-ink-darkPrimary font-bold'
                        : 'text-ink-secondary dark:text-ink-darkSecondary hover:text-ink-primary'
                    }`}
                  >
                    {g.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Hairline Bar Chart Visualization */}
            {insights.spendingOverTime.length === 0 ? (
              <p className="font-mono text-xs text-ink-muted dark:text-ink-darkMuted py-8 text-center">
                No trend points recorded for this range.
              </p>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="h-44 flex items-end justify-between gap-1 sm:gap-2 px-1 relative">
                  {(() => {
                    const maxVal = Math.max(
                      1,
                      ...insights.spendingOverTime.map((p) => p.totalAmount)
                    );
                    return insights.spendingOverTime.map((point) => {
                      const heightPct = Math.max(4, (point.totalAmount / maxVal) * 100);
                      const isHovered = activeHoverPoint?.periodLabel === point.periodLabel;
                      return (
                        <div
                          key={point.periodLabel}
                          onMouseEnter={() => setActiveHoverPoint(point)}
                          onMouseLeave={() => setActiveHoverPoint(null)}
                          className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                        >
                          {/* Tooltip on Hover */}
                          {isHovered && (
                            <div className="absolute -top-12 z-20 bg-stone-900 text-stone-100 text-[11px] font-mono px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap pointer-events-none border border-stone-700">
                              <span className="font-bold">{point.periodLabel}</span>: {formatCurrency(point.totalAmount, currency)} ({point.transactionCount} txn{point.transactionCount === 1 ? '' : 's'})
                            </div>
                          )}

                          {/* Bar Rule */}
                          <div
                            className={`w-full max-w-[20px] rounded-t transition-all duration-200 ${
                              isHovered
                                ? 'bg-clay-600 dark:bg-clay-500'
                                : point.totalAmount > 0
                                ? 'bg-stone-300 dark:bg-neutral-700 group-hover:bg-clay-600/70'
                                : 'bg-stone-200/50 dark:bg-neutral-850'
                            }`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* X Axis Labels */}
                <div className="flex items-center justify-between text-[10px] font-mono text-ink-secondary dark:text-ink-darkSecondary border-t border-hairline-light dark:border-hairline-dark pt-2 px-1">
                  <span>{insights.spendingOverTime[0]?.periodLabel}</span>
                  {insights.spendingOverTime.length > 2 && (
                    <span>
                      {
                        insights.spendingOverTime[
                          Math.floor(insights.spendingOverTime.length / 2)
                        ]?.periodLabel
                      }
                    </span>
                  )}
                  <span>
                    {
                      insights.spendingOverTime[insights.spendingOverTime.length - 1]
                        ?.periodLabel
                    }
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: CATEGORY ANALYSIS */}
          <div className="border border-hairline-light dark:border-hairline-dark rounded-xl p-5 bg-canvas-light dark:bg-canvas-dark space-y-4">
            <div className="flex items-center justify-between border-b border-hairline-light dark:border-hairline-dark pb-3">
              <div>
                <h3 className="font-mono text-xs font-medium uppercase tracking-wider text-ink-primary dark:text-ink-darkPrimary">
                  Category Distribution
                </h3>
                <span className="font-sans text-xs text-ink-secondary dark:text-ink-darkSecondary">
                  Breakdown of spending allocation across active categories.
                </span>
              </div>
            </div>

            {insights.categoryAnalysis.length === 0 ? (
              <p className="font-mono text-xs text-ink-muted dark:text-ink-darkMuted py-4 text-center">
                No category data recorded for this period.
              </p>
            ) : (
              <div className="divide-y divide-hairline-light dark:divide-hairline-dark space-y-0">
                {insights.categoryAnalysis.map((cat) => (
                  <div
                    key={cat.categoryName}
                    className="py-3 px-2 -mx-2 rounded-lg hover:bg-stone-200/30 dark:hover:bg-neutral-800/30 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <CategoryIcon name={cat.categoryName} color={cat.color} size={15} />
                      <div className="truncate flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-sans text-xs font-semibold text-ink-primary dark:text-ink-darkPrimary truncate">
                            {cat.categoryName}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-ink-primary dark:text-ink-darkPrimary tabular-nums">
                            {formatCurrency(cat.totalAmount, currency)}
                          </span>
                        </div>

                        {/* Thin Hairline Progress Bar */}
                        <div className="w-full bg-stone-200 dark:bg-stone-800 h-[2px] overflow-hidden">
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, cat.percentage)}%`,
                              backgroundColor: cat.color || '#C85A32',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono text-[11px] text-ink-secondary dark:text-ink-darkSecondary">
                      <span>{cat.percentage.toFixed(1)}%</span>
                      <span className="mx-1">•</span>
                      <span>{cat.transactionCount} txn{cat.transactionCount === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 4: DERIVED SPENDING PATTERNS */}
          <div className="border border-hairline-light dark:border-hairline-dark rounded-xl p-5 bg-canvas-light dark:bg-canvas-dark space-y-3">
            <div className="flex items-center space-x-2 border-b border-hairline-light dark:border-hairline-dark pb-2.5">
              <Sparkles size={15} className="text-clay-600 dark:text-clay-400" />
              <h3 className="font-mono text-xs font-medium uppercase tracking-wider text-ink-primary dark:text-ink-darkPrimary">
                Spending Observations
              </h3>
            </div>

            {insights.spendingPatterns.length === 0 ? (
              <p className="font-sans text-xs text-ink-secondary dark:text-ink-darkSecondary py-2">
                Log a few more transactions to unlock automated velocity and pattern analysis.
              </p>
            ) : (
              <ul className="space-y-2 pt-1">
                {insights.spendingPatterns.map((pattern, idx) => (
                  <li
                    key={idx}
                    className="font-sans text-xs text-ink-primary dark:text-ink-darkPrimary flex items-start space-x-2 leading-relaxed"
                  >
                    <span className="text-clay-600 dark:text-clay-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>{pattern}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* SECTION 5: BUDGET RELATIONSHIP & PROJECTION */}
          <div className="border border-hairline-light dark:border-hairline-dark rounded-xl p-5 bg-canvas-light dark:bg-canvas-dark space-y-4">
            <div className="flex items-center justify-between border-b border-hairline-light dark:border-hairline-dark pb-3">
              <div>
                <h3 className="font-mono text-xs font-medium uppercase tracking-wider text-ink-primary dark:text-ink-darkPrimary">
                  Budget Relationship
                </h3>
                <span className="font-sans text-xs text-ink-secondary dark:text-ink-darkSecondary">
                  Monthly allocation limit vs actual spending and linear projections.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase text-ink-secondary dark:text-ink-darkSecondary">Overall Limit</span>
                <div className="font-bold text-base text-ink-primary dark:text-ink-darkPrimary tabular-nums">
                  {formatCurrency(insights.budgetRelationship.overallBudget, currency)}
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase text-ink-secondary dark:text-ink-darkSecondary">Spent / Remaining</span>
                <div className="font-bold text-base text-ink-primary dark:text-ink-darkPrimary tabular-nums">
                  {formatCurrency(insights.budgetRelationship.totalSpent, currency)}
                  <span className="text-xs text-ink-secondary dark:text-ink-darkSecondary font-normal"> / {formatCurrency(insights.budgetRelationship.remainingBudget, currency)}</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase text-ink-secondary dark:text-ink-darkSecondary">End-of-Month Projection</span>
                <div className="font-bold text-base text-clay-600 dark:text-clay-400 tabular-nums">
                  {insights.budgetRelationship.isProjectionAvailable
                    ? formatCurrency(insights.budgetRelationship.projectedEomTotal, currency)
                    : 'N/A'}
                </div>
              </div>
            </div>

            {/* Budget Progress Rule */}
            <div className="space-y-1">
              <div className="w-full bg-stone-200 dark:bg-stone-800 h-[3px] overflow-hidden rounded-full">
                <div
                  className={`h-full transition-all duration-300 ${
                    insights.budgetRelationship.percentageUsed > 100
                      ? 'bg-rose-600'
                      : 'bg-clay-600 dark:bg-clay-500'
                  }`}
                  style={{ width: `${Math.min(100, insights.budgetRelationship.percentageUsed)}%` }}
                />
              </div>
              <div className="flex items-center justify-between font-mono text-[10px] text-ink-secondary dark:text-ink-darkSecondary">
                <span>{insights.budgetRelationship.percentageUsed.toFixed(1)}% of budget utilized</span>
                {insights.budgetRelationship.projectionNotice && (
                  <span className="italic">{insights.budgetRelationship.projectionNotice}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
